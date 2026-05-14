"use client";

import { useEffect, useState } from "react";

type Consent = {
  id: string;
  doctor_email: string;
  status: "active" | "revoked";
  granted_at: string;
  revoked_at: string | null;
};

export default function MyDoctorsPage() {
  const [doctors, setDoctors] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/my-doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function addDoctor(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/my-doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_email: email.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error ?? "Could not add doctor");
    } else {
      setDoctors((prev) => [data.consent, ...prev.filter((d) => d.id !== data.consent.id)]);
      setEmail("");
    }
    setAdding(false);
  }

  async function revoke(id: string) {
    setRevoking(id);
    await fetch("/api/my-doctors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDoctors((prev) => prev.map((d) => d.id === id ? { ...d, status: "revoked" as const } : d));
    setRevoking(null);
  }

  async function restore(id: string, doctorEmail: string) {
    setRevoking(id);
    const res = await fetch("/api/my-doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_email: doctorEmail }),
    });
    const data = await res.json();
    if (res.ok) setDoctors((prev) => prev.map((d) => d.id === id ? { ...d, status: "active" as const } : d));
    else if (data.consent) setDoctors((prev) => prev.map((d) => d.id === id ? data.consent : d));
    setRevoking(null);
  }

  const active = doctors.filter((d) => d.status === "active");
  const revoked = doctors.filter((d) => d.status === "revoked");

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--primary)" }}>My Doctors</h1>
        <p className="text-stone-500 text-sm mt-1">
          Doctors you add here can view your medical overview, documents, research, and chat with Poppy about your health journey.
        </p>
      </div>

      {/* Add doctor form */}
      <div className="rounded-3xl p-6 mb-8" style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--primary)" }}>Grant access to a doctor</p>
        <form onSubmit={addDoctor} className="flex gap-3">
          <input
            type="email"
            placeholder="Doctor's email address…"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--soft)", color: "var(--foreground)" }}
          />
          <button
            type="submit"
            disabled={adding || !email.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40 hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            {adding ? "Adding…" : "Grant access"}
          </button>
        </form>
        {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
        <p className="text-xs text-stone-400 mt-3">
          We will send an email notification to the doctor. You can revoke access at any time.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-2xl" style={{ background: "var(--soft)" }} />)}
        </div>
      ) : (
        <>
          {/* Active doctors */}
          {active.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">
                Active access ({active.length})
              </p>
              <div className="flex flex-col gap-2">
                {active.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl"
                    style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{d.doctor_email}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Access granted {new Date(d.granted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#dcfce7", color: "#15803d" }}>
                        Active
                      </span>
                      <button
                        onClick={() => revoke(d.id)}
                        disabled={revoking === d.id}
                        className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
                        style={{ background: "#fee2e2", color: "#dc2626" }}
                      >
                        {revoking === d.id ? "…" : "Revoke"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revoked doctors */}
          {revoked.length > 0 && (
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">
                Revoked ({revoked.length})
              </p>
              <div className="flex flex-col gap-2">
                {revoked.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl opacity-60"
                    style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{d.doctor_email}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Revoked {d.revoked_at ? new Date(d.revoked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => restore(d.id, d.doctor_email)}
                      disabled={revoking === d.id}
                      className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
                      style={{ background: "var(--soft)", color: "var(--primary)" }}
                    >
                      {revoking === d.id ? "…" : "Restore"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doctors.length === 0 && (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--soft)" }}>
                <svg className="w-7 h-7" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm">No doctors added yet.</p>
              <p className="text-stone-400 text-xs mt-1">Add your doctor&apos;s email above to share your health data with them.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
