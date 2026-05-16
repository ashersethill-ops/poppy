"use client";

import { useEffect, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";
import AILoadingMessage from "../components/AILoadingMessage";
import UpdateButton from "../components/UpdateButton";
import GeneralContentBanner from "../components/GeneralContentBanner";

const TRIALS_MESSAGES = [
  "Searching active clinical trials worldwide…",
  "Matching eligibility criteria to your profile…",
  "Reviewing phase and recruitment status…",
  "Checking the latest study registrations…",
  "Finding trials that match your conditions…",
  "Verifying contact details and locations…",
];

type Trial = {
  condition: string;
  title: string;
  phase: string;
  status: "Recruiting" | "Active" | "Completed";
  location: string;
  sponsor: string;
  description: string;
  eligibility: string;
  contact: string;
  website: string;
  eligibility_match: "eligible" | "likely_eligible" | "not_eligible";
  eligibility_reason: string;
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
  <div style={{ background: "var(--paper)", borderRadius: 18, border: "1px solid var(--rule)", ...style }}>
    {children}
  </div>
);

const Tag = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <span style={{
    fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10,
    padding: "4px 10px", borderRadius: 999,
    background: `${color ?? "var(--poppy)"}1f`,
    color: color ?? "var(--poppy)",
    letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 500,
  }}>
    {children}
  </span>
);

// ── Match strength helpers ─────────────────────────────────────────────────────

const matchConfig = {
  eligible:        { color: "#16a34a", label: "● strong match" },
  likely_eligible: { color: "#ea580c", label: "◐ likely match" },
  not_eligible:    { color: "#dc2626", label: "○ not eligible"  },
};

const statusColor: Record<string, string> = {
  Recruiting: "var(--sage)",
  Active:     "var(--gold)",
  Completed:  "var(--ink-faded)",
};

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SkeletonFeatured() {
  return (
    <GardenPaper style={{ padding: 36, display: "flex", flexDirection: "column", gap: 18, marginBottom: 44 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[80, 100, 70].map((w, i) => (
          <div key={i} style={{ height: 22, width: w, borderRadius: 999, background: "var(--soft)" }} />
        ))}
      </div>
      <div style={{ height: 32, width: "80%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 32, width: "60%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 14, borderRadius: 8, background: "var(--soft)" }} />
      <div style={{ height: 14, width: "90%", borderRadius: 8, background: "var(--soft)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, padding: "18px 0", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 8, width: "70%", borderRadius: 999, background: "var(--soft)" }} />
            <div style={{ height: 14, width: "90%", borderRadius: 999, background: "var(--soft)" }} />
          </div>
        ))}
      </div>
      <div style={{ height: 60, borderRadius: 12, background: "var(--soft)" }} />
    </GardenPaper>
  );
}

function SkeletonCard() {
  return (
    <GardenPaper style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ height: 20, width: 80, borderRadius: 999, background: "var(--soft)" }} />
        <div style={{ height: 20, width: 100, borderRadius: 999, background: "var(--soft)" }} />
      </div>
      <div style={{ height: 18, width: "85%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 10, width: "60%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 40, borderRadius: 10, background: "var(--soft)" }} />
    </GardenPaper>
  );
}

// ── Featured trial card ───────────────────────────────────────────────────────

