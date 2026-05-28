"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePoppyContext } from "../components/PoppyProvider";

// ── Poppy Flower SVG ─────────────────────────────────────────────────────────

function PoppyFlowerSVG({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="32" cy="18" rx="9" ry="16" fill="#E07850" opacity="0.92" />
      <ellipse cx="32" cy="46" rx="9" ry="16" fill="#E07850" opacity="0.92" />
      <ellipse cx="18" cy="32" rx="16" ry="9" fill="#C95E35" opacity="0.85" />
      <ellipse cx="46" cy="32" rx="16" ry="9" fill="#C95E35" opacity="0.85" />
      <ellipse cx="21" cy="21" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(-45 21 21)" />
      <ellipse cx="43" cy="21" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(45 43 21)" />
      <ellipse cx="21" cy="43" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(45 21 43)" />
      <ellipse cx="43" cy="43" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(-45 43 43)" />
      <circle cx="32" cy="32" r="9" fill="#2C1810" />
      <circle cx="29" cy="29" r="1.2" fill="#5C3820" />
      <circle cx="32" cy="28" r="1.2" fill="#5C3820" />
      <circle cx="35" cy="29" r="1.2" fill="#5C3820" />
      <circle cx="30" cy="32" r="1.2" fill="#5C3820" />
      <circle cx="34" cy="32" r="1.2" fill="#5C3820" />
      <circle cx="32" cy="35" r="1.2" fill="#5C3820" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Trial = {
  condition: string;
  title: string;
  phase: string;
  status: "Recruiting" | "Active" | "Completed";
  location: string;
  eligibility_match: "eligible" | "likely_eligible" | "not_eligible";
};

type Post = {
  platform: string;
  subreddit?: string;
  author: string;
  title: string;
  url?: string;
  condition: string;
  timeAgo?: string;
};

type Specialist = {
  name: string;
  specialty: string;
  hospital: string;
  city: string;
  acceptingPatients: boolean;
  email: string;
  gender: "male" | "female";
  portraitIndex: number;
};

type Doctor = {
  id: string;
  doctor_email: string;
  status: string;
  granted_at: string;
};

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/overview",
    label: "Story",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/documents",
    label: "Documents",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    href: "/specialist",
    label: "Specialists",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/learn",
    label: "Learn",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: "/trials",
    label: "Trials",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/community",
    label: "Community",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/financial",
    label: "Benefits & Costs",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    href: "/my-doctors",
    label: "My Doctors",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "My Profile",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      </svg>
    ),
  },
];


// ── Nav Drawer ────────────────────────────────────────────────────────────────

