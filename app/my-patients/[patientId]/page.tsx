"use client";

import { useEffect, useState, use } from "react";
import { usePoppyContext } from "@/app/components/PoppyProvider";

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  name: string | null;
  carer_name: string | null;
  is_custodian: boolean;
  conditions: string[] | null;
  date_of_birth: string | null;
  email: string | null;
};

type Document = {
  id: string;
  name: string;
  size_bytes: number;
  uploaded_at: string;
};

type TimelineEvent = { date: string; event: string; type: string };
type Diagnosis    = { condition: string; description: string; diagnosedDate?: string };
type Treatment    = { name: string; type: string; dose?: string; frequency?: string; since?: string };
type Physician    = { name: string; specialty: string; hospital?: string; phone?: string; email?: string };
type Research     = { title: string; source: string; year: string; relevance: string };

type Overview = {
  timeline: TimelineEvent[];
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  physicians: Physician[];
  research: Research[];
};

type Article = {
  condition: string;
  title: string;
  summary: string;
  keyPoints: string[];
  readingTime: string;
};

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
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const timelineColors: Record<string, string> = {
  diagnosis: "#dc2626",
  treatment: "#2563eb",
  test:      "#d97706",
  milestone: "var(--accent)",
};

const trialStatusColors: Record<string, { bg: string; text: string }> = {
  Recruiting: { bg: "#dcfce7", text: "#15803d" },
  Active:     { bg: "#dbeafe", text: "#1d4ed8" },
  Completed:  { bg: "var(--soft)", text: "#9ca3af" },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeletons({ n = 3 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--soft)" }} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "documents" | "research" | "learn" | "trials";

export default function PatientViewPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const { setPageContext, setPatientOverride, setMessages, setIsOpen } = usePoppyContext();

  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [overview,  setOverview]  = useState<Overview | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [tab,       setTab]       = useState<Tab>("overview");

  // Lazy-loaded per-tab
  const [articles,      setArticles]      = useState<Article[] | null>(null);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [trials,        setTrials]        = useState<Trial[] | null>(null);
  const [trialsLoading, setTrialsLoading] = useState(false);

  // Load core patient data
  useEffect(() => {
    fetch(`/api/my-patients/${patientId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setProfile(d.profile);
        setDocuments(d.documents ?? []);
        setOverview(d.overview ?? null);
      })
      .catch(() => setError("Failed to load patient data"))
      .finally(() => setLoading(false));
  }, [patientId]);

  // Poppy context — set patient override so drawer uses patient's docs + conditions
  useEffect(() => {
    if (!profile) return;
    const conditions = profile.conditions ?? [];
    const patientName = profile.name ?? "this patient";

    setPageContext(
      `The current user is a doctor reviewing a patient named ${patientName} ` +
      (conditions.length
        ? `who has the following conditions: ${conditions.join(", ")}.`
        : "with no listed conditions.") +
      ` The doctor may ask questions about this patient's health, treatments, medications, trials, or conditions.`
    );

    setPatientOverride({
      patientId: profile.id,
      patientName,
      conditions,
      documentIds: documents.map((d) => d.id),
    });

    // Clear previous chat so history from another patient doesn't carry over
    setMessages([]);

    return () => {
      setPageContext("");
      setPatientOverride(null);
    };
  }, [profile, documents, setPageContext, setPatientOverride, setMessages]);

  // Lazy-load Learn when tab is first opened
  useEffect(() => {
    if (tab !== "learn" || articles !== null || articlesLoading) return;
    const conditions = profile?.conditions ?? [];
    if (conditions.length === 0) return;
    setArticlesLoading(true);
    fetch("/api/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions }),
    })
      .then((r) => r.json())
      .then((d) => setArticles(d.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setArticlesLoading(false));
  }, [tab, profile, articles, articlesLoading]);

  // Lazy-load Trials when tab is first opened
  useEffect(() => {
    if (tab !== "trials" || trials !== null || trialsLoading) return;
    const conditions = profile?.conditions ?? [];
    if (conditions.length === 0) return;
    setTrialsLoading(true);
    fetch("/api/trials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions }),
    })
      .then((r) => r.json())
      .then((d) => setTrials(d.trials ?? []))
      .catch(() => setTrials([]))
      .finally(() => setTrialsLoading(false));
  }, [tab, profile, trials, trialsLoading]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 animate-pulse flex flex-col gap-5">
        <div className="h-28 rounded-3xl" style={{ background: "var(--soft)" }} />
        <div className="h-10 w-64 rounded-2xl" style={{ background: "var(--soft)" }} />
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--soft)" }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <p className="font-medium text-red-600 mb-2">Access denied</p>
        <p className="text-stone-500 text-sm">{error}</p>
        <a href="/my-patients" className="inline-block mt-6 text-sm hover:underline" style={{ color: "var(--accent)" }}>
          ← Back to patients
        </a>
      </div>
    );
  }

  const conditions = profile?.conditions ?? [];
  const initials   = (profile?.name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Back link */}
      <a href="/my-patients" className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-6">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All patients
      </a>

      {/* Patient banner */}
      <div
        className="rounded-3xl px-6 py-5 mb-8 flex items-center gap-5 flex-wrap"
        style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{ background: "var(--accent)" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold" style={{ color: "var(--primary)" }}>
              {profile?.name ?? "Unnamed patient"}
            </h1>
            {profile?.is_custodian && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
                Via carer
              </span>
            )}
          </div>
          {profile?.is_custodian && profile.carer_name && (
            <p className="text-xs text-stone-400 mt-0.5">
              Managed by {profile.carer_name} · contact via their account email
            </p>
          )}
          {profile?.date_of_birth && (
            <p className="text-xs text-stone-400 mt-0.5">
              DOB: {new Date(profile.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {conditions.map((c) => (
                <span key={c} className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: "var(--soft)", color: "var(--accent)" }}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Ask Poppy
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl w-fit overflow-x-auto" style={{ background: "var(--soft)" }}>
        {(["overview", "documents", "research", "learn", "trials"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize whitespace-nowrap"
            style={tab === t
              ? { background: "var(--background)", color: "var(--accent)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
              : { color: "var(--primary)" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          {!overview ? (
            <div className="text-center py-12 text-stone-400 text-sm">
              {conditions.length === 0 && documents.length === 0
                ? "No conditions or documents on file — overview unavailable."
                : "Could not generate overview. Try again later."}
            </div>
          ) : (
            <>
              {overview.timeline?.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-4">Timeline</h2>
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-px" style={{ background: "var(--soft)" }} />
                    {overview.timeline.map((ev, i) => (
                      <div key={i} className="relative mb-5 last:mb-0">
                        <div
                          className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                          style={{ background: timelineColors[ev.type] ?? "var(--accent)" }}
                        />
                        <p className="text-xs text-stone-400">{ev.date}</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: "var(--primary)" }}>{ev.event}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid md:grid-cols-2 gap-5">
                {overview.diagnoses?.length > 0 && (
                  <section className="rounded-2xl p-5" style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Diagnoses</h2>
                    <div className="flex flex-col gap-3">
                      {overview.diagnoses.map((d, i) => (
                        <div key={i}>
                          <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{d.condition}</p>
                          {d.diagnosedDate && <p className="text-xs text-stone-400">Diagnosed: {d.diagnosedDate}</p>}
                          <p className="text-xs text-stone-500 mt-1 leading-relaxed">{d.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {overview.treatments?.length > 0 && (
                  <section className="rounded-2xl p-5" style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Treatments</h2>
                    <div className="flex flex-col gap-2">
                      {overview.treatments.map((t, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 capitalize" style={{ background: "var(--soft)", color: "var(--primary)" }}>
                            {t.type}
                          </span>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{t.name}</p>
                            {(t.dose || t.frequency) && (
                              <p className="text-xs text-stone-400">{[t.dose, t.frequency].filter(Boolean).join(" · ")}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {overview.physicians?.length > 0 && (
                <section className="rounded-2xl p-5" style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Treating Physicians</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {overview.physicians.map((p, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: "var(--soft)" }}>
                        <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{p.name}</p>
                        <p className="text-xs text-stone-500">{p.specialty}{p.hospital ? ` · ${p.hospital}` : ""}</p>
                        {p.email && <p className="text-xs text-stone-400 mt-1">{p.email}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Documents tab ── */}
      {tab === "documents" && (
        <div>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">No documents uploaded by this patient.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                  style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--soft)" }}>
                    <svg width="18" height="18" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--primary)" }}>{doc.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatBytes(doc.size_bytes)} · {new Date(doc.uploaded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Research tab ── */}
      {tab === "research" && (
        <div className="flex flex-col gap-4">
          {overview?.research?.length ? (
            overview.research.map((r, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                <p className="text-sm font-semibold leading-snug" style={{ color: "var(--primary)" }}>{r.title}</p>
                <p className="text-xs text-stone-400 mt-1">{r.source} · {r.year}</p>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">{r.relevance}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-stone-400 text-sm">No research available for this patient&apos;s conditions.</div>
          )}
        </div>
      )}

      {/* ── Learn tab ── */}
      {tab === "learn" && (
        <div className="flex flex-col gap-5">
          {conditions.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">No conditions on file — cannot generate educational content.</div>
          ) : articlesLoading ? (
            <div>
              <Skeletons n={3} />
              <p className="text-center text-xs text-stone-400 mt-4">Generating articles for {conditions.join(", ")}…</p>
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">Could not load articles. Try again later.</div>
          ) : (
            articles.map((a, i) => (
              <div key={i} className="rounded-3xl p-6 flex flex-col gap-3" style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: "var(--soft)", color: "var(--accent)" }}>
                    {a.condition}
                  </span>
                  <span className="text-xs text-stone-400">{a.readingTime}</span>
                </div>
                <p className="text-base font-semibold leading-snug" style={{ color: "var(--primary)" }}>{a.title}</p>
                <p className="text-sm text-stone-500 leading-relaxed">{a.summary}</p>
                {a.keyPoints?.length > 0 && (
                  <ul className="flex flex-col gap-1.5 mt-1">
                    {a.keyPoints.map((pt, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-stone-600">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Trials tab ── */}
      {tab === "trials" && (
        <div className="flex flex-col gap-4">
          {conditions.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">No conditions on file — cannot search for trials.</div>
          ) : trialsLoading ? (
            <div>
              <Skeletons n={3} />
              <p className="text-center text-xs text-stone-400 mt-4">Searching trials for {conditions.join(", ")}…</p>
            </div>
          ) : !trials || trials.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">No trials found for this patient&apos;s conditions.</div>
          ) : (
            trials.map((t, i) => {
              const sc = trialStatusColors[t.status] ?? trialStatusColors.Completed;
              return (
                <div key={i} className="rounded-2xl p-5" style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-start gap-2 flex-wrap mb-2">
                    <p className="text-sm font-semibold flex-1" style={{ color: "var(--primary)" }}>{t.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: sc.bg, color: sc.text }}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                    <span className="text-xs text-stone-400">{t.phase}</span>
                    {t.sponsor && <span className="text-xs text-stone-400">{t.sponsor}</span>}
                    {t.location && <span className="text-xs text-stone-400">{t.location}</span>}
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed mb-2">{t.description}</p>
                  {t.eligibility && (
                    <p className="text-xs text-stone-400"><span className="font-medium">Eligibility:</span> {t.eligibility}</p>
                  )}
                  {t.contact && (
                    <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>{t.contact}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
