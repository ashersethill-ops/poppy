"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import OnboardingModal from "../components/OnboardingModal";
import { usePoppyContext } from "../components/PoppyProvider";

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

// ── Resource card icons ───────────────────────────────────────────────────────

const MedicalIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CommunityIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ResearchIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const TrialsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const SpecialistsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const KnowledgeIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6" />
    <path d="M5 12H2M22 12h-3M7.05 7.05l-2.12-2.12M19.07 4.93l-2.12 2.12" />
    <path d="M12 17a5 5 0 100-10 5 5 0 000 10z" />
    <path d="M9 21h6M10 17v4M14 17v4" />
  </svg>
);

// ── Nav Drawer ────────────────────────────────────────────────────────────────

function NavDrawer({ isOpen, onClose, pathname }: { isOpen: boolean; onClose: () => void; pathname: string }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/15"
          onClick={onClose}
          style={{ backdropFilter: "blur(1px)" }}
        />
      )}

      {/* Drawer panel */}
      <div
        className="fixed top-0 left-0 h-full z-50 flex flex-col py-6 overflow-y-auto"
        style={{
          width: "232px",
          background: "var(--background)",
          borderRight: "1px solid var(--soft)",
          boxShadow: isOpen ? "4px 0 24px rgba(0,0,0,0.08)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Wordmark + close */}
        <div className="flex items-center justify-between px-5 mb-6">
          <span className="text-base font-semibold tracking-tight" style={{ color: "var(--primary)" }}>
            poppy
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
            style={{ color: "var(--primary)", opacity: 0.4 }}
            aria-label="Close menu"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-0.5 px-3 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={
                  active
                    ? { background: "var(--soft)", color: "var(--primary)" }
                    : { color: "var(--primary)", opacity: 0.5 }
                }
              >
                {item.icon}
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
  left, top, href, bg, iconColor, label, description, status, loading, icon,
}: {
  left: string; top: string;
  href: string; bg: string; iconColor: string;
  label: string; description: string; status: string;
  loading?: boolean; icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
        width: "152px",
      }}
    >
      <Link
        href={href}
        className="flex flex-col gap-2.5 rounded-2xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        style={{
          background: bg,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          textDecoration: "none",
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.65)", color: iconColor }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight" style={{ color: "var(--primary)" }}>{label}</p>
          <p className="text-xs leading-snug mt-0.5" style={{ color: "var(--primary)", opacity: 0.5 }}>{description}</p>
        </div>
        {loading ? (
          <div className="h-4 w-20 rounded-full animate-pulse" style={{ background: "rgba(0,0,0,0.07)" }} />
        ) : (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full self-start leading-tight"
            style={{ background: "rgba(255,255,255,0.75)", color: iconColor }}
          >
            {status}
          </span>
        )}
      </Link>
    </div>
  );
}

// ── MobileCard ────────────────────────────────────────────────────────────────