function NavDrawer({ isOpen, onClose, pathname }: { isOpen: boolean; onClose: () => void; pathname: string }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(36,26,20,0.30)", backdropFilter: "blur(1px)" }}
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-y-auto"
        style={{
          width: "268px",
          background: "var(--soft)",
          borderRight: "1px solid var(--rule)",
          boxShadow: isOpen ? "12px 0 36px -8px rgba(36,26,20,0.18)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: "22px 20px",
          gap: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Wordmark + close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <PoppyFlowerSVG size={22} />
            <span style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontStyle: "italic", fontWeight: 500, fontSize: 20, color: "var(--ink)", letterSpacing: "-0.01em" }}>poppy</span>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 999, border: "none", background: "transparent", color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Close menu"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6L18 18M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--ink-faded)", padding: "0 4px 8px" }}>
          navigation
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  fontFamily: "'Newsreader', 'Lora', Georgia, serif",
                  fontSize: 15, padding: "10px 14px", borderRadius: 10,
                  color: active ? "var(--ink)" : "var(--ink-soft)",
                  background: active ? "var(--background)" : "transparent",
                  textDecoration: "none",
                  fontStyle: active ? "italic" : "normal",
                  border: active ? "1px solid var(--rule)" : "1px solid transparent",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <span style={{ opacity: 0.7 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── OrbitalCard ───────────────────────────────────────────────────────────────

function OrbitalCard({
  left, top, href, accent, label, status, loading,
}: {
  left: string; top: string;
  href: string; accent: string;
  label: string; status: string;
  loading?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        position: "absolute", left, top,
        transform: "translate(-50%, -50%)",
        width: "168px", padding: "14px 18px",
        background: "var(--paper)",
        borderRadius: 16,
        border: "1px solid var(--rule)",
        boxShadow: "0 6px 20px -10px rgba(36,26,20,0.18)",
        textDecoration: "none", display: "flex", flexDirection: "column", gap: 7,
        zIndex: 10,
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translate(-50%, -52%)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 30px -10px rgba(36,26,20,0.24)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translate(-50%, -50%)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px -10px rgba(36,26,20,0.18)";
      }}
    >
      {/* Accent dot */}
      <div style={{
        width: 22, height: 22, borderRadius: 999,
        background: `${accent}22`, border: `1px solid ${accent}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 7, height: 7, borderRadius: 999, background: accent }} />
      </div>
      {/* Label */}
      <span style={{
        fontFamily: "'Newsreader', 'Lora', Georgia, serif",
        fontStyle: "italic", fontSize: 17, fontWeight: 400,
        color: "var(--ink)", lineHeight: 1.15,
      }}>{label}</span>
      {/* Status */}
      {loading ? (
        <div style={{ height: 12, width: 80, borderRadius: 6, background: "rgba(0,0,0,0.08)", animation: "pulse 1.5s infinite" }} />
      ) : (
        <span style={{
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
          color: accent,
        }}>{status}</span>
      )}
    </Link>
  );
}

// ── MobileCard ────────────────────────────────────────────────────────────────

function MobileCard({ href, accent, label, status }: {
  href: string; accent: string; label: string; status: string;
}) {
  return (
    <Link
      href={href}
      style={{
        background: "var(--paper)", border: "1px solid var(--rule)",
        borderRadius: 16, padding: "14px 16px",
        boxShadow: "0 4px 14px -8px rgba(36,26,20,0.14)",
        textDecoration: "none", display: "flex", flexDirection: "column", gap: 8,
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: 999, background: `${accent}22`, border: `1px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 6, height: 6, borderRadius: 999, background: accent }} />
      </div>
      <span style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--ink)" }}>{label}</span>
      <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: accent }}>{status}</span>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { conditions, conditionsLoaded, documents, isCustodian, displayName, greetingName } = usePoppyContext();
  const pathname = usePathname();

  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const [trials,      setTrials]      = useState<Trial[] | null>(null);
  const [posts,       setPosts]       = useState<Post[] | null>(null);
  const [specialists, setSpecialists] = useState<Specialist[] | null>(null);
  const [doctors,     setDoctors]     = useState<Doctor[] | null>(null);

  const [trialsLoading,      setTrialsLoading]      = useState(true);
  const [postsLoading,       setPostsLoading]       = useState(true);
  const [specialistsLoading, setSpecialistsLoading] = useState(true);
  const [doctorsLoading,     setDoctorsLoading]     = useState(true);

  // Auth + doctors
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));

    fetch("/api/my-doctors")
      .then((r) => r.json())
      .then(({ doctors: d }) => setDoctors((d ?? []).filter((doc: Doctor) => doc.status === "active")))
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, []);

  // Condition-based tiles
  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey  = documents.map((d) => d.id).sort().join("|");

  useEffect(() => {
    if (!conditionsLoaded) return;

    if (conditions.length === 0) {
      setTrials([]); setPosts([]); setSpecialists([]);
      setTrialsLoading(false); setPostsLoading(false); setSpecialistsLoading(false);
      return;
    }

    const headers = { "Content-Type": "application/json" };
    const docIds  = documents.map((d) => d.id);

    setTrialsLoading(true);
    fetch("/api/trials", { method: "POST", headers, body: JSON.stringify({ conditions }) })
      .then((r) => r.json())
      .then((d) => setTrials((d.trials ?? []).filter((t: Trial) => t.eligibility_match !== "not_eligible")))
      .catch(() => setTrials([]))
      .finally(() => setTrialsLoading(false));

    setPostsLoading(true);
    fetch("/api/community-posts", { method: "POST", headers, body: JSON.stringify({ conditions }) })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));

    setSpecialistsLoading(true);
    fetch("/api/specialists", { method: "POST", headers, body: JSON.stringify({ conditions, documentIds: docIds }) })
      .then((r) => r.json())
      .then((d) => setSpecialists(d.specialists ?? []))
      .catch(() => setSpecialists([]))
      .finally(() => setSpecialistsLoading(false));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, conditionsLoaded]);

  const hasConditions = conditions.length > 0;

  // Center circle uses displayName (patient-focused), never falls back to carer's own name
  const circleInitials  = displayName ? getInitials(displayName) : "?";
  const circleFirstName = displayName ?? (isCustodian ? "Patient" : "You");

  // Status badge text
  const trialsStatus      = trialsLoading      ? null : !hasConditions ? "Add conditions" : (trials?.length ?? 0) > 0 ? `${trials!.length} eligible` : "None found";
  const communityStatus   = postsLoading       ? null : !hasConditions ? "Add conditions" : (posts?.length ?? 0) > 0 ? `${posts!.length} discussions` : "Explore";
  const specialistsStatus = specialistsLoading ? null : !hasConditions ? "Add conditions" : (() => { const acc = specialists?.filter((s) => s.acceptingPatients).length ?? 0; return acc > 0 ? `${acc} accepting` : `${specialists?.length ?? 0} found`; })();
  const doctorsStatus     = doctorsLoading     ? null : (doctors?.length ?? 0) > 0 ? `${doctors!.length} connected` : "Not connected";

  // Orbital config: [label, accent, href, status, loading?]
  const orbits: { label: string; accent: string; href: string; status: string; loading?: boolean }[] = [
    { label: "Medical Team",      accent: "#7C8E6B", href: "/my-doctors", status: doctorsStatus     ?? "", loading: doctorsLoading },
    { label: "Specialists",       accent: "#E89A8B", href: "/specialist", status: specialistsStatus ?? "", loading: specialistsLoading },
    { label: "Learn",             accent: "#B07E2C", href: "/learn",      status: hasConditions ? "personalised" : "add conditions" },
    { label: "Community",         accent: "#D9542B", href: "/community",  status: communityStatus   ?? "", loading: postsLoading },
    { label: "Documents",         accent: "#A03A1C", href: "/documents",  status: `${documents.length} uploaded` },
    { label: "Clinical Trials",   accent: "#B07E2C", href: "/trials",     status: trialsStatus      ?? "", loading: trialsLoading },
    { label: "Benefits & Costs",  accent: "#7C8E6B", href: "/financial",  status: hasConditions ? "optimise costs" : "add conditions" },
  ];

  // Orbital positions matching the Garden design (% of container)
  // Bottom row expanded to 3 cards to accommodate the 7th orbital
  const positions = [
    { left: "20%", top: "20%" },
    { left: "80%", top: "20%" },
    { left: "12%", top: "58%" },
    { left: "88%", top: "58%" },
    { left: "18%", top: "92%" },
    { left: "50%", top: "92%" },
    { left: "82%", top: "92%" },
  ];

  // Center point (%) for bezier curve origins
  const cx = 50, cy = 56;

  const todayLabel = (() => {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toLowerCase();
  })();

  return (
    <>
      {/* Navigation drawer */}
      <NavDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname} />

      {/* Full-screen dashboard — header is hidden on /dashboard via Header.tsx */}
      <div
        className="flex flex-col"
        style={{ height: "100vh", background: "var(--background)" }}
      >
        {/* ── Slim header ───────────────────────────────────────────────── */}
        <div
          className="relative flex-shrink-0 flex items-center gap-4 px-7 py-4"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "var(--paper)", border: "1px solid var(--rule)", color: "var(--ink)" }}
            aria-label="Open navigation"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          {/* Wordmark */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <PoppyFlowerSVG size={22} />
            <span style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontStyle: "italic", fontWeight: 500, fontSize: 20, color: "var(--ink)", letterSpacing: "-0.01em" }}>poppy</span>
          </div>

          {/* Greeting — absolutely centered so it sits directly above the center circle */}
          <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)" }}>
            <div className="text-center">
              <p style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--poppy)", marginBottom: 2 }}>
                {todayLabel}
              </p>
              <h1 style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: 22, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>
                {getGreeting().toLowerCase()}{greetingName ? `, ${greetingName}.` : "."}
              </h1>
            </div>
          </div>

        </div>

        {/* ── Hub area ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0">

          {/* Desktop orbital layout */}
          <div className="hidden md:flex h-full items-center justify-center px-8 py-2">
            <div
              className="relative w-full"
              style={{ maxWidth: "860px", aspectRatio: "8 / 5.2" }}
            >
              {/* SVG connecting lines — dashed curved bezier paths */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
              >
                {positions.map((pos, i) => {
                  const x2 = parseFloat(pos.left);
                  const y2 = parseFloat(pos.top);
                  const dx = x2 - cx, dy = y2 - cy;
                  const qx = cx + dx * 0.55 + (i % 2 ? -3 : 3);
                  const qy = cy + dy * 0.55 + (i % 2 ? 4 : -4);
                  return (
                    <path
                      key={i}
                      d={`M ${cx} ${cy} Q ${qx} ${qy} ${x2} ${y2}`}
                      stroke="#D9542B" strokeWidth="0.18" fill="none"
                      strokeDasharray="0.6 0.9" opacity="0.4"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {/* Center circle */}
              <Link
                href="/overview"
                style={{
                  position: "absolute", left: "50%", top: `${cy}%`,
                  transform: "translate(-50%, -50%)",
                  width: "200px", height: "200px", borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 25%, #D9542B 0%, #A03A1C 70%)",
                  color: "#FBF6EE", textDecoration: "none",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                  boxShadow: "0 22px 50px -18px rgba(160,58,28,0.55), 0 0 0 12px rgba(217,84,43,0.07), 0 0 0 28px rgba(217,84,43,0.04)",
                  zIndex: 20, textAlign: "center", padding: 18, overflow: "hidden",
                  transition: "transform 0.28s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%, -50%) scale(1.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%, -50%) scale(1)"; }}
              >
                <span style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(251,246,238,0.7)", letterSpacing: "0.02em" }}>
                  {isCustodian ? "caring for" : "you are"}
                </span>
                <span style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontStyle: "italic", fontSize: 46, color: "#FBF6EE", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em", marginTop: 2 }}>
                  {circleFirstName.toLowerCase()}.
                </span>
                <span style={{ fontFamily: "'Newsreader', 'Lora', Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(251,246,238,0.65)", marginTop: 4 }}>
                  at the centre.
                </span>
                <div style={{ marginTop: 12, padding: "4px 12px", borderRadius: 999, border: "1px solid rgba(251,246,238,0.35)", fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 9.5, color: "rgba(251,246,238,0.85)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  read your story ›
                </div>
              </Link>

              {/* 6 Orbital Cards */}
              {orbits.map((o, i) => (
                <OrbitalCard
                  key={i}
                  left={positions[i].left}
                  top={positions[i].top}
                  href={o.href}
                  accent={o.accent}
                  label={o.label}
                  status={o.status}
                  loading={o.loading}
                />
              ))}
            </div>
          </div>

          {/* Mobile fallback grid */}
          <div className="md:hidden grid grid-cols-2 gap-3 p-5 overflow-y-auto">
            {orbits.map((o, i) => (
              <MobileCard key={i} href={o.href} accent={o.accent} label={o.label} status={o.status} />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
