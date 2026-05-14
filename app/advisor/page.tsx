"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type Note = {
  id: string;
  condition_name: string;
  note_type: "verified" | "warning" | "guideline";
  title: string;
  description: string | null;
  url: string | null;
  created_at: string;
};

type DataSource = {
  id: string;
  condition_name: string;
  source_type: "specialist" | "article" | "trial" | "community";
  title: string;
  subtitle: string | null;
  data: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  generated_at: string;
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
    </svg>
  );
}

// ── Note type config ───────────────────────────────────────────────────────────

const noteTypeMeta = {
  verified: {
    label: "Verified Resource", bg: "#dcfce7", text: "#15803d",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  },
  warning: {
    label: "Warning / Flag", bg: "#fee2e2", text: "#dc2626",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  },
  guideline: {
    label: "Clinical Guideline", bg: "#dbeafe", text: "#1d4ed8",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
};

// ── Source type config ─────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<DataSource["source_type"], { label: string; bg: string; text: string }> = {
  specialist: { label: "Specialists",      bg: "#dbeafe", text: "#1d4ed8" },
  article:    { label: "Articles",         bg: "#f3e8ff", text: "#7e22ce" },
  trial:      { label: "Clinical Trials",  bg: "#fef3c7", text: "#d97706" },
  community:  { label: "Communities",      bg: "#dcfce7", text: "#15803d" },
};

const SOURCE_ORDER: DataSource["source_type"][] = ["specialist", "article", "trial", "community"];

// ── Data source detail rendering ───────────────────────────────────────────────

