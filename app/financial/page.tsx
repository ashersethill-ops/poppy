"use client";

import { useEffect, useRef, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";
import AILoadingMessage from "../components/AILoadingMessage";
import UpdateButton from "../components/UpdateButton";
import GeneralContentBanner from "../components/GeneralContentBanner";

const LOADING_MESSAGES = [
  "Reviewing your insurance coverage…",
  "Scanning for patient assistance programmes…",
  "Comparing plan options for your conditions…",
  "Identifying cost-saving opportunities…",
  "Checking manufacturer copay programmes…",
  "Preparing your personalised financial guidance…",
];

// ── Types ──────────────────────────────────────────────────────────────────────

type InsuranceDoc = { id: string; name: string; size_bytes: number; uploaded_at: string };

type PolicyAnalysis = {
  summary: string;
  deductible: string;
  outOfPocketMax: string;
  conditionCoverage: string;
  gaps: string[];
  keyPoints: string[];
};

type BetterPlan = {
  name: string;
  type: string;
  why: string;
  estimatedAnnualSaving: string;
};

type CostTip = {
  category: string;
  tip: string;
  potentialSaving: string;
};

// ── Garden atoms ───────────────────────────────────────────────────────────────

const Overline = ({ children, color, style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) => (
  <span style={{
    fontFamily: "'Geist Mono', ui-monospace, monospace",
    fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
    color: color ?? "var(--ink-faded)", ...style,
  }}>
    {children}
  </span>
);

const GardenPaper = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "var(--paper)", borderRadius: 18, border: "1px solid var(--rule)", ...style }}>
    {children}
  </div>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <GardenPaper style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ height: 10, width: "50%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 18, width: "80%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height, borderRadius: 12, background: "var(--soft)" }} />
    </GardenPaper>
  );
}

// ── Policy Analysis card ───────────────────────────────────────────────────────