function MobileCard({ href, bg, iconColor, label, description, status, icon }: {
  href: string; bg: string; iconColor: string;
  label: string; description: string; status: string; icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl p-4 transition-all hover:-translate-y-0.5"
      style={{
        background: bg,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        textDecoration: "none",
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.65)", color: iconColor }}>
        {icon}
      </div>
      <p className="text-sm font-semibold leading-tight" style={{ color: "var(--primary)" }}>{label}</p>
      <p className="text-xs" style={{ color: "var(--primary)", opacity: 0.5 }}>{description}</p>
      <span className="text-xs font-medium px-2 py-0.5 rounded-full self-start" style={{ background: "rgba(255,255,255,0.75)", color: iconColor }}>{status}</span>
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

  // Story orbital card label
  const storyLabel = displayName ? `${displayName}'s Story` : "My Story";

  // Status badge text
  const trialsStatus      = trialsLoading      ? null : !hasConditions ? "Add conditions" : (trials?.length ?? 0) > 0 ? `${trials!.length} eligible` : "None found";
  const communityStatus   = postsLoading       ? null : !hasConditions ? "Add conditions" : (posts?.length ?? 0) > 0 ? `${posts!.length} discussions` : "Explore";
  const specialistsStatus = specialistsLoading ? null : !hasConditions ? "Add conditions" : (() => { const acc = specialists?.filter((s) => s.acceptingPatients).length ?? 0; return acc > 0 ? `${acc} accepting` : `${specialists?.length ?? 0} found`; })();
  const doctorsStatus     = doctorsLoading     ? null : (doctors?.length ?? 0) > 0 ? `${doctors!.length} connected` : "Not connected";

  return (
    <>
      <OnboardingModal userIsLoggedIn={isLoggedIn} />

      {/* Navigation drawer */}
      <NavDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname} />

      {/* Full-screen dashboard — header is hidden on /dashboard via Header.tsx */}
      <div
        className="flex flex-col"
        style={{ height: "100vh", background: "var(--background)" }}
      >

        {/* ── Greeting bar ──────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-start gap-4 px-8 pt-7 pb-3">
          {/* Hamburger button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 transition-opacity hover:opacity-70"
            style={{ background: "var(--soft)", color: "var(--primary)" }}
            aria-label="Open navigation"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div>
            <p
              className="text-xs font-medium tracking-widest uppercase mb-1.5"
              style={{ color: "var(--accent)", opacity: 0.65 }}
            >
              Where your care comes together
            </p>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--primary)" }}
            >
              {getGreeting()}{greetingName ? `, ${greetingName}` : ""}
            </h1>
            <p className="text-sm text-stone-400 mt-1">
              {isCustodian
                ? `${displayName ?? "Your patient"}'s health journey — you are at their side.`
                : hasConditions
                  ? "You are at the centre of your care."
                  : "Add your conditions to personalise your hub."}
            </p>
          </div>
        </div>

        {/* ── Hub area ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0">

          {/* Desktop orbital layout */}
          <div className="hidden md:flex h-full items-center justify-center px-8 py-2">
            <div
              className="relative w-full"
              style={{ maxWidth: "820px", aspectRatio: "8 / 5" }}
            >
              {/* SVG connecting lines */}
              <svg
                viewBox="0 0 820 513"
                preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
              >
                <line x1="410" y1="241" x2="123" y2="241" stroke="#d4c4b0" strokeWidth="0.5" />
                <line x1="410" y1="241" x2="697" y2="241" stroke="#d4c4b0" strokeWidth="0.5" />
                <line x1="410" y1="241" x2="180" y2="72"  stroke="#d4c4b0" strokeWidth="0.5" />
                <line x1="410" y1="241" x2="640" y2="72"  stroke="#d4c4b0" strokeWidth="0.5" />
                <line x1="410" y1="241" x2="180" y2="416" stroke="#d4c4b0" strokeWidth="0.5" />
                <line x1="410" y1="241" x2="640" y2="416" stroke="#d4c4b0" strokeWidth="0.5" />
              </svg>

              {/* Center circle */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "47%",
                  transform: "translate(-50%, -50%)",
                  width: "136px",
                  height: "136px",
                  borderRadius: "50%",
                  background: "var(--primary)",
                  boxShadow: "0 8px 32px rgba(124,111,94,0.28), 0 0 0 10px rgba(124,111,94,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
                  textAlign: "center",
                  padding: "12px",
                }}
              >
                <span style={{ color: "white", fontSize: "27px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.5px" }}>
                  {circleInitials}
                </span>
                <span style={{ color: "rgba(255,255,255,0.82)", fontSize: "11px", fontWeight: 500, marginTop: "5px" }}>
                  {circleFirstName}
                </span>
                <span style={{ color: "rgba(255,255,255,0.48)", fontSize: "9.5px", fontStyle: "italic", marginTop: "3px", lineHeight: 1.4, maxWidth: "108px" }}>
                  {isCustodian ? "at the centre" : "you are the centre"}
                </span>
              </div>

              {/* 6 Orbital Cards */}
              <OrbitalCard left="15%" top="47%" href="/my-doctors" bg="#f0fdf4" iconColor="#15803d" label="Medical Team"       description="Your care providers"        status={doctorsStatus ?? ""}     loading={doctorsLoading}     icon={<MedicalIcon />} />
              <OrbitalCard left="85%" top="47%" href="/community"  bg="#fff7ed" iconColor="#ea580c" label="Community"          description="Real patient voices"        status={communityStatus ?? ""}   loading={postsLoading}       icon={<CommunityIcon />} />
              <OrbitalCard left="22%" top="14%" href="/learn"      bg="#fdf4ff" iconColor="#7c3aed" label="Learn"              description="Condition education"        status={hasConditions ? "Personalised" : "Add conditions"}                          icon={<ResearchIcon />} />
              <OrbitalCard left="78%" top="14%" href="/trials"     bg="#fffbeb" iconColor="#d97706" label="Clinical Trials"    description="Trials you may qualify for" status={trialsStatus ?? ""}      loading={trialsLoading}      icon={<TrialsIcon />} />
              <OrbitalCard left="22%" top="81%" href="/specialist" bg="#fff1f2" iconColor="#e11d48" label="Expert Specialists" description="Matched to your profile"    status={specialistsStatus ?? ""} loading={specialistsLoading} icon={<SpecialistsIcon />} />
              <OrbitalCard left="78%" top="81%" href="/overview"   bg="#fefce8" iconColor="#ca8a04" label={storyLabel}        description="Your health journey"        status="View story"                                                                 icon={<KnowledgeIcon />} />
            </div>
          </div>

          {/* Mobile fallback grid */}
          <div className="md:hidden grid grid-cols-2 gap-3 p-5 overflow-y-auto">
            <MobileCard href="/my-doctors" bg="#f0fdf4" iconColor="#15803d" label="Medical Team"       description="Your care providers"        status={doctorsStatus ?? "Loading…"}     icon={<MedicalIcon />} />
            <MobileCard href="/community"  bg="#fff7ed" iconColor="#ea580c" label="Community"          description="Real patient voices"        status={communityStatus ?? "Loading…"}   icon={<CommunityIcon />} />
            <MobileCard href="/learn"      bg="#fdf4ff" iconColor="#7c3aed" label="Learn"              description="Condition education"        status={hasConditions ? "Personalised" : "Add conditions"} icon={<ResearchIcon />} />
            <MobileCard href="/trials"     bg="#fffbeb" iconColor="#d97706" label="Clinical Trials"    description="Trials you may qualify for" status={trialsStatus ?? "Loading…"}      icon={<TrialsIcon />} />
            <MobileCard href="/specialist" bg="#fff1f2" iconColor="#e11d48" label="Expert Specialists" description="Matched to your profile"    status={specialistsStatus ?? "Loading…"} icon={<SpecialistsIcon />} />
            <MobileCard href="/overview"   bg="#fefce8" iconColor="#ca8a04" label={storyLabel}        description="Your health journey"        status="View story"                      icon={<KnowledgeIcon />} />
          </div>

        </div>


      </div>
    </>
  );
}
