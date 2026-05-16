"use client";

import { useEffect, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";
import AILoadingMessage from "../components/AILoadingMessage";
import UpdateButton from "../components/UpdateButton";
import GeneralContentBanner from "../components/GeneralContentBanner";

const OVERVIEW_MESSAGES = [
  "Reviewing your health history…",
  "Cross-referencing the latest clinical guidelines…",
  "Analysing your uploaded documents…",
  "Building your personalised health timeline…",
  "Checking recent research for your conditions…",
  "Pulling together your care overview…",
  "Identifying your treating physicians…",
  "Searching for relevant studies and treatments…",
];

// ── Types ─────────────────────────────────────────────────────────────────────

type TimelineEvent = {
  date: string;
  event: string;
  type: "diagnosis" | "treatment" | "test" | "milestone";
};

type Diagnosis = {
  condition: string;
  description: string;
  diagnosedDate?: string;
};

type Treatment = {
  name: string;
  type: "medication" | "therapy" | "procedure";
  dose?: string;
  frequency?: string;
  since?: string;
};

type Physician = {
  name: string;
  specialty: string;
  hospital?: string;
  phone?: string;
  email?: string;
};

type Research = {
  title: string;
  source: string;
  year: string;
  relevance: string;
};

type OverviewData = {
  timeline: TimelineEvent[];
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  physicians: Physician[];
  research: Research[];
};

type SavedSpecialist = {
  specialist_email: string;
  specialist: {
    name: string;
    title: string;
    specialty: string;
    subspecialty: string;
    hospital: string;
    city: string;
    country: string;
    email: string;
    phone: string;
  };
};

// ── Colours ───────────────────────────────────────────────────────────────────

const timelineColors: Record<string, string> = {
  diagnosis: "#f87171",
  treatment: "var(--accent)",
  test:      "#a78bfa",
  milestone: "#34d399",
};

const treatmentBg: Record<string, string> = {
  medication: "#eff6ff",
  therapy:    "#f0fdf4",
  procedure:  "#faf5ff",
};
const treatmentText: Record<string, string> = {
  medication: "#1d4ed8",
  therapy:    "#15803d",
  procedure:  "#7c3aed",
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonBlock({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-full animate-pulse`} style={{ background: "var(--soft)" }} />;
}

function SectionSkeleton() {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-4"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}
    >
      <SkeletonBlock h="h-5" w="w-1/3" />
      <SkeletonBlock h="h-3" />
      <SkeletonBlock h="h-3" w="w-5/6" />
      <SkeletonBlock h="h-3" w="w-4/6" />
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-5"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--soft)", color: "var(--accent)" }}
          >
            {icon}
          </span>
          <h2 className="font-semibold text-base" style={{ color: "var(--primary)" }}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-stone-400">No timeline data available from your documents.</p>;

  return (
    <div className="flex flex-col gap-0">
      {events.map((e, i) => (
        <div key={i} className="flex gap-4">
          {/* Dot + line */}
          <div className="flex flex-col items-center">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: timelineColors[e.type] ?? "var(--accent)" }}
            />
            {i < events.length - 1 && (
              <div className="w-px flex-1 mt-1" style={{ background: "var(--soft)", minHeight: "24px" }} />
            )}
          </div>
          {/* Content */}
          <div className="pb-5 min-w-0">
            <p className="text-xs text-stone-400 mb-0.5">{e.date}</p>
            <p className="text-sm leading-snug" style={{ color: "var(--primary)" }}>{e.event}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Diagnosis cards ────────────────────────────────────────────────────────────

function DiagnosisList({ diagnoses }: { diagnoses: Diagnosis[] }) {
  if (diagnoses.length === 0) return <p className="text-sm text-stone-400">No diagnosis details available.</p>;

  return (
    <div className="flex flex-col gap-4">
      {diagnoses.map((d, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: "var(--soft)", color: "var(--accent)" }}
            >
              {d.condition}
            </span>
            {d.diagnosedDate && (
              <span className="text-xs text-stone-400">since {d.diagnosedDate}</span>
            )}
          </div>
          <p className="text-sm text-stone-500 leading-relaxed">{d.description}</p>
          {i < diagnoses.length - 1 && <div className="mt-4" style={{ borderTop: "1px solid var(--soft)" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Treatments ────────────────────────────────────────────────────────────────

function TreatmentList({ treatments }: { treatments: Treatment[] }) {
  if (treatments.length === 0) return <p className="text-sm text-stone-400">No treatment data found in your documents.</p>;

  return (
    <div className="flex flex-col gap-3">
      {treatments.map((t, i) => (
        <div key={i} className="flex items-start gap-3">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5 capitalize"
            style={{
              background: treatmentBg[t.type] ?? "var(--soft)",
              color: treatmentText[t.type] ?? "var(--primary)",
            }}
          >
            {t.type}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug" style={{ color: "var(--primary)" }}>
              {t.name}{t.dose ? ` ${t.dose}` : ""}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {[t.frequency, t.since ? `since ${t.since}` : ""].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Physicians ────────────────────────────────────────────────────────────────

function PhysicianList({ physicians }: { physicians: Physician[] }) {
  if (physicians.length === 0) {
    return <p className="text-sm text-stone-400">No treating physician details found in your documents.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {physicians.map((p, i) => (
        <div key={i}>
          <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{p.name}</p>
          <p className="text-xs mb-1.5" style={{ color: "var(--accent)" }}>{p.specialty}</p>
          {p.hospital && <p className="text-xs text-stone-500">{p.hospital}</p>}
          <div className="flex flex-col gap-1 mt-1.5">
            {p.phone && (
              <p className="text-xs text-stone-400">{p.phone}</p>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`} className="text-xs text-stone-400 hover:underline truncate">{p.email}</a>
            )}
          </div>
          {i < physicians.length - 1 && <div className="mt-3" style={{ borderTop: "1px solid var(--soft)" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Shortlisted specialists ───────────────────────────────────────────────────

function ShortlistSection({ saved }: { saved: SavedSpecialist[] }) {
  if (saved.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        No specialists shortlisted yet.{" "}
        <a href="/specialist" className="hover:underline" style={{ color: "var(--accent)" }}>
          Browse the directory →
        </a>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {saved.map((s, i) => (
        <div key={i}>
          <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{s.specialist.name}</p>
          <p className="text-xs mb-0.5" style={{ color: "var(--accent)" }}>{s.specialist.specialty}</p>
          <p className="text-xs text-stone-500">{s.specialist.subspecialty}</p>
          <p className="text-xs text-stone-400 mt-1">{s.specialist.hospital}, {s.specialist.city}, {s.specialist.country}</p>
          <div className="flex flex-col gap-0.5 mt-1.5">
            <a href={`mailto:${s.specialist.email}`} className="text-xs text-stone-400 hover:underline truncate">{s.specialist.email}</a>
            <p className="text-xs text-stone-400">{s.specialist.phone}</p>
          </div>
          {i < saved.length - 1 && <div className="mt-3" style={{ borderTop: "1px solid var(--soft)" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Research ──────────────────────────────────────────────────────────────────

function ResearchList({ research }: { research: Research[] }) {
  if (research.length === 0) return <p className="text-sm text-stone-400">No research headlines available.</p>;

  return (
    <div className="flex flex-col gap-4">
      {research.map((r, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
            style={{ background: "var(--soft)", color: "var(--accent)" }}
          >
            {i + 1}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug mb-1" style={{ color: "var(--primary)" }}>
              {r.title}
            </p>
            <p className="text-xs text-stone-400">{r.source} · {r.year}</p>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">{r.relevance}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const icons = {
  timeline: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  diagnosis: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  treatments: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  physicians: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  specialists: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  ),
  research: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, credits, setCredits, displayName } = usePoppyContext();
  const [data, setData] = useState<OverviewData | null>(null);
  const [savedSpecialists, setSavedSpecialists] = useState<SavedSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Story name derived from context — no extra profile fetch needed
  const storyName = displayName;

  const hasContext = conditions.length > 0 || documents.length > 0;

  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey = documents.map((d) => d.id).sort().join("|");

  // Load saved specialists
  useEffect(() => {
    fetch("/api/saved-specialists")
      .then((r) => r.json())
      .then(({ saved }) => { if (Array.isArray(saved)) setSavedSpecialists(saved); })
      .catch(() => {});
  }, []);

  // Load overview data
  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded) return;

    if (!hasContext) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id) }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError("Could not load your health overview."); }
        else { setData(d); setCachedAt(d.cachedAt ?? null); }
      })
      .catch(() => setError("Could not load your health overview."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, conditionsLoaded, documentsLoaded]);

  async function updateOverview() {
    if (!hasContext || updating) return;
    setUpdating(true);
    setError("");
    try {
      const res = await fetch("/api/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id), forceRefresh: true }),
      });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const d = await res.json();
      if (!d.error) {
        setData(d);
        setCachedAt(d.cachedAt ?? null);
        if (d.remainingCredits !== undefined) setCredits(d.remainingCredits);
      }
    } catch {
      setError("Could not refresh health overview.");
    } finally {
      setUpdating(false);
    }
  }

  // No context state
  if (!loading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: "var(--soft)", color: "var(--accent)" }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3" style={{ color: "var(--primary)" }}>
          {storyName ? `${storyName}'s Story` : "Health Overview"}
        </h1>
        <p className="text-stone-500 leading-relaxed mb-6">
          Add your conditions or upload medical documents and Poppy will build your personalised health summary.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="/profile" className="inline-block px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: "var(--accent)" }}>
            Add Conditions
          </a>
          <a href="/documents" className="inline-block px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80" style={{ background: "var(--soft)", color: "var(--primary)" }}>
            Upload Documents
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <GeneralContentBanner />
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: "var(--primary)" }}>
          {storyName ? `${storyName}'s Story` : "Health Overview"}
        </h1>
        {conditions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {conditions.map((c) => (
              <span
                key={c}
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: "var(--soft)", color: "var(--accent)" }}
              >
                {c}
              </span>
            ))}
          </div>
        )}
        </div>
        {!loading && hasContext && (
          <UpdateButton onClick={updateOverview} loading={updating} credits={credits} cachedAt={cachedAt} />
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-6">{error}</p>}

      {loading && <AILoadingMessage messages={OVERVIEW_MESSAGES} />}

      <div className="flex flex-col gap-5">
        {/* Timeline — full width */}
        {loading ? (
          <SectionSkeleton />
        ) : (
          <Section
            icon={icons.timeline}
            title="Timeline"
            action={
              <span className="text-xs text-stone-400">
                {data?.timeline?.[0]?.date && `${data.timeline[0].date} → Today`}
              </span>
            }
          >
            <Timeline events={data?.timeline ?? []} />
          </Section>
        )}

        {/* 2-column row: Diagnoses + Treatments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <>
              <SectionSkeleton />
              <SectionSkeleton />
            </>
          ) : (
            <>
              <Section icon={icons.diagnosis} title="Diagnoses">
                <DiagnosisList diagnoses={data?.diagnoses ?? []} />
              </Section>
              <Section icon={icons.treatments} title="Current Treatments & Medications">
                <TreatmentList treatments={data?.treatments ?? []} />
              </Section>
            </>
          )}
        </div>

        {/* 2-column row: Physicians + Shortlisted Specialists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <>
              <SectionSkeleton />
              <SectionSkeleton />
            </>
          ) : (
            <>
              <Section icon={icons.physicians} title="Treating Physicians">
                <PhysicianList physicians={data?.physicians ?? []} />
              </Section>
              <Section
                icon={icons.specialists}
                title="Shortlisted Specialists"
                action={
                  <a href="/specialist" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                    Browse →
                  </a>
                }
              >
                <ShortlistSection saved={savedSpecialists} />
              </Section>
            </>
          )}
        </div>

        {/* Research — full width */}
        {loading ? (
          <SectionSkeleton />
        ) : (
          <Section icon={icons.research} title="Relevant Research & Articles">
            <ResearchList research={data?.research ?? []} />
          </Section>
        )}
      </div>
    </div>
  );
}
