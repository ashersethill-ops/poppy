"use client";

import { useEffect, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";
import GeneralContentBanner from "../components/GeneralContentBanner";
import AILoadingMessage from "../components/AILoadingMessage";
import UpdateButton from "../components/UpdateButton";

const SPECIALIST_MESSAGES = [
  "Finding specialists for your conditions…",
  "Reviewing practitioner credentials and expertise…",
  "Checking who is currently accepting patients…",
  "Matching specialties to your specific needs…",
  "Sourcing the most relevant experts for you…",
  "Looking up hospital affiliations and locations…",
];

type Category = "physician" | "mental_support" | "complementary";

type Specialist = {
  name: string;
  title: string;
  specialty: string;
  subspecialty: string;
  bio: string;
  whyContact: string;
  hospital: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  portraitIndex: number;
  acceptingPatients: boolean;
  category: Category;
  nearLocation?: boolean;
};

const TABS: { id: Category; label: string; description: string }[] = [
  { id: "physician",      label: "Physicians",       description: "Doctors & specialist physicians treating your conditions directly." },
  { id: "mental_support", label: "Mental Support",   description: "Psychologists, counsellors & social workers for the emotional side." },
  { id: "complementary",  label: "Complementary",    description: "Physiotherapists, nutritionists & evidence-based alternative care." },
];

// ── Garden atoms ──────────────────────────────────────────────────────────────

const Overline = ({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) => (
  <span style={{
    fontFamily: "'Geist Mono', ui-monospace, monospace",
    fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
    color: color ?? "var(--ink-faded)", ...style,
  }}>
    {children}
  </span>
);

const GardenPaper = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div style={{ background: "var(--paper)", borderRadius: 18, border: "1px solid var(--rule)", ...style }}>
    {children}
  </div>
);

const PORTRAIT_COLORS: Record<Category, string[]> = {
  physician:      ["var(--poppy)", "#C96B7A", "var(--accent)"],
  mental_support: ["var(--sage)", "#7C8E6B", "#5a9a6b"],
  complementary:  ["var(--gold)", "#B07E2C", "var(--accent)"],
};

const TAB_COLOR: Record<Category, string> = {
  physician:      "var(--poppy)",
  mental_support: "var(--sage)",
  complementary:  "var(--gold)",
};

// ── Portrait ──────────────────────────────────────────────────────────────────

function SpecialistPortrait({
  specialist,
  size = 56,
  color,
}: {
  specialist: Specialist;
  size?: number;
  color: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = `https://randomuser.me/api/portraits/${specialist.gender}/${specialist.portraitIndex}.jpg`;
  const initials = specialist.name.split(" ").slice(-2).map((w) => w[0]).join("");

  if (failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: `radial-gradient(circle at 30% 25%, ${color}55, ${color}22)`,
        border: "1px solid var(--rule)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
        fontSize: size * 0.38, color: "var(--ink)",
      }}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={specialist.name}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--rule)" }}
      onError={() => setFailed(true)}
    />
  );
}

// ── Bookmark icon ─────────────────────────────────────────────────────────────

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

// ── Specialist card ───────────────────────────────────────────────────────────

