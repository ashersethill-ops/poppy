"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConditionSelector from "../components/ConditionSelector";
import { usePoppyContext } from "../components/PoppyProvider";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  conditions: string[];
  date_of_birth: string | null;
  phone: string | null;
  name: string | null;
  is_custodian: boolean;
  patient_name: string | null;
  location: string | null;
};

export default function ProfilePage() {
  const {
    conditions: contextConditions,
    setConditions: setContextConditions,
    isCustodian: ctxIsCustodian,
    patientName: ctxPatientName,
    credits,
    setDocuments,
    setMessages,
    setOnboardingCompleted,
    setIsCustodian: setContextIsCustodian,
    setPatientName: setContextPatientName,
  } = usePoppyContext();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  // Seed from context immediately so the correct role shows without waiting for API
  const [isCustodian, setIsCustodian] = useState(ctxIsCustodian);
  const [patientName, setPatientName] = useState(ctxPatientName ?? "");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  // Seed immediately from context so conditions appear without waiting for API
  const [conditions, setConditions] = useState<string[]>(contextConditions);
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // null | "soft" (keep docs) | "hard" (delete all)
  const [resetMode, setResetMode] = useState<null | "soft" | "hard">(null);
  const [resetting, setResetting] = useState(false);

  // Keep local state in sync if context updates after mount
  useEffect(() => {
    setConditions(contextConditions);
  }, [contextConditions]);

  useEffect(() => {
    setIsCustodian(ctxIsCustodian);
  }, [ctxIsCustodian]);

  useEffect(() => {
    setPatientName(ctxPatientName ?? "");
  }, [ctxPatientName]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? null);
        const displayName =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          null;
        if (displayName) setName(displayName);
      }

      const res = await fetch("/api/profile");
      const { profile } = await res.json() as { profile: Profile | null };
      if (profile) {
        // Only set fields not managed by context (dob, phone, location).
        // isCustodian, patientName, and conditions come from context sync effects
        // so they are NOT set here — the local fetch would otherwise overwrite a
        // correct context value with a stale/null DB value, causing the visible
        // "switches back to patient" bug.
        if (profile.name) setName(profile.name);
        setDob(profile.date_of_birth ?? "");
        setPhone(profile.phone ?? "");
        setLocation(profile.location ?? "");
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          conditions,
          date_of_birth: dob || null,
          phone: phone || null,
          location: location || null,
          is_custodian: isCustodian,
          patient_name: isCustodian ? (patientName || null) : null,
          onboarding_completed: conditions.length > 0 ? true : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setSaveError(body.error ?? "Save failed — please try again.");
        return;
      }
      setContextConditions(conditions);
      setContextIsCustodian(isCustodian);
      setContextPatientName(isCustodian ? (patientName || null) : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Network error — please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1
        className="text-2xl font-semibold tracking-tight mb-8"
        style={{ color: "var(--primary)" }}
      >
        My Medical Profile
      </h1>

      {/* Personal Info */}
      <section className="mb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50"
          style={{ color: "var(--primary)" }}
        >
          Personal Info
        </h2>
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "var(--soft)" }}
        >
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--primary)" }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 transition-colors"
              style={{ background: "var(--background)", color: "var(--foreground)" }}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--primary)" }}>
              Email
            </label>
            <input
              type="email"
              value={email ?? ""}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm opacity-50 cursor-not-allowed"
              style={{ background: "var(--background)", color: "var(--foreground)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--primary)" }}>
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 transition-colors"
              style={{ background: "var(--background)", color: "var(--foreground)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--primary)" }}>
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 transition-colors"
              style={{ background: "var(--background)", color: "var(--foreground)" }}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--primary)" }}>
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 transition-colors"
              style={{ background: "var(--background)", color: "var(--foreground)" }}
              placeholder="e.g. London, Manchester, New York"
            />
            <p className="text-xs text-stone-400 mt-1">Used to find patient support groups near you</p>
          </div>
        </div>
      </section>

      {/* Role */}
      <section className="mb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50"
          style={{ color: "var(--primary)" }}
        >
          My Role
        </h2>
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "var(--soft)" }}
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setIsCustodian(false); setPatientName(""); }}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all border-2"
              style={{
                background: !isCustodian ? "var(--accent)" : "var(--background)",
                color: !isCustodian ? "#fff" : "var(--primary)",
                borderColor: !isCustodian ? "var(--accent)" : "transparent",
              }}
            >
              I am the patient
            </button>
            <button
              type="button"
              onClick={() => setIsCustodian(true)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all border-2"
              style={{
                background: isCustodian ? "var(--accent)" : "var(--background)",
                color: isCustodian ? "#fff" : "var(--primary)",
                borderColor: isCustodian ? "var(--accent)" : "transparent",
              }}
            >
              I am a carer / guardian
            </button>
          </div>
          {isCustodian && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--primary)" }}>
                Patient&apos;s Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 transition-colors"
                style={{ background: "var(--background)", color: "var(--foreground)" }}
                placeholder="Full name of the patient you care for"
              />
            </div>
          )}
        </div>
      </section>

      {/* Conditions */}
      <section className="mb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50"
          style={{ color: "var(--primary)" }}
        >
          My Conditions
        </h2>
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--soft)" }}
        >
          <ConditionSelector selected={conditions} onChange={setConditions} />
        </div>
      </section>

      {/* AI Credits */}
      <section className="mb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50"
          style={{ color: "var(--primary)" }}
        >
          AI Credits
        </h2>
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--soft)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--primary)" }}>
                {credits ?? "—"} credits remaining
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                1 credit is spent each time you refresh AI-generated content
              </p>
            </div>
            <div
              className="text-3xl font-bold tabular-nums"
              style={{ color: credits === 0 ? "#dc2626" : "var(--accent)" }}
            >
              {credits ?? "—"}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--background)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(0, ((credits ?? 300) / 300) * 100)}%`,
                background: credits !== null && credits < 50 ? "#dc2626" : "var(--accent)",
              }}
            />
          </div>
          <p className="text-xs text-stone-400">of 300 initial credits</p>

          {credits === 0 && (
            <p className="text-xs font-medium px-3 py-2 rounded-xl" style={{ background: "#fee2e2", color: "#b91c1c" }}>
              You have used all your AI credits. Content will load from cache only.
            </p>
          )}
        </div>
      </section>

      {/* Documents */}
      <section className="mb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50"
          style={{ color: "var(--primary)" }}
        >
          My Documents
        </h2>
        <Link
          href="/documents"
          className="flex items-center gap-4 rounded-2xl p-6 transition-all hover:shadow-md"
          style={{ background: "var(--soft)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--background)", color: "var(--accent)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm" style={{ color: "var(--primary)" }}>
              View &amp; Upload Documents
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Medical records, lab results, and reports
            </p>
          </div>
          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-8 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
      </button>
      {saveError && (
        <p className="mt-3 text-sm font-medium px-3 py-2 rounded-xl" style={{ background: "#fee2e2", color: "#b91c1c" }}>
          {saveError}
        </p>
      )}

      {/* Reset Journey */}
      <section className="mt-12 pt-8 border-t border-stone-200">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50"
          style={{ color: "var(--primary)" }}
        >
          Reset Journey
        </h2>
        <div className="flex flex-col gap-4">

          {/* Option 1 — soft reset */}
          <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--soft)" }}>
            <div>
              <p className="font-medium text-sm mb-0.5" style={{ color: "var(--primary)" }}>
                Reset my journey
              </p>
              <p className="text-xs text-stone-400">
                Clears your conditions, AI recommendations, and saved preferences. Your uploaded documents are kept.
              </p>
            </div>
            {resetMode === "soft" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    setResetting(true);
                    try {
                      await fetch("/api/profile", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ conditions: [] }),
                      });
                      setContextConditions([]);
                      setMessages([]);
                      router.push("/dashboard");
                    } finally {
                      setResetting(false);
                      setResetMode(null);
                    }
                  }}
                  disabled={resetting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: "#dc2626" }}
                >
                  {resetting ? "Resetting…" : "Yes, reset journey"}
                </button>
                <button
                  onClick={() => setResetMode(null)}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ background: "var(--background)", color: "var(--primary)" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setResetMode("soft")}
                disabled={resetting}
                className="self-start px-5 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ background: "var(--background)", color: "#dc2626" }}
              >
                Reset my journey
              </button>
            )}
          </div>

          {/* Option 2 — hard reset */}
          <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#fff1f2" }}>
            <div>
              <p className="font-medium text-sm mb-0.5" style={{ color: "#be123c" }}>
                Reset my journey and delete all documents
              </p>
              <p className="text-xs" style={{ color: "#9f1239" }}>
                Removes everything — conditions, documents, connected doctors, and AI content. You will be treated as a new user and redirected to the getting-started experience.
              </p>
            </div>
            {resetMode === "hard" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    setResetting(true);
                    try {
                      await Promise.all([
                        fetch("/api/documents", { method: "DELETE" }),
                        fetch("/api/my-doctors", { method: "DELETE" }),
                        fetch("/api/profile", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ conditions: [], onboarding_completed: false }),
                        }),
                      ]);
                      setContextConditions([]);
                      setDocuments([]);
                      setMessages([]);
                      setOnboardingCompleted(false);
                      router.push("/onboarding");
                    } finally {
                      setResetting(false);
                      setResetMode(null);
                    }
                  }}
                  disabled={resetting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: "#be123c" }}
                >
                  {resetting ? "Deleting…" : "Yes, delete everything"}
                </button>
                <button
                  onClick={() => setResetMode(null)}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ background: "var(--background)", color: "var(--primary)" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setResetMode("hard")}
                disabled={resetting}
                className="self-start px-5 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ background: "#fecdd3", color: "#be123c" }}
              >
                Reset and delete all documents
              </button>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