function FeaturedTrial({ trial }: { trial: Trial }) {
  const match = matchConfig[trial.eligibility_match] ?? matchConfig.likely_eligible;
  const sc = statusColor[trial.status] ?? "var(--ink-faded)";
  const canApply = trial.status === "Recruiting";
  const applyHref = trial.website
    ? trial.website
    : `mailto:${trial.contact}?subject=${encodeURIComponent(`Expression of Interest: ${trial.title}`)}&body=${encodeURIComponent(`Dear Trial Coordinator,\n\nI would like to express my interest in participating in the "${trial.title}" trial.\n\nPlease let me know the next steps.\n\nThank you.`)}`;

  return (
    <GardenPaper style={{
      padding: 36, display: "flex", flexDirection: "column", gap: 18,
      boxShadow: "0 16px 36px -22px rgba(36,26,20,0.16)",
      borderLeft: `4px solid ${match.color}`,
    }}>
      {/* Tags */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Tag color={match.color}>{match.label} · {trial.condition}</Tag>
        <Tag color="var(--gold)">{trial.phase}</Tag>
        <Tag color={sc}>{trial.status.toLowerCase()}</Tag>
      </div>

      {/* Title */}
      <div>
        <Overline color="var(--poppy-deep)" style={{ display: "block", marginBottom: 10 }}>
          {trial.sponsor}
        </Overline>
        <h2 style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 34, lineHeight: 1.1, fontWeight: 400,
          color: "var(--ink)", margin: "0 0 12px", letterSpacing: "-0.018em",
        }}>
          {trial.title}
        </h2>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, color: "var(--ink-soft)", lineHeight: 1.65, margin: 0 }}>
          {trial.description}
        </p>
      </div>

      {/* Metadata grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14,
        padding: "18px 0", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)",
      }}>
        {[
          ["location",     trial.location],
          ["phase",        trial.phase],
          ["status",       trial.status],
          ["sponsor",      trial.sponsor],
        ].map(([label, value], i) => (
          <div key={i}>
            <Overline style={{ display: "block", marginBottom: 4 }}>{label}</Overline>
            <div style={{
              fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
              fontSize: 15, color: "var(--ink)", lineHeight: 1.3,
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Why poppy thinks it fits */}
      <div style={{
        padding: "14px 18px", background: "var(--soft)", borderRadius: 12,
        borderLeft: "2px solid var(--poppy)",
      }}>
        <Overline color="var(--poppy-deep)" style={{ display: "block", marginBottom: 8 }}>
          why poppy thinks it fits
        </Overline>
        <p style={{
          fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
          fontSize: 15.5, color: "var(--ink)", margin: 0, lineHeight: 1.6,
        }}>
          {trial.eligibility_reason}
        </p>
      </div>

      {/* Eligibility criteria */}
      {trial.eligibility && (
        <div style={{ padding: "12px 16px", background: "var(--soft)", borderRadius: 10 }}>
          <Overline style={{ display: "block", marginBottom: 6 }}>eligibility criteria</Overline>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", margin: 0, lineHeight: 1.6 }}>
            {trial.eligibility}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
        {canApply && (
          <a
            href={applyHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
              fontSize: 15, color: "var(--paper)", background: "var(--poppy)",
              border: "none", padding: "13px 22px", borderRadius: 999, textDecoration: "none", display: "inline-block",
            }}
          >
            draft an inquiry letter
          </a>
        )}
        <a
          href={`mailto:${trial.contact}`}
          style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 14, color: "var(--ink-soft)", textDecoration: "none",
            borderBottom: "1px solid var(--rule)", paddingBottom: 2,
          }}
        >
          {trial.contact}
        </a>
      </div>
    </GardenPaper>
  );
}

// ── Secondary trial card ──────────────────────────────────────────────────────