function SpecialistCard({
  specialist,
  isSaved,
  onToggleSave,
  color,
}: {
  specialist: Specialist;
  isSaved: boolean;
  onToggleSave: () => void;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    await onToggleSave();
    setSaving(false);
  }

  return (
    <GardenPaper style={{ padding: 20, display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Top row: portrait + name + save */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
        <SpecialistPortrait specialist={specialist} size={52} color={color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 18, fontWeight: 400, color: "var(--ink)", margin: "0 0 2px", lineHeight: 1.2,
          }}>
            {specialist.name}
          </h3>
          <Overline color={color} style={{ display: "block", marginBottom: 2 }}>
            {specialist.specialty}
          </Overline>
          <Overline style={{ display: "block" }}>
            {specialist.hospital} · {specialist.city}
          </Overline>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          title={isSaved ? "Remove from shortlist" : "Save to shortlist"}
          style={{
            width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--rule)",
            background: isSaved ? "var(--poppy)" : "transparent",
            color: isSaved ? "white" : "var(--ink-faded)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <BookmarkIcon filled={isSaved} />
        </button>
      </div>

      {/* Accepting badge */}
      <div style={{ marginBottom: 12 }}>
        <span style={{
          fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10,
          letterSpacing: "0.12em", textTransform: "uppercase" as const,
          padding: "3px 9px", borderRadius: 999,
          background: specialist.acceptingPatients ? "rgba(22,163,74,0.12)" : "var(--soft)",
          color: specialist.acceptingPatients ? "#16a34a" : "var(--ink-faded)",
        }}>
          {specialist.acceptingPatients ? "● accepting" : "○ full"}
        </span>
      </div>

      {/* Expand / collapse */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: "none", padding: 0,
          cursor: "pointer", marginBottom: expanded ? 14 : 0,
          fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
          fontSize: 13, color: "var(--ink-faded)",
          textAlign: "left",
        }}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {expanded ? "show less" : "read more"}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 2 }}>
          {specialist.bio && (
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.65, margin: 0 }}>
              {specialist.bio}
            </p>
          )}
          {specialist.whyContact && (
            <div style={{ padding: "10px 14px", borderLeft: "2px solid " + color, background: "var(--soft)", borderRadius: "0 8px 8px 0" }}>
              <Overline color={color} style={{ display: "block", marginBottom: 4 }}>why reach out</Overline>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 14, color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>
                {specialist.whyContact}
              </p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 4, borderTop: "1px dashed var(--rule)" }}>
            {specialist.email && (
              <a href={`mailto:${specialist.email}`} style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-faded)", textDecoration: "none" }}>
                {specialist.email}
              </a>
            )}
            {specialist.phone && (
              <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-faded)" }}>
                {specialist.phone}
              </span>
            )}
          </div>
        </div>
      )}
    </GardenPaper>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <GardenPaper style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--soft)", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 14, width: "65%", borderRadius: 999, background: "var(--soft)" }} />
          <div style={{ height: 9, width: "45%", borderRadius: 999, background: "var(--soft)" }} />
          <div style={{ height: 9, width: "70%", borderRadius: 999, background: "var(--soft)" }} />
        </div>
      </div>
      <div style={{ height: 20, width: 80, borderRadius: 999, background: "var(--soft)" }} />
    </GardenPaper>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SpecialistPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, location, setPageContext, credits, setCredits } = usePoppyContext();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [savedEmails, setSavedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Category>("physician");

  const hasContext = conditions.length > 0 || documents.length > 0;
  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey = documents.map((d) => d.id).sort().join("|");

  useEffect(() => {
    fetch("/api/saved-specialists")
      .then((r) => r.json())
      .then(({ saved }) => {
        if (Array.isArray(saved)) {
          setSavedEmails(new Set(saved.map((s: { specialist_email: string }) => s.specialist_email)));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded) return;
    if (!hasContext) { setLoading(false); return; }

    setLoading(true);
    fetch("/api/specialists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id), ...(location ? { location } : {}) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.specialists) {
          setSpecialists(data.specialists);
          setCachedAt(data.cachedAt ?? null);
          setPageContext(
            `The user is viewing a specialist directory page. Listed specialists: ${data.specialists
              .map((s: Specialist) => `${s.name} (${s.specialty}, ${s.city})`)
              .join("; ")}.`
          );
        } else {
          setError("Could not load specialists.");
        }
      })
      .catch(() => setError("Could not load specialists."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, conditionsLoaded, documentsLoaded]);

  async function updateSpecialists() {
    if (!hasContext || updating) return;
    setUpdating(true);
    setError("");
    try {
      const res = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id), forceRefresh: true, ...(location ? { location } : {}) }),
      });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.specialists) {
        setSpecialists(data.specialists);
        setCachedAt(data.cachedAt ?? null);
        if (data.remainingCredits !== undefined) setCredits(data.remainingCredits);
      }
    } catch {
      setError("Could not refresh specialists.");
    } finally {
      setUpdating(false);
    }
  }

  async function toggleSave(specialist: Specialist) {
    const isSaved = savedEmails.has(specialist.email);
    setSavedEmails((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(specialist.email);
      else next.add(specialist.email);
      return next;
    });

    try {
      if (isSaved) {
        await fetch("/api/saved-specialists", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: specialist.email }),
        });
      } else {
        await fetch("/api/saved-specialists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ specialist }),
        });
      }
    } catch {
      setSavedEmails((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(specialist.email);
        else next.delete(specialist.email);
        return next;
      });
    }
  }

  if (!loading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 36, fontWeight: 400, color: "var(--ink)", margin: "0 0 16px" }}>
          find your specialists.
        </h1>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 28 }}>
          Add your conditions in your profile and Poppy will find relevant specialists for you.
        </p>
        <a href="/profile" style={{ padding: "12px 22px", borderRadius: 999, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", background: "var(--ink)", color: "var(--paper)", textDecoration: "none" }}>
          Go to Profile
        </a>
      </div>
    );
  }

  const tabColor = TAB_COLOR[activeTab];
  const tabSpecialists = specialists.filter((s) => (s.category ?? "physician") === activeTab);
  const hasNearLocation = tabSpecialists.some((s) => s.nearLocation === true);
  const nearSpecialists = tabSpecialists.filter((s) => s.nearLocation === true);
  const globalSpecialists = tabSpecialists.filter((s) => s.nearLocation !== true);

  // Derive city from location string (e.g. "London, UK" → "London")
  const locationCity = location ? location.split(",")[0].trim() : null;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      <GeneralContentBanner />

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Overline color="var(--poppy)" style={{ display: "block", marginBottom: 10 }}>
            specialists · matched to your particular case
          </Overline>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 42, fontWeight: 400, color: "var(--ink)", margin: 0,
            letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>
            doctors who <em>fit</em> your story.
          </h1>
        </div>
        {!loading && hasContext && (
          <UpdateButton onClick={updateSpecialists} loading={updating} credits={credits} cachedAt={cachedAt} />
        )}
      </div>


      {/* Tab navigation */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = specialists.filter((s) => (s.category ?? "physician") === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
                fontSize: 15, padding: "10px 18px", borderRadius: 999, cursor: "pointer",
                border: isActive ? `1px solid ${TAB_COLOR[tab.id]}` : "1px solid var(--rule)",
                background: isActive ? `${TAB_COLOR[tab.id]}15` : "var(--paper)",
                color: isActive ? TAB_COLOR[tab.id] : "var(--ink-soft)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {tab.label}
              {!loading && count > 0 && (
                <span style={{
                  fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10,
                  background: isActive ? `${TAB_COLOR[tab.id]}25` : "var(--soft)",
                  color: isActive ? TAB_COLOR[tab.id] : "var(--ink-faded)",
                  padding: "2px 7px", borderRadius: 999, letterSpacing: "0.06em",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, color: "var(--ink-soft)", margin: "0 0 24px", lineHeight: 1.6 }}>
        {TABS.find((t) => t.id === activeTab)?.description}
      </p>

      {error && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "#dc2626", marginBottom: 16 }}>{error}</p>}
      {loading && <AILoadingMessage messages={SPECIALIST_MESSAGES} />}

      {/* Cards — with near/global split when location is known */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tabSpecialists.length === 0 ? (
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--ink-faded)" }}>
          No {TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} found for your profile yet.
        </p>
      ) : location && hasNearLocation ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {/* Near you */}
          {nearSpecialists.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={tabColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <Overline color={tabColor}>near you · {locationCity}</Overline>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {nearSpecialists.map((s, i) => (
                  <SpecialistCard
                    key={i}
                    specialist={s}
                    isSaved={savedEmails.has(s.email)}
                    onToggleSave={() => toggleSave(s)}
                    color={PORTRAIT_COLORS[activeTab][i % PORTRAIT_COLORS[activeTab].length]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Global / online */}
          {globalSpecialists.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faded)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                </svg>
                <Overline>global experts · online consultations</Overline>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {globalSpecialists.map((s, i) => (
                  <SpecialistCard
                    key={i}
                    specialist={s}
                    isSaved={savedEmails.has(s.email)}
                    onToggleSave={() => toggleSave(s)}
                    color={PORTRAIT_COLORS[activeTab][(nearSpecialists.length + i) % PORTRAIT_COLORS[activeTab].length]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {tabSpecialists.map((s, i) => (
            <SpecialistCard
              key={i}
              specialist={s}
              isSaved={savedEmails.has(s.email)}
              onToggleSave={() => toggleSave(s)}
              color={PORTRAIT_COLORS[activeTab][i % PORTRAIT_COLORS[activeTab].length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
