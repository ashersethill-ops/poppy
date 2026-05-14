"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ConditionSelector from "../components/ConditionSelector";
import { usePoppyContext } from "../components/PoppyProvider";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  conditions: string[];
  date_of_birth: string | null;
  phone: string | null;
  name: string | null;
  is_custodian: boolean;
};

export default function ProfilePage() {
  const { conditions: contextConditions, setConditions: setContextConditions } = usePoppyContext();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isCustodian, setIsCustodian] = useState(false);
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  // Seed immediately from context so conditions appear without waiting for API
  const [conditions, setConditions] = useState<string[]>(contextConditions);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Keep local conditions in sync if context updates after mount
  useEffect(() => {
    setConditions(contextConditions);
  }, [contextConditions]);

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
        if (profile.name) setName(profile.name);
        if (Array.isArray(profile.conditions)) setConditions(profile.conditions);
        setDob(profile.date_of_birth ?? "");
        setPhone(profile.phone ?? "");
        setIsCustodian(profile.is_custodian ?? false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          conditions,
          date_of_birth: dob || null,
          phone: phone || null,
          onboarding_completed: conditions.length > 0 ? true : undefined,
        }),
      });
      setContextConditions(conditions);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
    </div>
  );
}
