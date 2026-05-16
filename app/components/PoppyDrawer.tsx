"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import PoppyIcon from "./PoppyIcon";
import { usePoppyContext } from "./PoppyProvider";

const PUBLIC_ROUTES = new Set(["/", "/about", "/login", "/signup", "/terms", "/onboarding"]);

export default function PoppyDrawer() {
  const pathname = usePathname();
  const { conditions, documents, pageContext, patientOverride, messages, setMessages, isOpen, setIsOpen } = usePoppyContext();

  // Never show on public / logged-out pages
  if (PUBLIC_ROUTES.has(pathname)) return null;
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

  const docCount = patientOverride ? patientOverride.documentIds.length : documents.length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(36,26,20,0.28)", backdropFilter: "blur(1px)" }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating trigger button — Garden style */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-7 right-7 z-50 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 poppy-fab"
          style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "var(--background)", border: "1px solid var(--rule)",
            boxShadow: "0 14px 28px -10px rgba(36,26,20,0.28), 0 0 0 1px rgba(217,84,43,0.10)",
            cursor: "pointer", padding: 0,
          }}
          aria-label="Ask Poppy"
        >
          {/* Animated pulse ring */}
          <span className="poppy-pulse-ring" />
          <PoppyIcon size={34} />
        </button>
      )}

      <style>{`
        @keyframes poppyPulse {
          0%   { transform: scale(1);    opacity: 0.55; }
          60%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes poppyGlow {
          0%, 100% { box-shadow: 0 14px 28px -10px rgba(36,26,20,0.28), 0 0 0 1px rgba(217,84,43,0.10); }
          50%       { box-shadow: 0 14px 28px -10px rgba(36,26,20,0.28), 0 0 0 1px rgba(217,84,43,0.10), 0 0 18px 4px rgba(217,84,43,0.22); }
        }
        .poppy-fab       { animation: poppyGlow 2.8s ease-in-out infinite; }
        .poppy-pulse-ring {
          position: absolute; inset: -7px; border-radius: 50%;
          border: 2px solid var(--poppy);
          animation: poppyPulse 2.8s ease-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300"
        style={{
          width: "380px",
          background: "var(--background)",
          borderLeft: "1px solid var(--rule)",
          boxShadow: isOpen ? "-14px 0 38px -8px rgba(36,26,20,0.20)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <PoppyIcon size={28} />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontStyle: "italic", fontSize: 20, color: "var(--ink)" }}>
              ask poppy
            </span>
            <div style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 9.5, color: "var(--ink-faded)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 1 }}>
              {docCount > 0 ? `reading · ${docCount} document${docCount !== 1 ? "s" : ""}` : "no documents yet"}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
            style={{ color: "var(--ink-soft)", background: "transparent", border: "none" }}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4" style={{ padding: "20px 22px" }}>
          {messages.length === 0 && (
            <div style={{ alignSelf: "flex-start", display: "flex", gap: 10, maxWidth: "95%" }}>
              <PoppyIcon size={22} />
              <div style={{
                background: "var(--soft)", padding: "12px 16px",
                borderRadius: "4px 16px 16px 16px",
                fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                fontStyle: "italic", fontSize: 14.5, lineHeight: 1.55,
                color: "var(--ink)",
              }}>
                {patientOverride
                  ? `I'm reviewing ${patientOverride.patientName}'s records with you. I have access to ${patientOverride.documentIds.length} document${patientOverride.documentIds.length !== 1 ? "s" : ""}. Ask me anything about this patient.`
                  : docCount > 0
                    ? `I've read all ${docCount} of your documents. Ask me anything — even the question you haven't been able to say out loud.`
                    : "Ask me anything about your conditions or how to navigate your care journey."
                }
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", display: "flex", gap: 10, maxWidth: "90%" }}
            >
              {msg.role === "assistant" && <PoppyIcon size={22} />}
              <div style={{
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                fontSize: 14.5, lineHeight: 1.6, color: "var(--ink)",
                background: msg.role === "user" ? "var(--bg-warm)" : "var(--paper)",
                border: msg.role === "assistant" ? "1px solid var(--rule)" : "none",
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: "flex-start", display: "flex", gap: 10 }}>
              <PoppyIcon size={22} />
              <div style={{ background: "var(--soft)", padding: "14px 18px", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--poppy)", display: "inline-block", width: 6, height: 6, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div style={{ padding: "14px 18px 18px", borderTop: "1px solid var(--rule)", background: "var(--soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 14, background: "var(--paper)", border: "1px solid var(--rule)" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ask poppy anything…"
              disabled={loading}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                fontStyle: "italic", fontSize: 14.5, color: "var(--ink)",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 30, height: 30, borderRadius: 999,
                background: "var(--poppy)", color: "white", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", opacity: (!input.trim() || loading) ? 0.4 : 1,
                fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                fontStyle: "italic", fontSize: 16,
              }}
            >
              ↵
            </button>
          </div>
          <div style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 9.5, color: "var(--ink-faded)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 8, textAlign: "center" }}>
            poppy reads your documents · she does not replace your doctor
          </div>
        </div>
      </div>
    </>
  );
}
