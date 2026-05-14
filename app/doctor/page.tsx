"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Patient = {
  patient_id: string;
  patient_name: string | null;
  patient_conditions: string[] | null;
  granted_at: string;
  is_custodian: boolean;
  carer_name: string | null;
};

export default function DoctorHomePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-patients")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalPatients = patients.length;
  const totalConditions = new Set(
    patients.flatMap((p) => p.patient_conditions ?? [])
  ).size;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full inline-block mb-2"
          style={{ background: "#dbeafe", color: "#1d4ed8" }}
        >
          Doctor Portal
        </span>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--primary)" }}
        >
          Welcome back
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {loading
            ? "Loading your patients…"
            : totalPatients === 0
            ? "No patients have granted you access yet."
            : `You have ${totalPatients} patient${totalPatients !== 1 ? "s" : ""} across ${totalConditions} condition${totalConditions !== 1 ? "s" : ""}.`}
        </p>
      </div>

      {/* Two main tiles */}
      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        {/* My Patients tile */}
        <Link
          href="/my-patients"
          className="rounded-3xl p-7 flex flex-col gap-4 transition-all hover:shadow-lg group"
          style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--soft)" }}
          >
            <svg className="w-6 h-6" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold" style={{ color: "var(--primary)" }}>
              My Patients
            </p>
            <p className="text-sm text-stone-500 mt-1">
              View patient overviews, documents, and ask Poppy about any patient.
            </p>
          </div>
          {!loading && totalPatients > 0 && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
              style={{ background: "var(--soft)", color: "var(--accent)" }}
            >
              {totalPatients} patient{totalPatients !== 1 ? "s" : ""}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all" style={{ color: "var(--accent)" }}>
            View patients
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* To-Do List tile */}
        <Link
          href="/doctor/todo"
          className="rounded-3xl p-7 flex flex-col gap-4 transition-all hover:shadow-lg group"
          style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--soft)" }}
          >
            <svg className="w-6 h-6" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold" style={{ color: "var(--primary)" }}>
              To-Do List
            </p>
            <p className="text-sm text-stone-500 mt-1">
              AI-suggested actions and follow-ups across all your patients.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all" style={{ color: "var(--accent)" }}>
            View tasks
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Recent patients preview */}
      {!loading && patients.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">
            Recent patients
          </p>
          <div className="flex flex-col gap-2">
            {patients.slice(0, 3).map((p) => {
              const initials = (p.patient_name ?? "?")
                .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
              return (
                <Link
                  key={p.patient_id}
                  href={`/my-patients/${p.patient_id}`}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all hover:shadow-md"
                  style={{ background: "var(--background)", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                    style={{ background: "var(--accent)" }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--primary)" }}>
                      {p.patient_name ?? "Unnamed patient"}
                    </p>
                    {p.patient_conditions && p.patient_conditions.length > 0 && (
                      <p className="text-xs text-stone-400 truncate">
                        {p.patient_conditions.slice(0, 2).join(", ")}
                        {p.patient_conditions.length > 2 ? ` +${p.patient_conditions.length - 2} more` : ""}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-stone-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
            {patients.length > 3 && (
              <Link
                href="/my-patients"
                className="text-center text-sm py-2 hover:opacity-70 transition-opacity"
                style={{ color: "var(--accent)" }}
              >
                View all {patients.length} patients →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
