import { useEffect, useRef } from "react";
import ChatBubble from "../components/ui/ChatBubble";
import { Ico } from "../icons";
import { useChat } from "../../hooks/useChat";
import { useState } from "react";

export default function ChatPage({ compact = false, onOpenCatalogueItem }) {
  const { messages, typing, sendMessage, clearConversation } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text) => {
    if (!text?.trim()) return;
    sendMessage(text.trim());
    setInput("");
  };

  const wrapperStyle = compact
    ? { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }
    : { display: "flex", flexDirection: "column", height: "100dvh" };

  return (
    <div style={wrapperStyle}>
      {/* Header — hidden in compact/panel mode */}
      {!compact && (
        <div className="glass sticky top-0 z-10 px-5 md:px-8 py-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--light-clay)", flexShrink: 0 }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>AI</div>
          <div>
            <p className="font-medium text-sm" style={{ color: "var(--ink)" }}>Morocco AI Guide</p>
            <p className="text-xs" style={{ color: "var(--sage)" }}>● Online</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={clearConversation} title="Clear conversation"
              className="text-xs px-3 py-1.5 rounded-xl"
              style={{ background: "var(--light-clay)", color: "var(--smoke)", border: "none", cursor: "pointer" }}>
              Clear
            </button>
            <span style={{ color: "var(--smoke)" }}><Ico.Globe /></span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: compact ? "12px 14px" : undefined }}
        className={compact ? "" : "px-4 md:px-8 py-6"}>
        <div style={{ maxWidth: compact ? "100%" : undefined }} className={compact ? "" : "max-w-3xl mx-auto"}>
          {messages.map((msg, i) => (
            <div key={i}>
              <ChatBubble msg={msg} onOpenCatalogueItem={onOpenCatalogueItem} />
              {msg.suggestions?.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="chip chip-inactive mb-2 mr-2"
                  style={{ fontSize: 11, marginLeft: compact ? 0 : 36 }}>
                  {s}
                </button>
              ))}
            </div>
          ))}
          {typing && <ChatBubble isTyping />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        borderTop: "1px solid var(--light-clay)",
        padding: compact ? "10px 14px" : undefined,
        flexShrink: 0,
        background: "rgba(250,246,238,.92)",
        backdropFilter: "blur(12px)",
      }} className={compact ? "" : "glass px-4 md:px-8 py-4"}>
        <div className={compact ? "" : "max-w-3xl mx-auto"} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 16, background: "var(--sand)", border: "1.5px solid var(--clay)", minHeight: 44 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Ask about Morocco…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: compact ? 13 : 14, color: "var(--ink)", fontFamily: "'DM Sans',sans-serif" }} />
            {!compact && (
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--smoke)" }}><Ico.Mic /></button>
            )}
          </div>
          <button onClick={() => send(input)} disabled={!input.trim()}
            style={{ width: compact ? 42 : 48, height: compact ? 42 : 48, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: input.trim() ? "linear-gradient(135deg,var(--terracotta),var(--deep))" : "var(--light-clay)", color: input.trim() ? "#fff" : "var(--smoke)", border: "none", cursor: input.trim() ? "pointer" : "not-allowed", boxShadow: input.trim() ? "0 6px 20px rgba(192,101,74,.3)" : "none" }}>
            <Ico.Send />
          </button>
        </div>
        {!compact && (
          <p className="text-center text-xs mt-2" style={{ color: "var(--clay)" }}>
            AI responses are curated suggestions, not professional travel advice.
          </p>
        )}
      </div>
    </div>
  );
}
