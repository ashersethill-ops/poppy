"use client";

import { useEffect, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";

type Specialist = {
  name: string;
  title: string;
  specialty: string;
  subspecialty: string;
  bio: string;
  hospital: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  portraitIndex: number;
  acceptingPatients: boolean;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-4 animate-pulse"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full" style={{ background: "var(--soft)" }} />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 rounded-full w-3/4" style={{ background: "var(--soft)" }} />
          <div className="h-3 rounded-full w-1/2" style={{ background: "var(--soft)" }} />
        </div>
      </div>
      <div className="h-3 rounded-full w-full" style={{ background: "var(--soft)" }} />
      <div className="h-3 rounded-full w-5/6" style={{ background: "var(--soft)" }} />
      <div className="h-3 rounded-full w-4/6" style={{ background: "var(--soft)" }} />
    </div>
  );
}

function Avatar({ specialist }: { specialist: Specialist }) {
  const [failed, setFailed] = useState(false);
  const url = `https://randomuser.me/api/portraits/${specialist.gender}/${specialist.portraitIndex}.jpg`;
  const initials = specialist.name.split(" ").slice(-2).map((w) => w[0]).join("");

  if (failed) {
    return (
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
        style={{ background: "var(--accent)" }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={specialist.name}
      className="w-20 h-20 rounded-full object-cover flex-shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function SpecialistCard({
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
    <div
      className="rounded-3xl p-6 flex flex-col gap-4 transition-transform hover:-translate-y-1"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.07)" }}
    >
      {/* Top: portrait + specialty badge + name + bookmark */}
      <div className="flex items-start gap-4">
        <Avatar specialist={specialist} />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span
            className="inline-block self-start text-xs font-medium px-2.5 py-0.5 rounded-full mb-1"
            style={{ background: "var(--soft)", color: "var(--accent)" }}
          >
            {specialist.specialty}
          </span>
          <p className="text-base font-semibold leading-tight" style={{ color: "var(--primary)" }}>
            {specialist.name}
          </p>
          <p className="text-xs" style={{ color: "var(--accent)" }}>{specialist.title}</p>
          <p className="text-xs text-stone-500">{specialist.subspecialty}</p>
        </div>
        {/* Bookmark button */}
        <button
          onClick={handleToggle}
          disabled={saving}
          title={isSaved ? "Remove from shortlist" : "Save to shortlist"}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          style={{
            background: isSaved ? "var(--accent)" : "var(--soft)",
            color: isSaved ? "#fff" : "var(--accent)",
          }}
        >
          <BookmarkIcon filled={isSaved} />
        </button>
      </div>

      {/* Bio */}
      <p className="text-sm text-stone-500 leading-relaxed">{specialist.bio}</p>

      <div style={{ borderTop: "1px solid var(--soft)" }} />

      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
          <path d="M12 21C12 21 5 13.5 5 8a7 7 0 0114 0c0 5.5-7 13-7 13z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="8" r="2.5" />
        </svg>
        <span>{specialist.hospital}, {specialist.city}, {specialist.country}</span>
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <a href={`mailto:${specialist.email}`} className="hover:underline truncate">{specialist.email}</a>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{specialist.phone}</span>
        </div>
      </div>

      {/* Accepting patients badge */}
      <div>
        <span
          className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
          style={specialist.acceptingPatients
            ? { background: "#dcfce7", color: "#15803d" }
            : { background: "var(--soft)", color: "#9ca3af" }
          }
        >
          {specialist.acceptingPatients ? "Accepting patients" : "Not accepting patients"}
        </span>
      </div>
    </div>
  );
}

export default function SpecialistPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, setPageContext } = usePoppyContext();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [savedEmails, setSavedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showShortlistOnly, setShowShortlistOnly] = useState(false);

  const hasContext = conditions.length > 0 || documents.length > 0;

  // Load saved specialists on mount
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

    if (!hasContext) {
      setLoading(false);
      return;
    }

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
  }, [conditions, conditionsLoaded, documents, documentsLoaded, hasContext, setPageContext]);

  async function toggleSave(specialist: Specialist) {
    const isSaved = savedEmails.has(specialist.email);
    // Optimistic update
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
      // Revert on failure
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
      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: "var(--soft)", color: "var(--accent)" }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3" style={{ color: "var(--primary)" }}>
          Find Your Specialists
        </h1>
        <p className="text-stone-500 leading-relaxed">
          Add your conditions in your profile and Poppy will find relevant specialists for you.
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

  const savedCount = savedEmails.size;
  const displayedSpecialists = showShortlistOnly
    ? specialists.filter((s) => savedEmails.has(s.email))
    : specialists;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: "var(--primary)" }}>
            Specialist Directory
          </h1>
          <p className="text-stone-500 text-sm">
            Specialists matched to your conditions: {conditions.join(", ")}
          </p>
        </div>

        {/* Shortlist filter */}
        {!loading && savedCount > 0 && (
          <button
            onClick={() => setShowShortlistOnly((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={showShortlistOnly
              ? { background: "var(--accent)", color: "#fff" }
              : { background: "var(--soft)", color: "var(--accent)" }
            }
          >
            <BookmarkIcon filled={showShortlistOnly} />
            Shortlist ({savedCount})
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      {showShortlistOnly && displayedSpecialists.length === 0 && (
        <p className="text-stone-400 text-sm">No saved specialists yet. Click the bookmark icon on any card to add one.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : displayedSpecialists.map((s, i) => (
              <SpecialistCard
                key={i}
                specialist={s}
                isSaved={savedEmails.has(s.email)}
                onToggleSave={() => toggleSave(s)}
              />
            ))
        }
      </div>
    </div>
  );
}
