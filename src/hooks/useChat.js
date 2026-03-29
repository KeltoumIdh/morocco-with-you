import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { INITIAL_MSGS, AI_REPLIES } from "../user/data/chat";

function buildWelcome(user) {
  const name = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0];
  if (!name) return INITIAL_MSGS[0];
  return {
    role: "assistant",
    text: `Marhaba ${name}! I'm your personal Moroccan travel guide. Ask me anything — hidden medina gems to the best time to visit the Sahara.`,
    suggestions: ["Plan my 7-day trip", "Best riads in Marrakech", "When to visit?"],
  };
}

export function useChat() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [messages, setMessages] = useState(() => [buildWelcome(null)]);
  const [typing, setTyping]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const sessionId = useRef(`session_${Date.now()}`);

  // Personalise welcome message when user logs in
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [buildWelcome(user)];
      }
      return prev;
    });
  }, [user?.id]);

  // Load history on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    chatApi.history()
      .then((res) => {
        const history = res.messages || [];
        if (history.length > 0) {
          const mapped = history.map((m) => ({
            role: m.role,
            text: m.content,
            retrievedItems: Array.isArray(m.retrieved_items) ? m.retrieved_items : m.retrievedItems,
          }));
          setMessages([buildWelcome(user), ...mapped]);
          const last = history[history.length - 1];
          if (last?.session_id) sessionId.current = last.session_id;
        }
      })
      .catch(() => { /* keep default welcome message */ })
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.id]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim()) return;
    const userMsg = { role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setTyping(true);
    setError(null);

    try {
      if (isAuthenticated) {
        let streamed = "";
        let streamErr = null;
        await chatApi.sendStream(
          { content: text.trim(), session_id: sessionId.current },
          (ev) => {
            if (ev.type === "error") {
              streamErr = new Error(ev.message || "Stream error");
              return;
            }
            if (ev.type === "delta" && ev.content) {
              streamed += ev.content;
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant" && last.streaming) {
                  next[next.length - 1] = { ...last, text: streamed };
                  return next;
                }
                return [
                  ...next,
                  { role: "assistant", text: streamed, streaming: true },
                ];
              });
              setTyping(false);
            }
            if (ev.type === "done" && ev.assistantMessage) {
              const am = ev.assistantMessage;
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = {
                    role: "assistant",
                    text: am.content,
                    suggestions: am.suggestions || [],
                    retrievedItems:
                      am.retrievedItems || am.retrieved_items || [],
                  };
                }
                return next;
              });
            }
          }
        );
        if (streamErr) throw streamErr;
      } else {
        // Offline / unauthenticated: use local keyword matching
        await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600));
        const reply = AI_REPLIES[text.trim()] ||
          "That's a wonderful question about Morocco! Tell me more about your travel dates and what kind of experience you're looking for?";
        setMessages((m) => [...m, { role: "assistant", text: reply }]);
      }
    } catch (e) {
      setError(e.message);
      // Still show a fallback reply so the UI doesn't hang
      setMessages((m) => [...m, {
        role: "assistant",
        text: "I'm having a moment — please try again. In the meantime, feel free to explore our experiences!",
      }]);
    } finally {
      setTyping(false);
    }
  }, [isAuthenticated]);

  const clearConversation = useCallback(() => {
    sessionId.current = `session_${Date.now()}`;
    setMessages([buildWelcome(user)]);
    if (isAuthenticated) chatApi.clear().catch(() => {});
  }, [user, isAuthenticated]);

  return { messages, typing, loading, error, sendMessage, clearConversation, sessionId: sessionId.current };
}
