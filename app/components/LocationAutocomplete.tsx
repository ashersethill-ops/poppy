"use client";

import { useState, useEffect, useRef } from "react";

type NominatimResult = {
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    state?: string;
    country?: string;
  };
};

function formatResult(r: NominatimResult): string {
  const a = r.address ?? {};
  const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.state ?? "";
  const country = a.country ?? "";
  return city && country ? `${city}, ${country}` : city || country || r.display_name;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Style applied to the outer wrapper div */
  style?: React.CSSProperties;
  /** Style applied to the <input> element */
  inputStyle?: React.CSSProperties;
  inputClassName?: string;
  autoFocus?: boolean;
  /** When provided, a "Detect" button appears that calls this handler */
  onDetect?: () => void;
  detecting?: boolean;
};

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "e.g. London, New York, Sydney",
  style,
  inputStyle,
  inputClassName,
  autoFocus,
  onDetect,
  detecting,
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions on debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: NominatimResult[] = await res.json();
        const deduped = [...new Set(data.map(formatResult))].slice(0, 5);
        setSuggestions(deduped);
        setOpen(deduped.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      onChange(suggestions[activeIndex]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function select(s: string) {
    onChange(s);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", ...style }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className={inputClassName}
          style={{ flex: 1, minWidth: 0, ...inputStyle }}
        />
        {onDetect && (
          <button
            type="button"
            onClick={onDetect}
            disabled={detecting}
            title="Use my current location"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 14px", borderRadius: 12,
              fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0,
              background: "var(--soft)", color: "var(--primary)",
              border: "1px solid #d4c4b0", cursor: "pointer",
              opacity: detecting ? 0.5 : 1, transition: "opacity 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {detecting ? "Locating…" : "Detect"}
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100,
          background: "var(--paper, #FFFCF7)",
          borderRadius: 14, border: "1px solid rgba(91,74,59,0.18)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "11px 16px", textAlign: "left",
                background: activeIndex === i ? "var(--soft, #F4ECDF)" : "transparent",
                border: "none",
                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(91,74,59,0.10)" : "none",
                cursor: "pointer", transition: "background 0.1s",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faded, #937A62)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 14, color: "var(--ink, #241A14)",
              }}>
                {s}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
