/**
 * Google Gemini API — free tier via AI Studio (https://aistudio.google.com/apikey).
 * Embeddings: use model gemini-embedding-001 (embedContent). text-embedding-004 is not valid here.
 * Default outputDimensionality 768 → matches schema_pgvector_ollama_768.sql.
 * @see https://ai.google.dev/api/embeddings
 */

const V1 = 'https://generativelanguage.googleapis.com/v1beta';

export function geminiApiKey() {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    ''
  );
}

export function geminiEmbedModel() {
  return process.env.GEMINI_EMBED_MODEL?.trim() || 'gemini-embedding-001';
}

/** Must match catalogue_embeddings vector(N) in Supabase (768 for schema_pgvector_ollama_768.sql). */
export function geminiEmbedOutputDimensionality() {
  const n = Number(process.env.GEMINI_EMBED_OUTPUT_DIM);
  return Number.isFinite(n) && n > 0 ? n : 768;
}

/** Default: 2.0 Flash is deprecated; 2.5 Flash is the current stable fast model (see ai.google.dev models). */
export function geminiChatModel() {
  return process.env.GEMINI_CHAT_MODEL?.trim() || 'gemini-2.5-flash';
}

/**
 * @param {string} text
 * @param {{ taskType?: string }} [opts] RETRIEVAL_DOCUMENT for catalogue rows, RETRIEVAL_QUERY for search
 * @returns {Promise<number[]>}
 */
export async function geminiEmbed(text, opts = {}) {
  const key = geminiApiKey();
  if (!key) throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY is not set');

  const model = geminiEmbedModel();
  const taskType = opts.taskType || 'RETRIEVAL_DOCUMENT';
  const url = `${V1}/models/${model}:embedContent?key=${encodeURIComponent(key)}`;
  const outputDimensionality = geminiEmbedOutputDimensionality();

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text: String(text).slice(0, 8000) }] },
      taskType,
      outputDimensionality,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data).slice(0, 300);
    throw new Error(`Gemini embed ${res.status}: ${msg}`);
  }

  const values = data.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error('Gemini embed: missing embedding.values');
  }
  return values;
}

/**
 * @param {{ role: string, content: string }[]} messages OpenAI-style roles: system, user, assistant
 * @returns {Promise<string>} model text (JSON string when using json mode)
 */
export async function geminiGenerateContent(messages) {
  const key = geminiApiKey();
  if (!key) throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY is not set');

  const model = geminiChatModel();
  const systemParts = [];
  const contents = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push({ text: m.content });
      continue;
    }
    const role = m.role === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: m.content }] });
  }

  const url = `${V1}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  };
  if (systemParts.length) {
    body.systemInstruction = { parts: systemParts };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data).slice(0, 300);
    throw new Error(`Gemini chat ${res.status}: ${msg}`);
  }

  const parts = data.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p) => p?.text ?? '').join('')
    : '';
  if (!text && data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
  }
  return text;
}

/**
 * Stream chat completions (SSE). Yields incremental text fragments.
 * @param {{ role: string, content: string }[]} messages
 * @returns {AsyncGenerator<string, void, void>}
 */
export async function* geminiGenerateContentStream(messages) {
  const key = geminiApiKey();
  if (!key) throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY is not set');

  const model = geminiChatModel();
  const systemParts = [];
  const contents = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push({ text: m.content });
      continue;
    }
    const role = m.role === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: m.content }] });
  }

  const url = `${V1}/models/${model}:streamGenerateContent?key=${encodeURIComponent(key)}&alt=sse`;
  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  };
  if (systemParts.length) {
    body.systemInstruction = { parts: systemParts };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || JSON.stringify(errData).slice(0, 300);
    throw new Error(`Gemini stream ${res.status}: ${msg}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Gemini stream: no response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const data = JSON.parse(payload);
        const parts = data.candidates?.[0]?.content?.parts;
        const chunk = Array.isArray(parts)
          ? parts.map((p) => p?.text ?? '').join('')
          : '';
        if (chunk) yield chunk;
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}
