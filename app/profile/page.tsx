"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConditionSelector from "../components/ConditionSelector";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { usePoppyContext } from "../components/PoppyProvider";
import { createClient } from "@/lib/supabase/client";

// ── WRITE POLICY ──────────────────────────────────────────────────────────────
// This page has exactly THREE profile write paths:
//
// 1. handleSave() — "Save Changes" button
//    Writes: name, date_of_birth, phone, location, location_lat, location_lng
//    Never writes: conditions, is_custodian, patient_name, role
//
// 2. handleConditionsSave() — "Save conditions" button inside conditions editor
//    Writes: conditions (only)
//
// 3. Soft/hard reset buttons — explicit confirmation flows
//    Soft: conditions: []
//    Hard: conditions: [], onboarding_completed: false
//
// Role (is_custodian / patient_name) is NEVER written from this page.
// Conditions are NEVER part of the main Save payload.
// No write occurs on mount, navigation, or from any useEffect.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  // ── Conditions and role come from PoppyContext — the single source of truth ─
  // PoppyProvider fetches these from the DB once on app load. Using them here
  // prevents a second independent fetch that could race or return stale data.
  const {
    conditions,
    conditionsLoaded,
    setConditions: setContextConditions,
    isCustodian,
    patientName,
    setDocuments,
    setMessages,
    setOnboardingCompleted,
  } = usePoppyContext();

  const router = useRouter();

  // ── Editable personal info — fetched separately, never includes role/conditions ─
  const [email, setEmail]       = useState<string | null>(null);
  const [name, setName]         = useState("");
  const [dob, setDob]           = useState("");
  const [phone, setPhone]       = useState("");
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const loadedRef = useRef(false); // prevents double-load in React StrictMode

  // ── Main save state ────────────────────────────────────────────────────────
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  // ── Conditions editor state ────────────────────────────────────────────────
  const [conditionsEditMode, setConditionsEditMode]   = useState(false);
  const [editingConditions, setEditingConditions]     = useState<string[]>([]);
  const [conditionsSaving, setConditionsSaving]       = useState(false);
  const [conditionsSaveError, setConditionsSaveError] = useState<string | null>(null);

  // ── Reset state ───────────────────────────────────────────────────────────
  const [resetMode, setResetMode]   = useState<null | "soft" | "hard">(null);
  const [resetting, setResetting]   = useState(false);

  // ── Load personal info only (name, dob, phone, location) ─────────────────
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email ?? null);
          const oauthName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            null;
          if (oauthName) setName(oauthName);
        }

        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const json = await res.json() as { profile: { name?: string | null; date_of_birth?: string | null; phone?: string | null; location?: string | null; location_lat?: number | null; location_lng?: number | null } | null };
        const profile = json.profile;
        if (profile) {
          if (profile.name) setName(profile.name);
          setDob(profile.date_of_birth ?? "");
          setPhone(profile.phone ?? "");
          setLocation(profile.location ?? "");
          setLocationLat(profile.location_lat ?? null);
          setLocationLng(profile.location_lng ?? null);
        }
      } catch {
        // silent — user can still view context-loaded data; Save button stays unlocked
      } finally {
        setProfileLoaded(true);
      }
    }
    load();
  }, []);

  // ── Main save — personal info only ────────────────────────────────────────
  async function handleSave() {
    // PROFILE WRITE — triggered by: user clicking "Save Changes".
    // Fields: name, date_of_birth, phone, location, location_lat, location_lng.
    // Intentionally excluded: conditions, is_custodian, patient_name, role.
    if (!profileLoaded) return;

    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date_of_birth: dob || null,
          phone: phone || null,
          location: location || null,
          location_lat: locationLat,
          location_lng: locationLng,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setSaveError(body.error ?? "Save failed — please try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Network error — please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  // ── Conditions save — conditions field only ───────────────────────────────
  async function handleConditionsSave() {
    // PROFILE WRITE — triggered by: user clicking "Save conditions" in the
    // dedicated conditions editor. Only field updated: conditions.
    setConditionsSaving(true);
    setConditionsSaveError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions: editingConditions }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setConditionsSaveError(body.error ?? "Save failed — please try again.");
        return;
      }
      setContextConditions(editingConditions);
      setConditionsEditMode(false);
    } catch {
      setConditionsSaveError("Network error — please check your connection.");
    } finally {
      setConditionsSaving(false);
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
            <LocationAutocomplete
              initialText={location || undefined}
              onConfirm={(data, text) => {
                setLocation(text);
                setLocationLat(data.lat);
                setLocationLng(data.lng);
              }}
              onClear={() => {
                setLocation("");
                setLocationLat(null);
                setLocationLng(null);
              }}
              placeholder="e.g. London, Manchester, New York"
              inputClassName="px-4 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 transition-colors"
              inputStyle={{ background: "var(--background)", color: "var(--foreground)" }}
            />
            <p className="text-xs text-stone-400 mt-1">Used to find specialists and support groups near you</p>
          </div>
        </div>
      </section>

      {/* Role — read-only, sourced from PoppyContext */}
      <section className="mb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50"
          style={{ color: "var(--primary)" }}
        >
          My Role
        </h2>
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--soft)" }}
        >
          {conditionsLoaded ? (
            <>
              <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>
                {isCustodian
                  ? `You are using Poppy as a Carer${patientName ? ` for ${patientName}` : ""}`
                  : "You are using Poppy as a Patient"}
              </p>
              <p className="text-xs text-stone-400 mt-1.5">
                To change your role, use the reset options below.
              </p>
            </>
          ) : (
            <div className="h-5 w-56 rounded-lg animate-pulse" style={{ background: "var(--background)" }} />
          )}
        </div>
      </section>

      {/* Conditions — read-only display, edit via dedicated editor */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-semibold uppercase tracking-wider opacity-50"
            style={{ color: "var(--primary)" }}
          >
            My Conditions
          </h2>
          {conditionsLoaded && !conditionsEditMode && (
            <button
              type="button"
              onClick={() => {
                setEditingConditions([...conditions]);
                setConditionsEditMode(true);
                setConditionsSaveError(null);
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ background: "var(--background)", color: "var(--primary)", border: "1px solid #d4c4b0" }}
            >
              Edit conditions
            </button>
          )}
        </div>
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--soft)" }}
        >
          {conditionsEditMode ? (
            <div className="flex flex-col gap-4">
              <ConditionSelector selected={editingConditions} onChange={setEditingConditions} />
              {conditionsSaveError && (
                <p className="text-sm font-medium px-3 py-2 rounded-xl" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                  {conditionsSaveError}
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleConditionsSave}
                  disabled={conditionsSaving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                >
                  {conditionsSaving ? "Saving…" : "Save conditions"}
                </button>
                <button
                  type="button"
                  onClick={() => { setConditionsEditMode(false); setConditionsSaveError(null); }}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ background: "var(--background)", color: "var(--primary)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : !conditionsLoaded ? (
            <div className="flex flex-wrap gap-2">
              {[80, 110, 95].map((w, i) => (
                <div key={i} className="h-7 rounded-full animate-pulse" style={{ width: w, background: "var(--background)" }} />
              ))}
            </div>
          ) : conditions.length === 0 ? (
            <p className="text-sm text-stone-400">No conditions added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--background)", color: "var(--primary)", border: "1px solid #d4c4b0" }}
                >
                  {c}
                </span>
              ))}
            </div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm" style={{ color: "var(--primary)" }}>
              View &amp; Upload Documents
            </p>
            <p className="text-xs text-stone-400 mt-0.5">Medical records, lab results, and reports</p>
          </div>
          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* Save personal info */}
      <button
        onClick={handleSave}
        disabled={saving || !profileLoaded}
        className="px-8 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {saving ? "Saving…" : saved ? "Saved!" : !profileLoaded ? "Loading…" : "Save Changes"}
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

          {/* Soft reset */}
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
                      // PROFILE WRITE — triggered by: user clicking "Yes, reset journey"
                      // inside the soft-reset confirmation. Fields: conditions (cleared to []).
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

          {/* Hard reset */}
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
                      // PROFILE WRITE — triggered by: user clicking "Yes, delete everything"
                      // inside the hard-reset confirmation. Fields: conditions (cleared to []),
                      // onboarding_completed (false).
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
