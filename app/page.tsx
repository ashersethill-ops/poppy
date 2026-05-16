"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const FULL_TEXT =
  "Hi,\n\nWe know that you are coping with one of the most challenging times in your life. Whether you have an illness or are caring for a close person with one, you are not alone and we are here for you — to ensure that you are always focused on what's most important in your journey.";

function PoppyFlowerSVG({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="32" cy="18" rx="9" ry="16" fill="#E07850" opacity="0.92" />
      <ellipse cx="32" cy="46" rx="9" ry="16" fill="#E07850" opacity="0.92" />
      <ellipse cx="18" cy="32" rx="16" ry="9" fill="#C95E35" opacity="0.85" />
      <ellipse cx="46" cy="32" rx="16" ry="9" fill="#C95E35" opacity="0.85" />
      <ellipse cx="21" cy="21" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(-45 21 21)" />
      <ellipse cx="43" cy="21" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(45 43 21)" />
      <ellipse cx="21" cy="43" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(45 21 43)" />
      <ellipse cx="43" cy="43" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(-45 43 43)" />
      <circle cx="32" cy="32" r="9" fill="#2C1810" />
      <circle cx="29" cy="29" r="1.2" fill="#5C3820" />
      <circle cx="32" cy="28" r="1.2" fill="#5C3820" />
      <circle cx="35" cy="29" r="1.2" fill="#5C3820" />
      <circle cx="30" cy="32" r="1.2" fill="#5C3820" />
      <circle cx="34" cy="32" r="1.2" fill="#5C3820" />
      <circle cx="32" cy="35" r="1.2" fill="#5C3820" />
    </svg>
  );
}

function BotanicalBlob({ size = 200, color = "#D9542B", opacity = 0.08, style }: {
  size?: number; color?: string; opacity?: number; style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={style} aria-hidden="true">
      <g opacity={opacity}>
        <ellipse cx="100" cy="55"  rx="22" ry="55" fill={color} />
        <ellipse cx="100" cy="145" rx="22" ry="55" fill={color} />
        <ellipse cx="55"  cy="100" rx="55" ry="22" fill={color} />
        <ellipse cx="145" cy="100" rx="55" ry="22" fill={color} />
        <ellipse cx="64"  cy="64"  rx="15" ry="42" fill={color} transform="rotate(-45 64 64)" />
        <ellipse cx="136" cy="64"  rx="15" ry="42" fill={color} transform="rotate(45 136 64)" />
        <ellipse cx="64"  cy="136" rx="15" ry="42" fill={color} transform="rotate(45 64 136)" />
        <ellipse cx="136" cy="136" rx="15" ry="42" fill={color} transform="rotate(-45 136 136)" />
      </g>
    </svg>
  );
}

