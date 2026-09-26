import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { ChatMessage } from "../hooks/useChat";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
}

export function ChatPanel({ messages, onSend, onClose }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <motion.div
      className="chat-panel"
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="chat-panel-header">
        <span>In-Call Chat</span>
        <button type="button" className="chat-panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="chat-panel-messages">
        {messages.length === 0 && (
          <p className="chat-panel-empty">No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.isLocal ? "chat-msg-local" : ""}`}>
            <div className="chat-msg-meta">
              <span className="chat-msg-sender">{m.isLocal ? "You" : m.senderName}</span>
              <span className="chat-msg-time">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="chat-msg-text">{m.text}</div>
          </div>
        ))}
        <div ref={listEndRef} />
      </div>

      <form className="chat-panel-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="chat-panel-input"
        />
        <button type="submit" className="chat-panel-send" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </motion.div>
  );
}
