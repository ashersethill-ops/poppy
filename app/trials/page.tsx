"use client";

import { useEffect, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";

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

const statusColors: Record<string, { bg: string; text: string }> = {
  Recruiting: { bg: "#dcfce7", text: "#15803d" },
  Active:     { bg: "#dbeafe", text: "#1d4ed8" },
  Completed:  { bg: "var(--soft)", text: "#9ca3af" },
};

const eligibilityConfig = {
  eligible: {
    bg: "#dcfce7",
    text: "#15803d",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    label: "You appear eligible",
  },
  likely_eligible: {
    bg: "#fef3c7",
    text: "#d97706",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    label: "Likely eligible",
  },
  not_eligible: {
    bg: "#fee2e2",
    text: "#dc2626",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    label: "Not eligible",
  },
};

function SkeletonCard() {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-4 animate-pulse"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}
    >
      <div className="h-5 rounded-full w-3/4" style={{ background: "var(--soft)" }} />
      <div className="flex gap-2">
        <div className="h-4 rounded-full w-20" style={{ background: "var(--soft)" }} />
        <div className="h-4 rounded-full w-24" style={{ background: "var(--soft)" }} />
        <div className="h-4 rounded-full w-20" style={{ background: "var(--soft)" }} />
      </div>
      <div className="h-3 rounded-full w-full" style={{ background: "var(--soft)" }} />
      <div className="h-3 rounded-full w-5/6" style={{ background: "var(--soft)" }} />
      <div className="h-10 rounded-2xl w-36 mt-2" style={{ background: "var(--soft)" }} />
    </div>
  );
}

function TrialCard({ trial }: { trial: Trial }) {
  const statusStyle = statusColors[trial.status] ?? { bg: "var(--soft)", text: "#9ca3af" };
  const eligibility = eligibilityConfig[trial.eligibility_match] ?? eligibilityConfig.likely_eligible;
  const canApply = trial.status === "Recruiting";

  const applyHref = trial.website
    ? trial.website
    : `mailto:${trial.contact}?subject=${encodeURIComponent(`Expression of Interest: ${trial.title}`)}&body=${encodeURIComponent(`Dear Trial Coordinator,\n\nI would like to express my interest in participating in the "${trial.title}" trial.\n\nPlease let me know the next steps.\n\nThank you.`)}`;

  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-4"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.07)" }}
    >
      {/* Title */}
      <h2 className="font-semibold text-base leading-snug" style={{ color: "var(--primary)" }}>
        {trial.title}
      </h2>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: "var(--soft)", color: "var(--accent)" }}>
          {trial.condition}
        </span>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: "var(--soft)", color: "var(--primary)" }}>
          {trial.phase}
        </span>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.text }}>
          {trial.status}
        </span>
      </div>

      {/* Eligibility banner */}
      <div
        className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
        style={{ background: eligibility.bg }}
      >
        <span className="flex-shrink-0 mt-0.5" style={{ color: eligibility.text }}>
          {eligibility.icon}
        </span>
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: eligibility.text }}>
            {eligibility.label}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: eligibility.text, opacity: 0.85 }}>
            {trial.eligibility_reason}
          </p>
        </div>
      </div>

      {/* Sponsor + location */}
      <div className="flex flex-col gap-1 text-sm text-stone-500">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span>{trial.sponsor}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <path d="M12 21C12 21 5 13.5 5 8a7 7 0 0114 0c0 5.5-7 13-7 13z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="8" r="2.5" />
          </svg>
          <span>{trial.location}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--soft)" }} />

      {/* Description */}
      <p className="text-sm text-stone-500 leading-relaxed">{trial.description}</p>

      {/* Eligibility criteria */}
      <div className="rounded-xl px-4 py-3 text-sm text-stone-600" style={{ background: "var(--soft)" }}>
        <span className="font-medium" style={{ color: "var(--primary)" }}>Criteria: </span>
        {trial.eligibility}
      </div>

      {/* Footer: contact + apply button */}
      <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <a href={`mailto:${trial.contact}`} className="hover:underline truncate">{trial.contact}</a>
        </div>

        {canApply && (
          <a
            href={applyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-85 flex-shrink-0"
            style={{ background: "var(--accent)" }}
          >
            Apply Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function TrialsPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, setPageContext } = usePoppyContext();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasContext = conditions.length > 0 || documents.length > 0;

  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey = documents.map((d) => d.id).sort().join("|");

  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded) return;

    setTrials([]);
    setError("");

    if (!hasContext) {
      setLoading(false);
      return;
    }

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

  if (!loading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: "var(--soft)", color: "var(--accent)" }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3" style={{ color: "var(--primary)" }}>
          Trials & Recent Research
        </h1>
        <p className="text-stone-500 leading-relaxed">
          Add your conditions in your profile and Poppy will surface relevant clinical trials for you.
        </p>
        <a
          href="/profile"
          className="inline-block mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          Go to Profile
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: "var(--primary)" }}>
          Clinical Trials
        </h1>
        <p className="text-stone-500 text-sm">
          Trials matched to your conditions: {conditions.join(", ")}
        </p>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      <div className="flex flex-col gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : trials.map((t, i) => <TrialCard key={i} trial={t} />)
        }
      </div>
    </div>
  );
}