function PolicyAnalysisCard({ analysis }: { analysis: PolicyAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <GardenPaper style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#7C8E6B22", border: "1px solid #7C8E6B44", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C8E6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <Overline color="#7C8E6B">Your current policy</Overline>
          <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 22, fontWeight: 400, color: "var(--ink)", margin: "2px 0 0", lineHeight: 1.15 }}>
            Policy Analysis
          </h2>
        </div>
      </div>

      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 18 }}>
        {analysis.summary}
      </p>

      {/* Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Deductible", value: analysis.deductible },
          { label: "Out-of-pocket max", value: analysis.outOfPocketMax },
        ].map((chip) => (
          <div key={chip.label} style={{ padding: "6px 12px", borderRadius: 999, background: "var(--soft)", border: "1px solid var(--rule)", display: "flex", gap: 6, alignItems: "center" }}>
            <Overline>{chip.label}</Overline>
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{chip.value}</span>
          </div>
        ))}
      </div>

      {/* Condition coverage */}
      <div style={{ padding: "12px 16px", background: "var(--soft)", borderRadius: 12, border: "1px dashed var(--rule)", marginBottom: 16 }}>
        <Overline style={{ display: "block", marginBottom: 6 }}>Coverage for your condition</Overline>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 14, color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>{analysis.conditionCoverage}</p>
      </div>

      {expanded && (
        <>
          {/* Gaps */}
          {analysis.gaps.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <Overline color="#dc2626" style={{ display: "block", marginBottom: 8 }}>Coverage gaps</Overline>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {analysis.gaps.map((gap, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key points */}
          {analysis.keyPoints.length > 0 && (
            <div>
              <Overline style={{ display: "block", marginBottom: 8 }}>Key policy points</Overline>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                {analysis.keyPoints.map((pt, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#7C8E6B", fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", lineHeight: 1 }}>·</span>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 14, color: "var(--ink)", lineHeight: 1.55 }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5, marginTop: 14,
          background: "transparent", border: "none", padding: 0, cursor: "pointer",
          fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
          fontSize: 13, color: "var(--ink-faded)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {expanded ? "show less" : "see gaps & key points"}
      </button>
    </GardenPaper>
  );
}

// ── Better Plans card ──────────────────────────────────────────────────────────

function BetterPlansCard({ plans }: { plans: BetterPlan[] }) {
  return (
    <GardenPaper style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#B07E2C22", border: "1px solid #B07E2C44", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B07E2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <Overline color="#B07E2C">Plans to consider</Overline>
          <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 22, fontWeight: 400, color: "var(--ink)", margin: "2px 0 0", lineHeight: 1.15 }}>
            Better Plans for Your Conditions
          </h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {plans.map((plan, i) => (
          <div key={i} style={{ background: "var(--soft)", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--rule)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, fontWeight: 500, color: "var(--ink)", lineHeight: 1.2 }}>{plan.name}</span>
              <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: 999, background: "#B07E2C22", fontFamily: "'Geist Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#B07E2C" }}>{plan.type}</span>
            </div>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>{plan.why}</p>
            <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px dashed var(--rule)" }}>
              <Overline color="var(--sage)">{plan.estimatedAnnualSaving}</Overline>
            </div>
          </div>
        ))}
      </div>
    </GardenPaper>
  );
}

// ── Cost Tips card ─────────────────────────────────────────────────────────────

function CostTipsCard({ tips }: { tips: CostTip[] }) {
  return (
    <GardenPaper style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--poppy)22", border: "1px solid var(--poppy)44", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--poppy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        </div>
        <div>
          <Overline color="var(--poppy)">Reduce your costs</Overline>
          <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 22, fontWeight: 400, color: "var(--ink)", margin: "2px 0 0", lineHeight: 1.15 }}>
            Cost Optimisation Tips
          </h2>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tips.map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "var(--soft)", borderRadius: 12, border: "1px solid var(--rule)" }}>
            <div style={{ flexShrink: 0, width: 6, height: 6, borderRadius: 999, background: "var(--poppy)", marginTop: 6 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <Overline color="var(--ink)">{tip.category}</Overline>
                <Overline color="var(--sage)">{tip.potentialSaving}</Overline>
              </div>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}>{tip.tip}</p>
            </div>
          </div>
        ))}
      </div>
    </GardenPaper>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FinancialPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, setPageContext, credits, setCredits } = usePoppyContext();

  const [insuranceDocs,       setInsuranceDocs]       = useState<InsuranceDoc[]>([]);
  const [insuranceDocsLoaded, setInsuranceDocsLoaded] = useState(false);
  const [uploading,           setUploading]           = useState(false);
  const [currentlyUploading,  setCurrentlyUploading]  = useState<string | null>(null);
  const [uploadError,         setUploadError]         = useState("");

  const [policyAnalysis, setPolicyAnalysis] = useState<PolicyAnalysis | null>(null);
  const [betterPlans,    setBetterPlans]    = useState<BetterPlan[]>([]);
  const [costTips,       setCostTips]       = useState<CostTip[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [updating,       setUpdating]       = useState(false);
  const [cachedAt,       setCachedAt]       = useState<string | null>(null);
  const [error,          setError]          = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const hasContext       = conditions.length > 0 || documents.length > 0 || insuranceDocs.length > 0;
  const conditionsKey    = conditions.slice().sort().join("|");
  const documentsKey     = documents.map((d) => d.id).sort().join("|");
  const insuranceDocsKey = insuranceDocs.map((d) => d.id).sort().join("|");

  // Load insurance documents on mount
  useEffect(() => {
    fetch("/api/insurance-documents")
      .then((r) => r.json())
      .then(({ documents: docs }) => { if (Array.isArray(docs)) setInsuranceDocs(docs); })
      .catch(() => {})
      .finally(() => setInsuranceDocsLoaded(true));
  }, []);

  // Fetch AI content when conditions / documents / insurance docs change
  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded || !insuranceDocsLoaded) return;

    setPolicyAnalysis(null); setBetterPlans([]); setCostTips([]); setError("");

    if (!hasContext) { setLoading(false); return; }

    setLoading(true);
    fetch("/api/financial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conditions,
        documentIds:     documents.map((d) => d.id),
        insuranceDocIds: insuranceDocs.map((d) => d.id),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.costTips || data.betterPlans) {
          setPolicyAnalysis(data.policyAnalysis ?? null);
          setBetterPlans(data.betterPlans ?? []);
          setCostTips(data.costTips ?? []);
          setCachedAt(data.cachedAt ?? null);
          setPageContext("The user is on the Benefits & Costs page reviewing their insurance and financial guidance.");
        } else {
          setError("Could not load financial guidance.");
        }
      })
      .catch(() => setError("Could not load financial guidance."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, insuranceDocsKey, conditionsLoaded, documentsLoaded, insuranceDocsLoaded]);

  async function updateFinancial() {
    if (!hasContext || updating) return;
    setUpdating(true); setError("");
    try {
      const res = await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditions,
          documentIds:     documents.map((d) => d.id),
          insuranceDocIds: insuranceDocs.map((d) => d.id),
          forceRefresh: true,
        }),
      });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.costTips || data.betterPlans) {
        setPolicyAnalysis(data.policyAnalysis ?? null);
        setBetterPlans(data.betterPlans ?? []);
        setCostTips(data.costTips ?? []);
        setCachedAt(data.cachedAt ?? null);
        if (data.remainingCredits !== undefined) setCredits(data.remainingCredits);
      }
    } catch {
      setError("Could not refresh financial guidance.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    setUploadError("");
    for (const file of arr) {
      setCurrentlyUploading(file.name);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/insurance-documents", { method: "POST", body: fd });
        const json = await res.json().catch(() => ({})) as { document?: InsuranceDoc; error?: string };
        if (res.ok && json.document) {
          setInsuranceDocs((p) => [json.document!, ...p]);
        } else {
          setUploadError(json.error ?? `Upload failed (${res.status})`);
        }
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setCurrentlyUploading(null);
    setUploading(false);
  }

  async function deleteInsuranceDoc(id: string) {
    await fetch(`/api/insurance-documents/${id}`, { method: "DELETE" });
    setInsuranceDocs((p) => p.filter((d) => d.id !== id));
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!loading && conditionsLoaded && documentsLoaded && insuranceDocsLoaded && !hasContext) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 36, fontWeight: 400, color: "var(--ink)", margin: "0 0 16px" }}>
          your money, <em>working harder.</em>
        </h1>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 28 }}>
          Add your conditions in your profile and Poppy will find insurance plans, patient assistance programmes, and cost-saving tips tailored to your situation.
        </p>
        <a href="/profile" style={{ padding: "12px 22px", borderRadius: 999, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", background: "var(--ink)", color: "var(--paper)", textDecoration: "none" }}>
          Go to Profile
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      <GeneralContentBanner />

      {/* ── Page header ── */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Overline color="var(--poppy)" style={{ display: "block", marginBottom: 10 }}>
            benefits & costs · {conditions.join(" · ") || "your conditions"}
          </Overline>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 42, fontWeight: 400, color: "var(--ink)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            your money, <em>working</em> harder.
          </h1>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.6, margin: "12px 0 0", maxWidth: 560 }}>
            Upload your insurance policy to get a plain-language analysis, then discover better plans and savings programmes tailored to your conditions.
          </p>
        </div>
        {!loading && hasContext && (
          <UpdateButton onClick={updateFinancial} loading={updating} credits={credits} cachedAt={cachedAt} />
        )}
      </div>

      {/* ── Insurance Documents upload panel ── */}
      <GardenPaper style={{ padding: 24, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faded)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          <Overline>Insurance policy documents</Overline>
        </div>

        {/* Uploaded files list */}
        {insuranceDocs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {insuranceDocs.map((doc) => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--soft)", borderRadius: 10, border: "1px solid var(--rule)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13.5, color: "var(--ink)" }}>{doc.name}</span>
                </div>
                <button
                  onClick={() => deleteInsuranceDoc(doc.id)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ink-faded)", padding: "2px 4px", borderRadius: 6, lineHeight: 1 }}
                  aria-label="Remove document"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: "1.5px dashed var(--rule)", borderRadius: 14, padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, background: "transparent" }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--primary)", margin: "0 0 2px", fontWeight: 500 }}>
              {uploading && currentlyUploading ? `Uploading ${currentlyUploading}…` : "Upload insurance policy documents"}
            </p>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--ink-faded)", margin: 0 }}>
              PDF or TXT · up to 10 MB each
            </p>
          </div>
          {!uploading && (
            <button
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              style={{ marginLeft: "auto", padding: "7px 16px", borderRadius: 999, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, fontWeight: 600, flexShrink: 0 }}
            >
              Browse
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" multiple accept=".pdf,.txt" style={{ display: "none" }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />

        {uploadError && (
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, color: "#dc2626", margin: "10px 0 0" }}>
            {uploadError}
          </p>
        )}
        {!uploadError && insuranceDocs.length === 0 && (
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13, color: "var(--ink-faded)", margin: "10px 0 0" }}>
            No policy uploaded yet — Poppy will still suggest plans and savings tips based on your conditions.
          </p>
        )}
      </GardenPaper>

      {error && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "#dc2626", marginBottom: 16 }}>{error}</p>}
      {loading && <AILoadingMessage messages={LOADING_MESSAGES} />}

      {/* ── AI content sections ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Policy Analysis — only when insurance docs uploaded */}
        {loading ? (
          insuranceDocs.length > 0 ? <SkeletonCard height={160} /> : null
        ) : policyAnalysis ? (
          <PolicyAnalysisCard analysis={policyAnalysis} />
        ) : null}

        {/* Better Plans */}
        {loading ? (
          <SkeletonCard height={180} />
        ) : betterPlans.length > 0 ? (
          <BetterPlansCard plans={betterPlans} />
        ) : null}

        {/* Cost Tips */}
        {loading ? (
          <SkeletonCard height={200} />
        ) : costTips.length > 0 ? (
          <CostTipsCard tips={costTips} />
        ) : null}

      </div>
    </div>
  );
}
