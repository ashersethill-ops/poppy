"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Patient = {
  consent_id: string;
  patient_id: string;
  patient_name: string | null;
  patient_conditions: string[] | null;
  granted_at: string;
  is_custodian: boolean;
  carer_name: string | null;
};

export default function MyPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/my-patients")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setPatients(d.patients ?? []);
      })
      .catch(() => setError("Failed to load patients"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 animate-pulse flex flex-col gap-4">
        <div className="h-8 w-48 rounded-full" style={{ background: "var(--soft)" }} />
        <div className="h-4 w-80 rounded-full" style={{ background: "var(--soft)" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-3xl" style={{ background: "var(--soft)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full inline-block mb-2" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
          Doctor Portal
        </span>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--primary)" }}>My Patients</h1>
        <p className="text-stone-500 text-sm mt-1">
          Patients who have granted you access to their health data.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl px-4 py-3 mb-6 text-sm" style={{ background: "#fee2e2", color: "#dc2626" }}>
          {error}
        </div>
      )}

      {patients.length === 0 && !error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--soft)" }}>
            <svg className="w-8 h-8" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: "var(--primary)" }}>No patients yet</p>
          <p className="text-stone-400 text-sm mt-1 max-w-sm mx-auto">
            Patients can grant you access from their &ldquo;My Doctors&rdquo; page by adding your email address.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.map((p) => {
            const conditions = p.patient_conditions ?? [];
            const initials = (p.patient_name ?? "?")
              .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

            return (
              <Link
                key={p.patient_id}
                href={`/my-patients/${p.patient_id}`}
                className="flex items-center gap-5 px-6 py-5 rounded-3xl transition-all hover:shadow-md group"
                style={{ background: "var(--background)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold" style={{ color: "var(--primary)" }}>
                      {p.patient_name ?? "Unnamed patient"}
                    </p>
                    {p.is_custodian && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
                        Via carer
                      </span>
                    )}
                  </div>
                  {p.is_custodian && p.carer_name && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      Managed by {p.carer_name}
                    </p>
                  )}
                  {conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {conditions.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "var(--soft)", color: "var(--accent)" }}
                        >
                          {c}
                        </span>
                      ))}
                      {conditions.length > 3 && (
                        <span className="text-xs text-stone-400">+{conditions.length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 mt-0.5">No conditions listed</p>
                  )}
                  <p className="text-xs text-stone-400 mt-1.5">
                    Consented {new Date(p.granted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