function SecondaryTrial({ trial, color }: { trial: Trial; color: string }) {
  const match = matchConfig[trial.eligibility_match] ?? matchConfig.likely_eligible;
  const canApply = trial.status === "Recruiting";
  const applyHref = trial.website
    ? trial.website
    : `mailto:${trial.contact}?subject=${encodeURIComponent(`Expression of Interest: ${trial.title}`)}&body=${encodeURIComponent(`Dear Trial Coordinator,\n\nI would like to express my interest in participating in the "${trial.title}" trial.\n\nPlease let me know the next steps.\n\nThank you.`)}`;

  return (
    <GardenPaper style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, borderLeft: `4px solid ${match.color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Tag color={match.color}>{match.label}</Tag>
        <Overline>{trial.phase} · {trial.status.toLowerCase()}</Overline>
      </div>
      <h3 style={{
        fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
        fontSize: 20, fontWeight: 400, color: "var(--ink)", margin: 0, lineHeight: 1.25,
      }}>
        {trial.title}
      </h3>
      <Overline>{trial.location}</Overline>
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
        {trial.eligibility_reason}
      </p>
      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px dashed var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {canApply ? (
          <a
            href={applyHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13, color, textDecoration: "none" }}
          >
            learn more ›
          </a>
        ) : (
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13, color: "var(--ink-faded)" }}>
            {trial.status.toLowerCase()}
          </span>
        )}
        {trial.contact && (
          <a href={`mailto:${trial.contact}`} style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-faded)", textDecoration: "none" }}>
            contact
          </a>
        )}
      </div>
    </GardenPaper>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrialsPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, setPageContext, credits, setCredits } = usePoppyContext();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const hasContext = conditions.length > 0 || documents.length > 0;
  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey = documents.map((d) => d.id).sort().join("|");

  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded) return;

    setTrials([]);
    setError("");

    if (!hasContext) { setLoading(false); return; }

    setLoading(true);
    fetch("/api/trials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.trials) {
          setTrials(data.trials);
          setCachedAt(data.cachedAt ?? null);
          setPageContext(
            `The user is on the Trials page. Listed clinical trials: ${data.trials
              .map((t: Trial) => `"${t.title}" (${t.phase}, ${t.status}, ${t.condition}, eligibility: ${t.eligibility_match})`)
              .join("; ")}.`
          );
        } else {
          setError("Could not load trials.");
        }
      })
      .catch(() => setError("Could not load trials."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, conditionsLoaded, documentsLoaded, setPageContext]);

  async function updateTrials() {
    if (!hasContext || updating) return;
    setUpdating(true);
    setError("");
    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id), forceRefresh: true }),
      });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.trials) {
        setTrials(data.trials);
        setCachedAt(data.cachedAt ?? null);
        if (data.remainingCredits !== undefined) setCredits(data.remainingCredits);
      }
    } catch {
      setError("Could not refresh trials.");
    } finally {
      setUpdating(false);
    }
  }

  if (!loading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 36, fontWeight: 400, color: "var(--ink)", margin: "0 0 16px" }}>
          three open <em>doors.</em>
        </h1>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 28 }}>
          Add your conditions in your profile and Poppy will surface relevant clinical trials for you.
        </p>
        <a href="/profile" style={{ padding: "12px 22px", borderRadius: 999, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", background: "var(--ink)", color: "var(--paper)", textDecoration: "none" }}>
          Go to Profile
        </a>
      </div>
    );
  }

  const featured = trials[0];
  const others = trials.slice(1);
  const SECONDARY_COLORS = ["var(--gold)", "var(--sage)", "#C96B7A", "var(--accent)"];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      <GeneralContentBanner />

      {/* Header */}
      <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Overline color="var(--poppy)" style={{ display: "block", marginBottom: 10 }}>
            clinical trials · {trials.length > 0 ? `${trials.length} may fit` : "searching"} · all global
          </Overline>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 42, fontWeight: 400, color: "var(--ink)", margin: 0,
            letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>
            {trials.length > 0 ? `${trials.length > 1 ? `${trials.length} open` : "an open"} ` : ""}
            <em>door{trials.length !== 1 ? "s" : ""}.</em>
          </h1>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.6, margin: "12px 0 0", maxWidth: 560 }}>
            Most trial finders are noisy. These were chosen by Poppy because your particular case appears to match the inclusion criteria.
          </p>
        </div>
        {!loading && hasContext && (
          <UpdateButton onClick={updateTrials} loading={updating} credits={credits} cachedAt={cachedAt} />
        )}
      </div>

      {error && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "#dc2626", marginBottom: 16 }}>{error}</p>}
      {loading && <AILoadingMessage messages={TRIALS_MESSAGES} />}

      {/* Featured trial */}
      {loading ? (
        <SkeletonFeatured />
      ) : featured ? (
        <div style={{ marginBottom: 44 }}>
          <FeaturedTrial trial={featured} />
        </div>
      ) : null}

      {/* Other trials */}
      {!loading && others.length > 0 && (
        <div>
          <Overline style={{ display: "block", marginBottom: 14 }}>
            {others.length === 1 ? "one more open door" : `${others.length} more open doors`}
          </Overline>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {others.map((t, i) => (
              <SecondaryTrial key={i} trial={t} color={SECONDARY_COLORS[i % SECONDARY_COLORS.length]} />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div>
          <div style={{ height: 10, width: 160, borderRadius: 999, background: "var(--soft)", marginBottom: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
