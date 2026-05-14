"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lora } from "next/font/google";

const lora = Lora({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"] });

const FULL_TEXT =
  "Hi,\n\nWe know that you are coping with one of the most challenging times in your life. Whether you have an illness or are caring for a close person with one, you are not alone and we are here for you — to ensure that you are always focused on what's most important in your journey.";

export default function Home() {
  const [displayed, setDisplayed] = useState("");
  const [showLinks, setShowLinks] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function typeNext() {
      const i = indexRef.current;

      if (i >= FULL_TEXT.length) {
        timerRef.current = setTimeout(() => {
          setHideCursor(true);
          setShowLinks(true);
        }, 500);
        return;
      }

      setDisplayed(FULL_TEXT.slice(0, i + 1));
      indexRef.current = i + 1;

      const char = FULL_TEXT[i];
      let delay = Math.random() * 18 + 22; // 22–40 ms natural variation
      if (char === ",") delay += 90;
      if (char === ".") delay += 160;
      if (char === "—") delay += 130;
      if (char === "\n") delay += 220;

      timerRef.current = setTimeout(typeNext, delay);
    }

    timerRef.current = setTimeout(typeNext, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor-blink {
          animation: blink 0.85s ease-in-out infinite;
        }
        @keyframes linksIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .links-appear {
          animation: linksIn 1.4s ease forwards;
        }
      `}</style>

      {/* Full-screen overlay — sits above header and Poppy button */}
      <div
        className="fixed inset-0 z-[100] flex items-start"
        style={{ background: "var(--background)" }}
      >
        <div className="px-10 py-16 md:px-24 md:py-28 w-full max-w-3xl">

          {/* Typewriter text */}
          <p
            className={lora.className}
            style={{
              fontSize: "clamp(1.15rem, 2.4vw, 1.55rem)",
              lineHeight: 2,
              color: "var(--primary)",
              whiteSpace: "pre-wrap",
              letterSpacing: "0.012em",
              fontWeight: 400,
            }}
          >
            {displayed}
            {!hideCursor && (
              <span
                className="cursor-blink"
                style={{ color: "var(--accent)", fontWeight: 300 }}
              >
                |
              </span>
            )}
          </p>

          {/* Links — fade in after typing finishes */}
          {showLinks && (
            <div className="links-appear mt-12 flex items-center gap-7">
              <Link
                href="/signup"
                className={lora.className}
                style={{
                  fontSize: "1rem",
                  color: "var(--primary)",
                  borderBottom: "1px solid var(--primary)",
                  paddingBottom: "2px",
                  textDecoration: "none",
                  letterSpacing: "0.03em",
                  opacity: 0.9,
                }}
              >
                Create an account
              </Link>

              <span style={{ color: "var(--soft)", fontSize: "1.2rem", lineHeight: 1 }}>·</span>

              <Link
                href="/login"
                className={lora.className}
                style={{
                  fontSize: "1rem",
                  color: "var(--accent)",
                  textDecoration: "none",
                  letterSpacing: "0.03em",
                }}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
