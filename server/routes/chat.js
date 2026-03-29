import express from 'express';
import { supabase } from '../services/supabase.js';
import { hybridSearch } from '../services/embeddings.js';
import {
  generateRAGChatReply,
  buildRagChatMessagesAsync,
  checkGuardrail,
  streamChatCompletion,
  resolveChatProvider,
  parseRagAssistantOutput,
  ragFallbackText,
  ragDefaultSuggestions as ragDefaultSuggestionsFn,
  estimateTokensFromMessages,
  estimateCostUsdFromTokens,
  activeChatModelForLogging,
} from '../services/aiService.js';

const router = express.Router();

// GET /api/chat/history
router.get('/history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      if (String(error.message || '').includes("Could not find the table 'public.chat_messages'")) {
        return res.json({ messages: [], fallback: true });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.json({ messages: data || [] });
  } catch (err) {
    console.error('Chat history error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { content, session_id } = req.body || {};
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'content required' });
    if (String(content).length > 2000) return res.status(400).json({ error: 'content must be <= 2000 characters' });

    const sid = session_id || `session_${req.userId}_${Date.now()}`;

    const { data: userMessage, error: userErr } = await supabase
      .from('chat_messages')
      .insert({ user_id: req.userId, session_id: sid, role: 'user', content: String(content).trim() })
      .select('*')
      .single();
    if (userErr) return res.status(400).json({ error: userErr.message });

    const { data: hist, error: histErr } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', req.userId)
      .eq('session_id', sid)
      .order('created_at', { ascending: false })
      .limit(10);
    if (histErr) return res.status(400).json({ error: histErr.message });
    const chronological = (hist || []).reverse();
    const chatHistoryForRag = chronological.slice(0, -1);

    const reply = await generateRAGChatReply({
      userMessage: String(content).trim(),
      chatHistory: chatHistoryForRag,
      userId: req.userId,
      sessionId: sid,
    });

    const { data: assistantMessage, error: assistErr } = await supabase
      .from('chat_messages')
      .insert({
        user_id: req.userId,
        session_id: sid,
        role: 'assistant',
        content: reply.text ?? '',
        retrieved_items: reply.retrievedItems || [],
        tokens_used: reply.tokensUsed ?? 0,
        model_used: reply.modelUsed ?? null,
        latency_ms: reply.latencyMs ?? 0,
      })
      .select('*')
      .single();
    if (assistErr) return res.status(400).json({ error: assistErr.message });

    return res.json({
      userMessage,
      assistantMessage: {
        ...assistantMessage,
        suggestions: reply.suggestions || [],
        retrievedItems: reply.retrievedItems || [],
        retrievalMode: reply.retrievalMode,
        blocked: !!reply.blocked,
        guardCategory: reply.guardCategory || null,
      },
    });
  } catch (err) {
    console.error('Chat message error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chat/message/stream — SSE (Gemini streams; others send one delta)
router.post('/message/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { content, session_id } = req.body || {};
    if (!content || !String(content).trim()) {
      send({ type: 'error', message: 'content required' });
      return res.end();
    }
    if (String(content).length > 2000) {
      send({ type: 'error', message: 'content must be <= 2000 characters' });
      return res.end();
    }

    const sid = session_id || `session_${req.userId}_${Date.now()}`;
    const userMsgText = String(content).trim();

    const { data: userMessage, error: userErr } = await supabase
      .from('chat_messages')
      .insert({
        user_id: req.userId,
        session_id: sid,
        role: 'user',
        content: userMsgText,
      })
      .select('*')
      .single();
    if (userErr) {
      send({ type: 'error', message: userErr.message });
      return res.end();
    }

    let guard;
    try {
      guard = await checkGuardrail(userMsgText);
    } catch {
      guard = { safe: true, category: 'travel', redirect: null };
    }

    if (!guard.safe) {
      const blockText =
        guard.redirect?.trim() ||
        'I can only help with Morocco travel and using Morocco With You.';
      const tBlocked = Date.now();
      const { data: assistantMessage, error: assistErr } = await supabase
        .from('chat_messages')
        .insert({
          user_id: req.userId,
          session_id: sid,
          role: 'assistant',
          content: blockText,
          retrieved_items: [],
          tokens_used: 0,
          model_used: 'guardrail',
          latency_ms: 0,
        })
        .select('*')
        .single();
      if (assistErr) {
        send({ type: 'error', message: assistErr.message });
        return res.end();
      }
      if (req.userId) {
        await supabase
          .from('ai_logs')
          .insert({
            user_id: req.userId,
            feature: 'chat',
            prompt: userMsgText.slice(0, 500),
            status: 'blocked',
            model: 'guardrail',
            output_ref: sid || null,
            latency_ms: Date.now() - tBlocked,
            retrieval_mode: 'guardrail_blocked',
            items_retrieved: 0,
            tokens_used: 0,
            error_msg: `guardrail:${guard.category}`,
          })
          .catch(() => {});
      }
      send({
        type: 'done',
        userMessage,
        assistantMessage: {
          ...assistantMessage,
          suggestions: ragDefaultSuggestionsFn(),
          retrievedItems: [],
          retrievalMode: 'guardrail_blocked',
        },
      });
      return res.end();
    }

    send({ type: 'status', message: 'Searching catalogue...' });

    let retrievedItems = [];
    let retrievalMode = 'none';
    try {
      retrievedItems = await hybridSearch({
        query: userMsgText,
        limit: 6,
        vectorWeight: 0.65,
        keywordWeight: 0.35,
      });
      retrievalMode = retrievedItems.length
        ? retrievedItems[0]?.searchMode || 'hybrid'
        : 'none';
    } catch (e) {
      console.error('[RAG stream] Retrieval failed:', e.message);
    }
    send({ type: 'retrieved', items: retrievedItems });

    const { data: hist, error: histErr } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', req.userId)
      .eq('session_id', sid)
      .order('created_at', { ascending: false })
      .limit(10);
    if (histErr) {
      send({ type: 'error', message: histErr.message });
      return res.end();
    }
    const chronological = (hist || []).reverse();
    const chatHistoryForRag = chronological.slice(0, -1);

    const { messages } = await buildRagChatMessagesAsync({
      userMessage: userMsgText,
      chatHistory: chatHistoryForRag,
      retrievedItems,
    });

    send({ type: 'status', message: 'Generating response...' });

    const t0 = Date.now();
    let fullRaw = '';
    let llmError = null;

    if (resolveChatProvider() !== 'none') {
      try {
        fullRaw = await streamChatCompletion(messages, (ev) => {
          if (ev?.type === 'delta' && ev.content) send(ev);
        });
      } catch (e) {
        llmError = String(e?.message || e);
      }
    }

    let text = '';
    let suggestions = ragDefaultSuggestionsFn();
    if (resolveChatProvider() === 'none' || llmError) {
      text = ragFallbackText(userMsgText);
      if (llmError) suggestions = ragDefaultSuggestionsFn();
    } else {
      const parsed = parseRagAssistantOutput(fullRaw);
      text = parsed.text;
      suggestions = parsed.suggestions;
    }

    const latencyMs = Date.now() - t0;
    const tokensUsed =
      estimateTokensFromMessages(messages) +
      Math.ceil(String(fullRaw || text).length / 4);
    const modelUsed = activeChatModelForLogging();
    const costUsd = estimateCostUsdFromTokens(tokensUsed);

    const { data: assistantMessage, error: assistErr } = await supabase
      .from('chat_messages')
      .insert({
        user_id: req.userId,
        session_id: sid,
        role: 'assistant',
        content: text ?? '',
        retrieved_items: retrievedItems || [],
        tokens_used: tokensUsed,
        model_used: modelUsed ?? null,
        latency_ms: latencyMs,
      })
      .select('*')
      .single();

    if (assistErr) {
      send({ type: 'error', message: assistErr.message });
      return res.end();
    }

    if (req.userId) {
      const { error: logErr } = await supabase.from('ai_logs').insert({
        user_id: req.userId,
        feature: 'chat',
        prompt: userMsgText.slice(0, 500),
        tokens_used: tokensUsed,
        status: llmError ? 'error' : 'success',
        model: modelUsed || 'rag-chat',
        output_ref: sid || null,
        latency_ms: latencyMs,
        retrieval_mode: retrievalMode,
        items_retrieved: retrievedItems.length,
        cost_usd: costUsd,
        error_msg: llmError || null,
      });
      if (logErr) console.error('[LOG] ai_logs stream:', logErr.message);
    }

    send({
      type: 'done',
      userMessage,
      assistantMessage: {
        ...assistantMessage,
        suggestions,
        retrievedItems,
        retrievalMode,
      },
    });
    return res.end();
  } catch (err) {
    console.error('Chat stream error:', err);
    send({ type: 'error', message: err.message || 'Internal server error' });
    return res.end();
  }
});

// DELETE /api/chat/history
router.delete('/history', async (req, res) => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', req.userId);
    if (error) {
      if (String(error.message || '').includes("Could not find the table 'public.chat_messages'")) {
        return res.json({ success: true, fallback: true });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Chat clear error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
