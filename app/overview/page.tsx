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
  <div
    style={{
      background: "var(--paper)",
      borderRadius: 18,
      border: "1px solid var(--rule)",
      padding: 28,
      ...style,
    }}
  >
    {children}
  </div>
);

// ── Timeline event colours ────────────────────────────────────────────────────

const timelineDotColor: Record<string, string> = {
  diagnosis: "var(--poppy)",
  treatment: "var(--sage)",
  test:      "var(--gold)",
  milestone: "#C96B7A",
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonBlock({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-full animate-pulse`} style={{ background: "var(--soft)" }} />;
}

function SectionSkeleton() {
  return (
    <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}>
      <SkeletonBlock h="h-4" w="w-1/3" />
      <SkeletonBlock h="h-3" />
      <SkeletonBlock h="h-3" w="w-5/6" />
      <SkeletonBlock h="h-3" w="w-4/6" />
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--ink-faded)" }}>
        No timeline data available from your documents.
      </p>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Dashed spine */}
      <div style={{
        position: "absolute", left: 11, top: 8, bottom: 8, width: 1,
        borderLeft: "1px dashed var(--rule)",
      }} />

      {events.map((e, i) => {
        const dotColor = timelineDotColor[e.type] ?? "var(--accent)";
        return (
          <article key={i} style={{ position: "relative", paddingLeft: 44, marginBottom: 20 }}>
            {/* Dot */}
            <div style={{
              position: "absolute", left: 4, top: 22,
              width: 16, height: 16, borderRadius: "50%",
              background: dotColor, border: "3px solid var(--background)",
              boxShadow: `0 0 0 1px ${dotColor}55`,
            }} />
            <GardenPaper style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6, flexWrap: "wrap" }}>
                <Overline color={dotColor}>{e.date}</Overline>
                <Overline>{e.type}</Overline>
              </div>
              <p style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 15.5, lineHeight: 1.65, color: "var(--ink)", margin: 0,
              }}>
                {e.event}
              </p>
            </GardenPaper>
          </article>
        );
      })}

      {/* Gentle ending */}
      <div style={{ paddingLeft: 44, position: "relative", marginTop: 8 }}>
        <div style={{
          position: "absolute", left: 4, top: 10, width: 16, height: 16,
          borderRadius: "50%", background: "transparent", border: "1.5px dashed var(--rule)",
        }} />
        <p style={{
          fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
          fontSize: 18, color: "var(--ink-faded)", margin: 0,
        }}>
          the next chapter is unwritten.
        </p>
      </div>
    </div>
  );
}

// ── Diagnoses ─────────────────────────────────────────────────────────────────

function DiagnosisList({ diagnoses }: { diagnoses: Diagnosis[] }) {
  if (diagnoses.length === 0) {
    return (
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 15, color: "var(--ink-faded)" }}>
        No diagnosis details available.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {diagnoses.map((d, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <Overline color="var(--poppy)">{d.condition}</Overline>
            {d.diagnosedDate && <Overline>since {d.diagnosedDate}</Overline>}
          </div>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-soft)", margin: 0 }}>
            {d.description}
          </p>
          {i < diagnoses.length - 1 && (
            <div style={{ marginTop: 18, borderTop: "1px dashed var(--rule)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Treatments ────────────────────────────────────────────────────────────────

const treatmentColor: Record<string, string> = {
  medication: "var(--poppy)",
  therapy:    "var(--sage)",
  procedure:  "var(--gold)",
};

function TreatmentList({ treatments }: { treatments: Treatment[] }) {
  if (treatments.length === 0) {
    return (
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 15, color: "var(--ink-faded)" }}>
        No treatment data found in your documents.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {treatments.map((t, i) => {
        const c = treatmentColor[t.type] ?? "var(--ink-faded)";
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <Overline color={c} style={{ flexShrink: 0, marginTop: 2 }}>{t.type}</Overline>
            <div>
              <p style={{
                fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
                fontSize: 15.5, fontWeight: 400, color: "var(--ink)", margin: "0 0 2px",
              }}>
                {t.name}{t.dose ? ` ${t.dose}` : ""}
              </p>
              <p style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.12em", color: "var(--ink-faded)", margin: 0, textTransform: "uppercase" }}>
                {[t.frequency, t.since ? `since ${t.since}` : ""].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Physicians ────────────────────────────────────────────────────────────────

function PhysicianList({ physicians }: { physicians: Physician[] }) {
  if (physicians.length === 0) {
    return (
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 15, color: "var(--ink-faded)" }}>
        No treating physician details found in your documents.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {physicians.map((p, i) => (
        <div key={i}>
          <p style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 18, fontWeight: 400, color: "var(--ink)", margin: "0 0 2px",
          }}>
            {p.name}
          </p>
          <Overline color="var(--accent)" style={{ display: "block", marginBottom: 6 }}>{p.specialty}</Overline>
          {p.hospital && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", margin: "0 0 4px" }}>{p.hospital}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {p.phone && <p style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, color: "var(--ink-faded)", margin: 0, letterSpacing: "0.1em" }}>{p.phone}</p>}
            {p.email && (
              <a href={`mailto:${p.email}`} style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>{p.email}</a>
            )}
          </div>
          {i < physicians.length - 1 && <div style={{ marginTop: 16, borderTop: "1px dashed var(--rule)" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Shortlisted specialists ───────────────────────────────────────────────────

function ShortlistSection({ saved }: { saved: SavedSpecialist[] }) {
  if (saved.length === 0) {
    return (
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 15, color: "var(--ink-faded)" }}>
        No specialists shortlisted yet.{" "}
        <a href="/specialist" style={{ color: "var(--poppy)", textDecoration: "none", borderBottom: "1px solid var(--poppy)" }}>Browse the directory →</a>
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {saved.map((s, i) => (
        <div key={i}>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 18, color: "var(--ink)", margin: "0 0 2px" }}>{s.specialist.name}</p>
          <Overline color="var(--accent)" style={{ display: "block", marginBottom: 4 }}>{s.specialist.specialty}</Overline>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", margin: "0 0 4px" }}>{s.specialist.subspecialty}</p>
          <p style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>{s.specialist.hospital}, {s.specialist.city}, {s.specialist.country}</p>
          {i < saved.length - 1 && <div style={{ marginTop: 16, borderTop: "1px dashed var(--rule)" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Research ──────────────────────────────────────────────────────────────────

function ResearchList({ research }: { research: Research[] }) {
  if (research.length === 0) {
    return (
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 15, color: "var(--ink-faded)" }}>No research headlines available.</p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {research.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: "var(--soft)", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 11,
            color: "var(--ink-faded)", fontWeight: 500,
          }}>
            {String(i + 1).padStart(2, "0")}
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--ink)", margin: "0 0 4px" }}>{r.title}</p>
            <Overline style={{ display: "block", marginBottom: 4 }}>{r.source} · {r.year}</Overline>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", margin: 0, lineHeight: 1.6 }}>{r.relevance}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Garden section wrapper ─────────────────────────────────────────────────────

function GardenSection({
  overline,
  title,
  children,
  action,
}: {
  overline: string;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <GardenPaper>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <div>
          <Overline style={{ display: "block", marginBottom: 6 }}>{overline}</Overline>
          <h2 style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 22, fontWeight: 400, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em",
          }}>
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 20 }}>
        {children}
      </div>
    </GardenPaper>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, credits, setCredits, displayName } = usePoppyContext();
  const [data, setData] = useState<OverviewData | null>(null);
  const [savedSpecialists, setSavedSpecialists] = useState<SavedSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const storyName = displayName;
  const hasContext = conditions.length > 0 || documents.length > 0;
  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey = documents.map((d) => d.id).sort().join("|");

  useEffect(() => {
    fetch("/api/saved-specialists")
      .then((r) => r.json())
      .then(({ saved }) => { if (Array.isArray(saved)) setSavedSpecialists(saved); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded) return;
    if (!hasContext) { setLoading(false); return; }

    setLoading(true);
    fetch("/api/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id) }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError("Could not load your health overview.");
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

  if (!loading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, background: "var(--soft)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
          color: "var(--accent)",
        }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 36, fontWeight: 400, color: "var(--ink)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          {storyName ? `${storyName}'s story.` : "your story."}
        </h1>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 28 }}>
          Add your conditions or upload medical documents and Poppy will build your personalised health summary.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/profile" style={{ padding: "12px 22px", borderRadius: 999, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", background: "var(--ink)", color: "var(--paper)", textDecoration: "none" }}>
            Add Conditions
          </a>
          <a href="/documents" style={{ padding: "12px 22px", borderRadius: 999, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", background: "var(--soft)", color: "var(--ink)", textDecoration: "none" }}>
            Upload Documents
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
      <GeneralContentBanner />

      {/* Page header */}
      <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Overline style={{ display: "block", marginBottom: 10 }}>
            your story
            {conditions.length > 0 ? ` · ${conditions.join(" · ")}` : ""}
          </Overline>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 42, fontWeight: 400, color: "var(--ink)", margin: 0,
            letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>
            {storyName ? `${storyName}'s story, ` : "your story, "}
            <em style={{ fontStyle: "italic", opacity: 0.7 }}>so far.</em>
          </h1>
          {conditions.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {conditions.map((c) => (
                <span key={c} style={{
                  fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "4px 12px", borderRadius: 999,
                  background: `var(--poppy)1f`, color: "var(--poppy)",
                }}>
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

      {error && (
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "#dc2626", marginBottom: 20 }}>{error}</p>
      )}

      {loading && <AILoadingMessage messages={OVERVIEW_MESSAGES} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Timeline — full width */}
        {loading ? <SectionSkeleton /> : (
          <GardenSection
            overline="timeline"
            title="your journey, chapter by chapter."
            action={
              data?.timeline?.[0]?.date ? (
                <Overline style={{ flexShrink: 0 }}>{data.timeline[0].date} → now</Overline>
              ) : undefined
            }
          >
            <Timeline events={data?.timeline ?? []} />
          </GardenSection>
        )}

        {/* 2-col: Diagnoses + Treatments */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {loading ? (
            <><SectionSkeleton /><SectionSkeleton /></>
          ) : (
            <>
              <GardenSection overline="diagnoses" title="what the documents say.">
                <DiagnosisList diagnoses={data?.diagnoses ?? []} />
              </GardenSection>
              <GardenSection overline="current treatments" title="how you are being cared for.">
                <TreatmentList treatments={data?.treatments ?? []} />
              </GardenSection>
            </>
          )}
        </div>

        {/* 2-col: Physicians + Shortlisted */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {loading ? (
            <><SectionSkeleton /><SectionSkeleton /></>
          ) : (
            <>
              <GardenSection overline="your doctors" title="the people in your care.">
                <PhysicianList physicians={data?.physicians ?? []} />
              </GardenSection>
              <GardenSection
                overline="shortlisted specialists"
                title="those worth knowing."
                action={
                  <a href="/specialist" style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 14, color: "var(--poppy)", textDecoration: "none", borderBottom: "1px solid var(--poppy)", paddingBottom: 1 }}>
                    browse →
                  </a>
                }
              >
                <ShortlistSection saved={savedSpecialists} />
              </GardenSection>
            </>
          )}
        </div>

        {/* Research — full width */}
        {loading ? <SectionSkeleton /> : (
          <GardenSection overline="research" title="what the science says.">
            <ResearchList research={data?.research ?? []} />
          </GardenSection>
        )}
      </div>
    </div>
  );
}
