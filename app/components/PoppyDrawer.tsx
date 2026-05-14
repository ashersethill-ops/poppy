"use client";

import { useEffect, useRef, useState } from "react";
import PoppyIcon from "./PoppyIcon";
import { usePoppyContext } from "./PoppyProvider";

export default function PoppyDrawer() {
  const { conditions, documents, pageContext, patientOverride, messages, setMessages, isOpen, setIsOpen } = usePoppyContext();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const body = patientOverride
        ? {
            messages: newMessages,
            conditions: patientOverride.conditions,
            pageContext,
            documentIds: patientOverride.documentIds,
            patientId: patientOverride.patientId,
            isDoctor: true,
          }
        : {
            messages: newMessages,
            conditions,
            pageContext,
            documentIds: documents.map((d) => d.id),
          };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ background: "var(--accent)" }}
          aria-label="Open Poppy chat"
        >
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: "var(--accent)" }}
          />
          <PoppyIcon size={28} />
        </button>
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-[380px] z-50 flex flex-col shadow-2xl transition-transform duration-300"
        style={{
          background: "var(--background)",
          borderLeft: "1px solid var(--soft)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-4"
          style={{ borderBottom: "1px solid var(--soft)" }}
        >
          <PoppyIcon size={28} />
          <span className="font-semibold text-lg flex-1" style={{ color: "var(--primary)" }}>
            Ask Poppy
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
            style={{ color: "var(--primary)" }}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
              <PoppyIcon size={40} />
              <p className="text-sm" style={{ color: "var(--primary)" }}>
                {patientOverride
                  ? `I'm reviewing ${patientOverride.patientName}'s medical record with you. I have access to their ${patientOverride.documentIds.length} document${patientOverride.documentIds.length !== 1 ? "s" : ""}. Ask me anything about this patient.`
                  : documents.length > 0
                    ? `Hi! I'm Poppy. I've read your ${documents.length} document${documents.length > 1 ? "s" : ""} and know your full medical context. Ask me anything.`
                    : "Hi! I'm Poppy. Ask me anything about your conditions or how to use the app."
                }
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[280px] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--soft)", color: "var(--foreground)" }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3 rounded-2xl flex gap-1 items-center"
                style={{ background: "var(--soft)" }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-4 py-4 flex gap-2"
          style={{ borderTop: "1px solid var(--soft)" }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Poppy anything…"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
            style={{
              background: "var(--soft)",
              color: "var(--foreground)",
              border: "1px solid transparent",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
