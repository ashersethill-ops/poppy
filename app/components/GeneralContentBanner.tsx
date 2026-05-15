"use client";

import Link from "next/link";
import { usePoppyContext } from "./PoppyProvider";

export default function GeneralContentBanner() {
  const { documents, documentsLoaded, conditions } = usePoppyContext();

  // Show only when: context loaded, has conditions (is using the app), but has no documents
  if (!documentsLoaded || documents.length > 0 || conditions.length === 0) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-5 py-4 mb-6"
      style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
    >
      <svg
        className="flex-shrink-0 mt-0.5"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d97706"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <p className="text-sm font-medium" style={{ color: "#92400e" }}>
          You&apos;re seeing general information
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>
          This content is based on your selected conditions only — it is not personalised to your medical
          history. For a fully personalised experience,{" "}
          <Link
            href="/documents"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            upload your medical documents
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
