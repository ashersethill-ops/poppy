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
};

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
  <span
    style={{
      fontFamily: "'Geist Mono', ui-monospace, monospace",
      fontSize: 10,
      letterSpacing: "0.14em",
      textTransform: "uppercase" as const,
      color: color ?? "var(--ink-faded)",
      ...style,
    }}
  >
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
  <div style={{ background: "var(--paper)", borderRadius: 18, border: "1px solid var(--rule)", padding: 24, ...style }}>
    {children}
  </div>
);

const Portrait = ({
  initials,
  color,
  size = 64,
}: {
  initials: string;
  color: string;
  size?: number;
}) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 30% 25%, ${color}55, ${color}25)`,
      border: "1px solid var(--rule)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Newsreader', Georgia, serif",
      fontStyle: "italic", fontSize: size * 0.38, color: "var(--ink)",
    }}
  >
    {initials}
  </div>
);

const AcceptingBadge = ({ accepting }: { accepting: boolean }) => (
  <span style={{
    fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10,
    letterSpacing: "0.12em", textTransform: "uppercase" as const,
    padding: "4px 10px", borderRadius: 999,
    background: accepting ? "rgba(124,142,107,0.15)" : "var(--soft)",
    color: accepting ? "var(--sage)" : "var(--ink-faded)",
  }}>
    {accepting ? "● accepting" : "○ full"}
  </span>
);

// ── Bookmark icon ─────────────────────────────────────────────────────────────

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

// ── Portrait with fallback ────────────────────────────────────────────────────

const PORTRAIT_COLORS = [
  "var(--poppy)", "var(--sage)", "var(--gold)", "#C96B7A",
  "var(--accent)", "var(--ink-faded)",
];

function SpecialistPortrait({
  specialist,
  size = 64,
  index = 0,
}: {
  specialist: Specialist;
  size?: number;
  index?: number;
}) {
  const [failed, setFailed] = useState(false);
  const url = `https://randomuser.me/api/portraits/${specialist.gender}/${specialist.portraitIndex}.jpg`;
  const initials = specialist.name.split(" ").slice(-2).map((w) => w[0]).join("");
  const color = PORTRAIT_COLORS[index % PORTRAIT_COLORS.length];

  if (failed) {
    return <Portrait initials={initials} color={color} size={size} />;
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonFeatured() {
  return (
    <div style={{ background: "var(--paper)", borderRadius: 22, border: "1px solid var(--rule)", padding: 32, display: "grid", gridTemplateColumns: "128px 1fr", gap: 28, animationName: "pulse", animationDuration: "2s", animationIterationCount: "infinite" }}>
      <div style={{ width: 128, height: 128, borderRadius: "50%", background: "var(--soft)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ height: 10, width: "40%", borderRadius: 999, background: "var(--soft)" }} />
        <div style={{ height: 20, width: "70%", borderRadius: 999, background: "var(--soft)" }} />
        <div style={{ height: 10, width: "50%", borderRadius: 999, background: "var(--soft)" }} />
        <div style={{ height: 60, borderRadius: 12, background: "var(--soft)", marginTop: 4 }} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "var(--paper)", borderRadius: 18, border: "1px solid var(--rule)", padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--soft)" }} />
      <div style={{ height: 14, width: "70%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 10, width: "50%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 40, borderRadius: 10, background: "var(--soft)" }} />
    </div>
  );
}

// ── Featured specialist card ──────────────────────────────────────────────────

function FeaturedCard({
  specialist,
  isSaved,
  onToggleSave,
}: {
  specialist: Specialist;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    await onToggleSave();
    setSaving(false);
  }

  return (
    <article style={{
      background: "var(--paper)", borderRadius: 22, border: "1px solid var(--rule)",
      padding: 32, display: "grid", gridTemplateColumns: "128px 1fr auto",
      gap: 28, alignItems: "flex-start",
      boxShadow: "0 16px 36px -22px rgba(36,26,20,0.16)",
    }}>
      <SpecialistPortrait specialist={specialist} size={128} index={0} />

      <div>
        <Overline color="var(--poppy)" style={{ display: "block", marginBottom: 6 }}>
          poppy&#39;s first suggestion
        </Overline>
        <h2 style={{
          fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
          fontSize: 34, fontWeight: 400, color: "var(--ink)", margin: "0 0 4px",
          letterSpacing: "-0.015em", lineHeight: 1.1,
        }}>
          {specialist.name}.
        </h2>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "var(--ink-soft)", margin: "0 0 4px" }}>
          {specialist.title} · {specialist.specialty}
        </p>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-faded)", margin: "0 0 16px" }}>
          {specialist.hospital} · {specialist.city}, {specialist.country}
        </p>

        {/* Bio */}
        {specialist.bio && (
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.65, margin: "0 0 16px" }}>
            {specialist.bio}
          </p>
        )}

        {/* Why poppy thinks they fit */}
        {specialist.whyContact && (
          <div style={{
            padding: "14px 18px", borderLeft: "2px solid var(--poppy)",
            background: "var(--soft)", borderRadius: "0 8px 8px 0", marginBottom: 18,
          }}>
            <Overline color="var(--poppy-deep)" style={{ display: "block", marginBottom: 6 }}>
              why poppy thinks they fit
            </Overline>
            <p style={{
              fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
              fontSize: 15, color: "var(--ink)", margin: 0, lineHeight: 1.6,
            }}>
              {specialist.whyContact}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <AcceptingBadge accepting={specialist.acceptingPatients} />
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

      {/* Save button */}
      <button
        onClick={handleToggle}
        disabled={saving}
        title={isSaved ? "Remove from shortlist" : "Save to shortlist"}
        style={{
          width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--rule)",
          background: isSaved ? "var(--poppy)" : "var(--paper)",
          color: isSaved ? "white" : "var(--ink-faded)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <BookmarkIcon filled={isSaved} />
      </button>
    </article>
  );
}

// ── Secondary specialist card ─────────────────────────────────────────────────

function SecondaryCard({
  specialist,
  isSaved,
  onToggleSave,
  index,
}: {
  specialist: Specialist;
  isSaved: boolean;
  onToggleSave: () => void;
  index: number;
}) {
  const [saving, setSaving] = useState(false);
  const color = PORTRAIT_COLORS[index % PORTRAIT_COLORS.length];

  async function handleToggle() {
    setSaving(true);
    await onToggleSave();
    setSaving(false);
  }

  return (
    <GardenPaper style={{ display: "flex", flexDirection: "column", gap: 14, padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SpecialistPortrait specialist={specialist} size={56} index={index} />
        <button
          onClick={handleToggle}
          disabled={saving}
          style={{
            width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--rule)",
            background: isSaved ? "var(--poppy)" : "transparent",
            color: isSaved ? "white" : "var(--ink-faded)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <BookmarkIcon filled={isSaved} />
        </button>
      </div>

      <div>
        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 19, fontWeight: 400, color: "var(--ink)", margin: "0 0 2px", lineHeight: 1.2 }}>
          {specialist.name}
        </h3>
        <Overline color={color} style={{ display: "block", marginBottom: 4 }}>
          {specialist.specialty} · {specialist.city}
        </Overline>
      </div>

      {specialist.bio && (
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
          {specialist.bio}
        </p>
      )}

      {specialist.whyContact && (
        <div style={{ padding: "10px 14px", background: "var(--soft)", borderRadius: 10, borderLeft: "2px solid var(--rule)" }}>
          <Overline style={{ display: "block", marginBottom: 4 }}>why reach out</Overline>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13.5, color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>
            {specialist.whyContact}
          </p>
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px dashed var(--rule)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <AcceptingBadge accepting={specialist.acceptingPatients} />
        {specialist.email && (
          <a href={`mailto:${specialist.email}`} style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13, color: color, textDecoration: "none" }}>
            contact ›
          </a>
        )}
      </div>
    </GardenPaper>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SpecialistPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, setPageContext, credits, setCredits } = usePoppyContext();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [savedEmails, setSavedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showShortlistOnly, setShowShortlistOnly] = useState(false);

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
      body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id) }),
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
        body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id), forceRefresh: true }),
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

  const savedCount = savedEmails.size;
  const displayedSpecialists = showShortlistOnly
    ? specialists.filter((s) => savedEmails.has(s.email))
    : specialists;

  const featured = displayedSpecialists[0];
  const others = displayedSpecialists.slice(1);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      <GeneralContentBanner />

      {/* Header */}
      <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
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
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.6, margin: "12px 0 0", maxWidth: 580 }}>
            These are not search results. Each one was chosen because Poppy could explain — in plain language — why they fit you.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {!loading && hasContext && (
            <UpdateButton onClick={updateSpecialists} loading={updating} credits={credits} cachedAt={cachedAt} />
          )}
          {!loading && savedCount > 0 && (
            <button
              onClick={() => setShowShortlistOnly((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 999, fontSize: 13,
                fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
                cursor: "pointer",
                background: showShortlistOnly ? "var(--poppy)" : "var(--soft)",
                color: showShortlistOnly ? "white" : "var(--ink)",
                border: "none",
              }}
            >
              <BookmarkIcon filled={showShortlistOnly} />
              shortlist ({savedCount})
            </button>
          )}
        </div>
      </div>

      {error && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "#dc2626", marginBottom: 16 }}>{error}</p>}
      {loading && <AILoadingMessage messages={SPECIALIST_MESSAGES} />}

      {showShortlistOnly && displayedSpecialists.length === 0 && (
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--ink-faded)" }}>
          No saved specialists yet. Click the bookmark on any card to add one.
        </p>
      )}

      {/* Featured specialist */}
      {!loading && featured && (
        <div style={{ marginBottom: 44 }}>
          <FeaturedCard
            specialist={featured}
            isSaved={savedEmails.has(featured.email)}
            onToggleSave={() => toggleSave(featured)}
          />
        </div>
      )}

      {loading && <SkeletonFeatured />}

      {/* Secondary specialists */}
      {!loading && others.length > 0 && (
        <div>
          <Overline style={{ display: "block", marginBottom: 14 }}>
            {others.length === 1 ? "one more worth knowing" : `${others.length} others worth knowing`}
          </Overline>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {others.map((s, i) => (
              <SecondaryCard
                key={i}
                specialist={s}
                isSaved={savedEmails.has(s.email)}
                onToggleSave={() => toggleSave(s)}
                index={i + 1}
              />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
    </div>
  );
}