export default function Home() {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function typeNext() {
      const i = indexRef.current;
      if (i >= FULL_TEXT.length) {
        timerRef.current = setTimeout(() => {
          setDone(true);
          setShowLinks(true);
        }, 450);
        return;
      }
      setDisplayed(FULL_TEXT.slice(0, i + 1));
      indexRef.current = i + 1;
      const char = FULL_TEXT[i];
      let delay = Math.random() * 16 + 22;
      if (char === ",") delay += 90;
      if (char === ".") delay += 160;
      if (char === "—") delay += 130;
      if (char === "\n") delay += 220;
      timerRef.current = setTimeout(typeNext, delay);
    }
    timerRef.current = setTimeout(typeNext, 700);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function skipToEnd() {
    if (done) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    indexRef.current = FULL_TEXT.length;
    setDisplayed(FULL_TEXT);
    setDone(true);
    setShowLinks(true);
  }

  return (
    <>
      <style>{`
        @keyframes gardenCursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes gardenFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .garden-cursor { animation: gardenCursorBlink 0.9s ease-in-out infinite; }
        .garden-fade-up { animation: gardenFadeUp 1.2s ease forwards; }
      `}</style>

      <div
        onClick={skipToEnd}
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
        style={{ background: "var(--background)", cursor: done ? "default" : "pointer" }}
      >
        {/* Botanical blobs */}
        <BotanicalBlob size={520} color="#D9542B" opacity={0.05} style={{ position: "absolute", top: -160, right: -180, pointerEvents: "none" }} />
        <BotanicalBlob size={300} color="#7C8E6B" opacity={0.07} style={{ position: "absolute", bottom: -100, left: -80, pointerEvents: "none" }} />

        {/* Wordmark */}
        <div style={{ padding: "36px 52px", flexShrink: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <PoppyFlowerSVG size={26} />
            <span style={{
              fontFamily: "'Newsreader', 'Lora', Georgia, serif",
              fontStyle: "italic", fontWeight: 500, fontSize: 22,
              color: "var(--ink)", letterSpacing: "-0.01em",
            }}>poppy</span>
          </div>
        </div>

        {/* Letter */}
        <div
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start",
            padding: "0 52px 60px", position: "relative",
          }}
        >
          <div style={{ maxWidth: 820, position: "relative" }}>
            <p style={{
              fontFamily: "'Newsreader', 'Lora', Georgia, serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "clamp(1.4rem, 2.6vw, 2.25rem)",
              lineHeight: 1.55, color: "var(--ink)",
              letterSpacing: "-0.005em", margin: 0, whiteSpace: "pre-wrap",
            }}>
              {displayed}
              {!done && (
                <span className="garden-cursor" style={{ color: "var(--poppy)", fontWeight: 300, marginLeft: 2 }}>|</span>
              )}
            </p>

            {/* Signature */}
            {showLinks && (
              <div
                className="garden-fade-up"
                style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 10, opacity: 0, animationDelay: "0.05s" }}
                onClick={(e) => e.stopPropagation()}
              >
                <PoppyFlowerSVG size={20} />
                <span style={{
                  fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                  fontStyle: "italic", fontSize: 18, color: "var(--ink-soft)",
                }}>— poppy</span>
              </div>
            )}

            {/* CTAs */}
            {showLinks && (
              <div
                className="garden-fade-up"
                onClick={(e) => e.stopPropagation()}
                style={{
                  marginTop: 48, display: "flex", alignItems: "center", gap: 22,
                  flexWrap: "wrap", opacity: 0, animationDelay: "0.4s",
                }}
              >
                <Link
                  href="/signup"
                  style={{
                    fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                    fontStyle: "italic", fontSize: 17,
                    color: "var(--poppy)", background: "var(--paper)",
                    border: "1px solid rgba(217,84,43,0.28)",
                    padding: "13px 26px", borderRadius: 999, cursor: "pointer", textDecoration: "none",
                    boxShadow: "0 8px 24px -10px rgba(217,84,43,0.22)",
                    display: "inline-block",
                  }}
                >
                  create an account
                </Link>

                <Link
                  href="/login"
                  style={{
                    fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                    fontStyle: "italic", fontSize: 17, color: "var(--ink)",
                    textDecoration: "none", borderBottom: "1px solid var(--ink)", paddingBottom: 2,
                  }}
                >
                  sign in
                </Link>

                <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--ink-faded)", opacity: 0.5, display: "inline-block", flexShrink: 0 }} />

                <Link
                  href="/about"
                  style={{
                    fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                    fontStyle: "italic", fontSize: 17, color: "var(--ink-soft)",
                    textDecoration: "none", borderBottom: "1px dashed var(--ink-faded)", paddingBottom: 2,
                  }}
                >
                  learn more about poppy ›
                </Link>
              </div>
            )}

            {/* Skip hint */}
            {!done && (
              <div style={{
                position: "absolute", bottom: -38, left: 0,
                fontFamily: "'Geist Mono', ui-monospace, monospace",
                fontSize: 10.5, color: "var(--ink-faded)",
                letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.7,
              }}>
                · click anywhere to skip ahead ·
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
