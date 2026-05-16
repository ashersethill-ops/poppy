"use client";

import { useState, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export type LocationData = {
  city: string;
  country: string;
  lat: number;
  lng: number;
};

type GeoResult = {
  id: number;
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  admin1?: string;
};

type Props = {
  /**
   * Pre-existing location text from the DB (e.g. "London, United Kingdom").
   * When provided, the component starts in confirmed (display) mode.
   * Reacts to changes — useful when the DB value loads asynchronously.
   */
  initialText?: string;
  /** Called when the user selects a location from the dropdown or via GPS */
  onConfirm: (data: LocationData, displayText: string) => void;
  /** Called when the user clicks "Change" to re-enter their location */
  onClear?: () => void;
  placeholder?: string;
  /** Style for the outer wrapper div */
  style?: React.CSSProperties;
  /** Style for the <input> element */
  inputStyle?: React.CSSProperties;
  inputClassName?: string;
  autoFocus?: boolean;
};

// ── Open-Meteo geocoding (free, no API key) ───────────────────────────────────

async function searchLocations(q: string): Promise<GeoResult[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
  );
  const data = await res.json();
  return (data.results ?? []) as GeoResult[];
}

function formatDisplay(r: GeoResult): string {
  return r.country ? `${r.name}, ${r.country}` : r.name;
}

function formatLabel(r: GeoResult): string {
  if (r.admin1 && r.admin1 !== r.name) return `${r.name}, ${r.admin1}`;
  return r.name;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LocationAutocomplete({
  initialText,
  onConfirm,
  onClear,
  placeholder = "e.g. London, New York, Sydney",
  style,
  inputStyle,
  inputClassName,
  autoFocus,
}: Props) {
  const trimmedInitial = initialText?.trim() ?? "";
  const [confirmed, setConfirmed]         = useState(!!trimmedInitial);
  const [confirmedText, setConfirmedText] = useState(trimmedInitial);
  const [query, setQuery]                 = useState("");
  const [suggestions, setSuggestions]     = useState<GeoResult[]>([]);
  const [open, setOpen]                   = useState(false);
  const [activeIndex, setActiveIndex]     = useState(-1);
  const [detecting, setDetecting]         = useState(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync confirmed state when initialText changes (async DB load)
  useEffect(() => {
    const t = initialText?.trim() ?? "";
    if (t) {
      setConfirmed(true);
      setConfirmedText(t);
    }
  }, [initialText]);

  // Autocomplete — debounced, min 3 chars
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }

    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(q);
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Internal confirm ──────────────────────────────────────────────────────
  function confirmLocation(data: LocationData, text: string) {
    setConfirmed(true);
    setConfirmedText(text);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onConfirm(data, text);
  }

  function select(r: GeoResult) {
    confirmLocation(
      { city: r.name, country: r.country, lat: r.latitude, lng: r.longitude },
      formatDisplay(r)
    );
  }

  function handleChange() {
    setConfirmed(false);
    setConfirmedText("");
    setQuery("");
    onClear?.();
  }

  // ── Browser GPS → Nominatim reverse geocode ───────────────────────────────
  async function handleDetect() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await res.json() as {
        address?: {
          city?: string; town?: string; village?: string;
          suburb?: string; county?: string; state?: string; country?: string;
        };
      };
      const addr = data.address ?? {};
      const city    = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? addr.county ?? addr.state ?? "";
      const country = addr.country ?? "";
      const text    = city && country ? `${city}, ${country}` : city || country;
      if (text) {
        confirmLocation({ city, country, lat: latitude, lng: longitude }, text);
      }
    } catch {
      // silent — user can type manually
    } finally {
      setDetecting(false);
    }
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────
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
      select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // ── Confirmed mode ────────────────────────────────────────────────────────
  if (confirmed && confirmedText) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", ...style }}>
        <span style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontStyle: "italic",
          fontSize: 15,
          color: "var(--ink, #241A14)",
        }}>
          {confirmedText}
        </span>
        <button
          type="button"
          onClick={handleChange}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--accent, #c4956a)",
            textDecoration: "underline", textUnderlineOffset: 2,
            padding: 0, flexShrink: 0,
          }}
        >
          Change
        </button>
      </div>
    );
  }

  // ── Editing mode ──────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: "relative", ...style }}>
      <div style={{ display: "flex", gap: 8 }}>
        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className={inputClassName}
          style={{ flex: 1, minWidth: 0, ...inputStyle }}
        />

        {/* GPS button */}
        <button
          type="button"
          onClick={handleDetect}
          disabled={detecting}
          title="Use my current location"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 14px", borderRadius: 12,
            fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0,
            background: "var(--soft, #F4ECDF)", color: "var(--primary, #7c6f5e)",
            border: "1px solid #d4c4b0", cursor: "pointer",
            opacity: detecting ? 0.5 : 1, transition: "opacity 0.15s",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {detecting ? "Locating…" : "Use my location"}
        </button>
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100,
          background: "var(--paper, #FFFCF7)",
          borderRadius: 14, border: "1px solid rgba(91,74,59,0.18)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}>
          {suggestions.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(r); }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 16px", textAlign: "left",
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
              <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink, #241A14)" }}>
                  {formatLabel(r)}
                </span>
                <span style={{
                  fontFamily: "'Geist Mono', ui-monospace, monospace",
                  fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const,
                  color: "var(--ink-faded, #937A62)",
                }}>
                  {r.country}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