function DataSourceDetail({ source }: { source: DataSource }) {
  const d = source.data;

  if (source.source_type === "specialist") {
    return (
      <div className="text-xs text-stone-500 space-y-1 mt-2">
        <p className="font-medium" style={{ color: "var(--primary)" }}>{d.specialty as string}{d.subspecialty ? ` · ${d.subspecialty as string}` : ""}</p>
        <p>{d.hospital as string}, {d.city as string}, {d.country as string}</p>
        <p className="leading-relaxed text-stone-400">{(d.bio as string)?.slice(0, 130)}…</p>
        <p className="text-stone-400">{d.email as string} · {d.phone as string}</p>
        <span
          className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
          style={{ background: d.acceptingPatients ? "#dcfce7" : "var(--soft)", color: d.acceptingPatients ? "#15803d" : "#9ca3af" }}
        >
          {d.acceptingPatients ? "Accepting patients" : "Not accepting"}
        </span>
      </div>
    );
  }

  if (source.source_type === "article") {
    const points = d.keyPoints as string[] ?? [];
    return (
      <div className="text-xs text-stone-500 space-y-1 mt-2">
        <p className="leading-relaxed">{(d.summary as string)?.slice(0, 160)}…</p>
        <p className="text-stone-400">{points.length} key points · {d.readingTime as string}</p>
        {d.source ? <p className="text-stone-400 italic">{d.source as string}</p> : null}
        {d.pmid ? (
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${d.pmid as string}/`}
            target="_blank" rel="noopener noreferrer"
            className="hover:underline" style={{ color: "var(--accent)" }}
          >
            PMID {d.pmid as string} ↗
          </a>
        ) : null}
      </div>
    );
  }

  if (source.source_type === "trial") {
    return (
      <div className="text-xs text-stone-500 space-y-1 mt-2">
        <p><span className="font-medium">{d.sponsor as string}</span> · {d.location as string}</p>
        <p className="leading-relaxed">{(d.description as string)?.slice(0, 140)}…</p>
        <p className="text-stone-400">Eligibility: {(d.eligibility as string)?.slice(0, 90)}…</p>
      </div>
    );
  }

  if (source.source_type === "community") {
    return (
      <div className="text-xs text-stone-500 space-y-1 mt-2">
        <p className="leading-relaxed">{(d.description as string)?.slice(0, 140)}…</p>
        <p className="text-stone-400">{d.members as string} · {d.tone as string}</p>
        <a
          href={d.url as string} target="_blank" rel="noopener noreferrer"
          className="hover:underline truncate block max-w-full" style={{ color: "var(--accent)" }}
        >
          {d.url as string}
        </a>
      </div>
    );
  }

  return null;
}

// ── Data source card ───────────────────────────────────────────────────────────

function DataSourceCard({
  source,
  onReview,
}: {
  source: DataSource;
  onReview: (id: string, status: "approved" | "rejected", reason?: string) => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    await onReview(source.id, "approved");
    setBusy(false);
    setRejecting(false);
    setReason("");
  }

  async function reject() {
    setBusy(true);
    await onReview(source.id, "rejected", reason.trim() || undefined);
    setBusy(false);
    setRejecting(false);
    setReason("");
  }

  const statusMeta = {
    pending:  { bg: "#fef9c3", text: "#a16207", label: "Pending" },
    approved: { bg: "#dcfce7", text: "#15803d", label: "Approved" },
    rejected: { bg: "#fee2e2", text: "#dc2626", label: "Rejected" },
  }[source.status];

  const borderColor = statusMeta.text;

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--background)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--primary)" }}>{source.title}</p>
          {source.subtitle && <p className="text-xs text-stone-400 mt-0.5">{source.subtitle}</p>}
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: statusMeta.bg, color: statusMeta.text }}
        >
          {statusMeta.label}
        </span>
      </div>

      {/* Detail */}
      <DataSourceDetail source={source} />

      {/* Rejection reason */}
      {source.status === "rejected" && source.rejection_reason && (
        <p className="text-xs mt-2 italic" style={{ color: "#dc2626" }}>
          Reason: {source.rejection_reason}
        </p>
      )}

      {/* Actions — pending */}
      {source.status === "pending" && !rejecting && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={approve} disabled={busy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ background: "#dcfce7", color: "#15803d" }}
          >
            <CheckIcon /> Approve
          </button>
          <button
            onClick={() => setRejecting(true)} disabled={busy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            <XIcon /> Reject
          </button>
        </div>
      )}

      {/* Actions — approved: allow revoke */}
      {source.status === "approved" && !rejecting && (
        <button
          onClick={() => setRejecting(true)} disabled={busy}
          className="mt-3 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ background: "var(--soft)", color: "#9ca3af" }}
        >
          Revoke approval
        </button>
      )}

      {/* Actions — rejected: allow re-approve */}
      {source.status === "rejected" && !rejecting && (
        <button
          onClick={approve} disabled={busy}
          className="flex items-center gap-1.5 mt-3 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ background: "#dcfce7", color: "#15803d" }}
        >
          <CheckIcon /> Re-approve
        </button>
      )}

      {/* Rejection reason input (shown when rejecting any status) */}
      {rejecting && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <input
            type="text"
            placeholder="Reason for rejection (optional)…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 min-w-0 text-xs px-3 py-1.5 rounded-lg outline-none"
            style={{ background: "var(--soft)", color: "var(--foreground)" }}
          />
          <button
            onClick={reject} disabled={busy}
            className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            {busy ? "…" : "Confirm"}
          </button>
          <button
            onClick={() => { setRejecting(false); setReason(""); }}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Note card ──────────────────────────────────────────────────────────────────

function NoteCard({ note, onRemove }: { note: Note; onRemove: (id: string) => void }) {
  const meta = noteTypeMeta[note.note_type];
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    await fetch("/api/advisor/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id }),
    });
    onRemove(note.id);
  }

  return (
    <div className="rounded-2xl p-4 flex gap-3" style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
      <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: meta.bg, color: meta.text }}>
        {meta.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-medium" style={{ color: meta.text }}>{meta.label}</span>
            <p className="text-sm font-medium mt-0.5" style={{ color: "var(--primary)" }}>{note.title}</p>
          </div>
          <button
            onClick={handleRemove} disabled={removing}
            className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-40"
          >
            <XIcon />
          </button>
        </div>
        {note.description && <p className="text-xs text-stone-500 mt-1 leading-relaxed">{note.description}</p>}
        {note.url && (
          <a href={note.url} target="_blank" rel="noopener noreferrer"
            className="text-xs mt-1.5 inline-block hover:underline truncate max-w-full" style={{ color: "var(--accent)" }}>
            {note.url}
          </a>
        )}
        <p className="text-xs text-stone-300 mt-1.5">
          {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}

// ── Add note form ──────────────────────────────────────────────────────────────

function AddNoteForm({ condition, onAdded }: { condition: string; onAdded: (note: Note) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"verified" | "warning" | "guideline">("verified");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/advisor/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition_name: condition, note_type: type, title: title.trim(), description: description.trim() || null, url: url.trim() || null }),
    });
    const data = await res.json();
    if (data.note) {
      onAdded(data.note);
      setTitle(""); setDescription(""); setUrl(""); setOpen(false);
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-opacity hover:opacity-70"
        style={{ background: "var(--soft)", color: "var(--primary)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add note
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--background)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>New note for {condition}</p>
      <div className="flex gap-2 flex-wrap">
        {(["verified", "warning", "guideline"] as const).map((t) => {
          const m = noteTypeMeta[t];
          return (
            <button key={t} type="button" onClick={() => setType(t)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={type === t ? { background: m.bg, color: m.text } : { background: "var(--soft)", color: "var(--primary)" }}>
              {m.icon}{m.label}
            </button>
          );
        })}
      </div>
      <input type="text" placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} required
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "var(--soft)", color: "var(--foreground)" }} />
      <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
        style={{ background: "var(--soft)", color: "var(--foreground)" }} />
      <input type="url" placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "var(--soft)", color: "var(--foreground)" }} />
      <div className="flex gap-2">
        <button type="submit" disabled={!title.trim() || saving}
          className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)" }}>
          {saving ? "Saving…" : "Save note"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-5 py-2 rounded-xl text-sm transition-opacity hover:opacity-70"
          style={{ background: "var(--soft)", color: "var(--primary)" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const router = useRouter();

  const [conditions, setConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCondition, setActiveCondition] = useState<string | null>(null);
  const [innerTab, setInnerTab] = useState<"sources" | "notes">("sources");

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    fetch("/api/advisor/notes")
      .then((r) => {
        if (r.status === 401 || r.status === 403) { router.replace("/dashboard"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setNotes(d.notes ?? []);
        setConditions(d.conditions ?? []);
        if (d.conditions?.length) setActiveCondition(d.conditions[0]);
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Fetch data sources when active condition changes
  useEffect(() => {
    if (!activeCondition) return;
    setSourcesLoading(true);
    setDataSources([]);
    fetch(`/api/advisor/data-sources?condition=${encodeURIComponent(activeCondition)}`)
      .then((r) => r.json())
      .then((d) => setDataSources(d.sources ?? []))
      .finally(() => setSourcesLoading(false));
  }, [activeCondition]);

  async function generateSources() {
    if (!activeCondition) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/advisor/data-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition_name: activeCondition }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error ?? "Search failed — please try again");
      } else {
        setDataSources(data.sources ?? []);
      }
    } catch {
      setGenerateError("Network error — please check your connection and try again");
    } finally {
      setGenerating(false);
    }
  }

  async function reviewSource(id: string, status: "approved" | "rejected", reason?: string) {
    await fetch("/api/advisor/data-sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, rejection_reason: reason ?? null }),
    });
    setDataSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status, rejection_reason: reason ?? null, reviewed_at: new Date().toISOString() }
          : s
      )
    );
  }

  function addNote(note: Note) { setNotes((prev) => [note, ...prev]); }
  function removeNote(id: string) { setNotes((prev) => prev.filter((n) => n.id !== id)); }

  const conditionNotes = notes.filter((n) => n.condition_name === activeCondition);
  const pendingCount = dataSources.filter((s) => s.status === "pending").length;
  const approvedCount = dataSources.filter((s) => s.status === "approved").length;
  const rejectedCount = dataSources.filter((s) => s.status === "rejected").length;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6 animate-pulse">
        <div className="h-8 rounded-full w-48" style={{ background: "var(--soft)" }} />
        <div className="h-4 rounded-full w-80" style={{ background: "var(--soft)" }} />
        <div className="h-40 rounded-3xl" style={{ background: "var(--soft)" }} />
      </div>
    );
  }

  if (conditions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: "var(--soft)", color: "var(--accent)" }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-3" style={{ color: "var(--primary)" }}>No conditions assigned yet</h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          A master admin needs to assign you to one or more conditions before you can start reviewing content.
        </p>
        <a href="/dashboard" className="inline-block mt-6 text-sm hover:underline" style={{ color: "var(--accent)" }}>← Back to dashboard</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full inline-block mb-2" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
            Health Advisor
          </span>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--primary)" }}>Content Review</h1>
          <p className="text-stone-500 text-sm mt-1">
            Review and approve data sources before they are shown to patients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <span key={c} className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "var(--soft)", color: "var(--accent)" }}>{c}</span>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">

        {/* Condition tabs */}
        <div className="flex flex-col gap-1 flex-shrink-0 w-44">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide px-3 mb-2">Conditions</p>
          {conditions.map((c) => {
            const noteCount = notes.filter((n) => n.condition_name === c).length;
            return (
              <button
                key={c}
                onClick={() => setActiveCondition(c)}
                className="text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between gap-2"
                style={activeCondition === c
                  ? { background: "var(--soft)", color: "var(--accent)", fontWeight: 600 }
                  : { color: "var(--primary)" }
                }
              >
                <span className="leading-snug">{c}</span>
                {noteCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--soft)", color: "var(--accent)" }}>
                    {noteCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right panel */}
        {activeCondition && (
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Inner tabs */}
            <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "var(--soft)" }}>
              {([
                { key: "sources", label: "Data Sources" },
                { key: "notes",   label: "Notes" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setInnerTab(key)}
                  className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
                  style={innerTab === key
                    ? { background: "var(--background)", color: "var(--accent)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                    : { color: "var(--primary)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── DATA SOURCES TAB ── */}
            {innerTab === "sources" && (
              <div className="flex flex-col gap-5">

                {/* Top bar: stats + generate button */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {dataSources.length > 0 ? (
                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      <span>{dataSources.length} total</span>
                      <span className="font-medium" style={{ color: "#15803d" }}>{approvedCount} approved</span>
                      <span className="font-medium" style={{ color: "#dc2626" }}>{rejectedCount} rejected</span>
                      <span className="font-medium" style={{ color: "#a16207" }}>{pendingCount} pending</span>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-400">
                      {sourcesLoading ? "Loading…" : "No data sources generated yet for this condition."}
                    </p>
                  )}
                  <button
                    onClick={generateSources}
                    disabled={generating || sourcesLoading}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {generating ? (
                      <>
                        <RefreshIcon />
                        Searching…
                      </>
                    ) : dataSources.length > 0 ? (
                      <>
                        <RefreshIcon />
                        Refresh sources
                      </>
                    ) : (
                      <>
                        <SparkleIcon />
                        Search data sources
                      </>
                    )}
                  </button>
                </div>

                {/* Error notice */}
                {generateError && (
                  <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ background: "#fee2e2" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: "#dc2626" }}>Search failed</p>
                      <p className="text-xs mt-0.5" style={{ color: "#b91c1c" }}>{generateError}</p>
                      {generateError.includes("does not exist") && (
                        <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>
                          Run <code className="bg-red-100 px-1 rounded">setup-data-sources.sql</code> in the Supabase SQL Editor first.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Enforcement notice */}
                {dataSources.length > 0 && (
                  <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ background: "#fef9c3" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <p className="text-xs leading-relaxed" style={{ color: "#a16207" }}>
                      Only <strong>approved</strong> items are shown to patients. Pending and rejected items are hidden from the platform.
                    </p>
                  </div>
                )}

                {/* Loading skeleton */}
                {sourcesLoading && (
                  <div className="flex flex-col gap-3 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--soft)" }} />
                    ))}
                  </div>
                )}

                {/* Generating state */}
                {generating && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ background: "var(--soft)" }}>
                      <div className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--accent)", borderRightColor: "var(--accent)" }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>Agent is searching real data sources…</p>
                        <p className="text-xs text-stone-400 mt-0.5">Querying ClinicalTrials.gov, PubMed, Reddit, and the NPI physician registry. This may take 30–60 seconds.</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 animate-pulse">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl" style={{ background: "var(--soft)" }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Source type sections */}
                {!sourcesLoading && !generating && SOURCE_ORDER.map((type) => {
                  const cfg = SOURCE_CONFIG[type];
                  const items = dataSources.filter((s) => s.source_type === type);
                  if (items.length === 0) return null;

                  const approvedInType = items.filter((s) => s.status === "approved").length;
                  const pendingInType = items.filter((s) => s.status === "pending").length;

                  return (
                    <div key={type}>
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.text }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-xs text-stone-400">
                          {approvedInType}/{items.length} approved
                          {pendingInType > 0 && ` · ${pendingInType} pending`}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="flex flex-col gap-3">
                        {items.map((source) => (
                          <DataSourceCard key={source.id} source={source} onReview={reviewSource} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── NOTES TAB ── */}
            {innerTab === "notes" && (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ background: "var(--soft)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Add manual notes for <strong>{activeCondition}</strong> — verified resources, warnings about misleading sources, or clinical guidelines to inform Poppy&apos;s responses.
                  </p>
                </div>

                <AddNoteForm condition={activeCondition} onAdded={addNote} />

                {(["verified", "warning", "guideline"] as const).map((type) => {
                  const meta = noteTypeMeta[type];
                  const items = conditionNotes.filter((n) => n.note_type === type);
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: meta.bg, color: meta.text }}>{meta.icon}</span>
                        <h3 className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{meta.label}s</h3>
                        <span className="text-xs text-stone-400">({items.length})</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-xs text-stone-300 pl-8 mb-4">None added yet.</p>
                      ) : (
                        <div className="flex flex-col gap-2 mb-4">
                          {items.map((note) => (
                            <NoteCard key={note.id} note={note} onRemove={removeNote} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
