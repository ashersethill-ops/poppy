"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OnboardingModal from "../components/OnboardingModal";
import { usePoppyContext } from "../components/PoppyProvider";

// ── Types ──────────────────────────────────────────────────────────────────────

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
  country: string;
  email: string;
  gender: "male" | "female";
  portraitIndex: number;
  acceptingPatients: boolean;
};

type Doctor = {
  id: string;
  doctor_email: string;
  status: string;
  granted_at: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const eligibilityColors = {
  eligible:        { bg: "#dcfce7", text: "#15803d", label: "Eligible" },
  likely_eligible: { bg: "#fef9c3", text: "#a16207", label: "Likely eligible" },
  not_eligible:    { bg: "#fee2e2", text: "#b91c1c", label: "Not eligible" },
};

const trialStatusColors: Record<string, string> = {
  Recruiting: "#15803d",
  Active:     "#1d4ed8",
  Completed:  "#9ca3af",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function TileSkeleton() {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-5 animate-pulse"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "var(--soft)" }} />
        <div className="h-4 rounded-full w-36" style={{ background: "var(--soft)" }} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-20 rounded-2xl" style={{ background: "var(--soft)" }} />
        <div className="h-20 rounded-2xl" style={{ background: "var(--soft)" }} />
      </div>
      <div className="h-3 rounded-full w-24" style={{ background: "var(--soft)" }} />
    </div>
  );
}

function EmptyPrompt({ text, href, cta = "Update profile" }: { text: string; href: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-6 flex-1">
      <p className="text-sm text-stone-400 leading-relaxed max-w-[220px]">{text}</p>
      <Link
        href={href}
        className="text-xs font-medium px-4 py-2 rounded-xl transition-opacity hover:opacity-75"
        style={{ background: "var(--soft)", color: "var(--accent)" }}
      >
        {cta}
      </Link>
    </div>
  );
}

function TileWrapper({
  iconBg, iconColor, icon, label, href, linkLabel, children,
}: {
  iconBg: string; iconColor: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-5"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <p className="font-semibold text-sm" style={{ color: "var(--primary)" }}>{label}</p>
      </div>

      <div className="flex flex-col gap-3 flex-1">{children}</div>

      <Link
        href={href}
        className="text-xs font-medium flex items-center gap-1 self-start transition-all hover:gap-2"
        style={{ color: "var(--accent)" }}
      >
        {linkLabel}
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { conditions, conditionsLoaded, documents } = usePoppyContext();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  const [trials,       setTrials]       = useState<Trial[] | null>(null);
  const [posts,        setPosts]        = useState<Post[]  | null>(null);
  const [specialists,  setSpecialists]  = useState<Specialist[] | null>(null);
  const [doctors,      setDoctors]      = useState<Doctor[] | null>(null);

  const [trialsLoading,      setTrialsLoading]      = useState(true);
  const [postsLoading,       setPostsLoading]       = useState(true);
  const [specialistsLoading, setSpecialistsLoading] = useState(true);
  const [doctorsLoading,     setDoctorsLoading]     = useState(true);

  // Auth check + doctors (fast — DB query)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name;
      setFirstName(name ? name.split(" ")[0] : null);
    });

    fetch("/api/my-doctors")
      .then((r) => r.json())
      .then(({ doctors: d }) =>
        setDoctors((d ?? []).filter((doc: Doctor) => doc.status === "active"))
      )
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, []);

  // Condition-based tiles — fetched in parallel once conditions are ready
  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey  = documents.map((d) => d.id).sort().join("|");

  useEffect(() => {
    if (!conditionsLoaded) return;

    if (conditions.length === 0) {
      setTrials([]);
      setPosts([]);
      setSpecialists([]);
      setTrialsLoading(false);
      setPostsLoading(false);
      setSpecialistsLoading(false);
      return;
    }

    const headers = { "Content-Type": "application/json" };
    const docIds  = documents.map((d) => d.id);

    // Trials
    setTrialsLoading(true);
    fetch("/api/trials", {
      method: "POST", headers,
      body: JSON.stringify({ conditions }),
    })
      .then((r) => r.json())
      .then((d) =>
        setTrials(
          (d.trials ?? [])
            .filter((t: Trial) => t.eligibility_match !== "not_eligible")
            .sort((a: Trial, b: Trial) => {
              const rank = { eligible: 0, likely_eligible: 1, not_eligible: 2 };
              return rank[a.eligibility_match] - rank[b.eligibility_match];
            })
            .slice(0, 2)
        )
      )
      .catch(() => setTrials([]))
      .finally(() => setTrialsLoading(false));

    // Community posts
    setPostsLoading(true);
    fetch("/api/community-posts", {
      method: "POST", headers,
      body: JSON.stringify({ conditions }),
    })
      .then((r) => r.json())
      .then((d) => setPosts((d.posts ?? []).slice(0, 2)))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));

    // Specialists
    setSpecialistsLoading(true);
    fetch("/api/specialists", {
      method: "POST", headers,
      body: JSON.stringify({ conditions, documentIds: docIds }),
    })
      .then((r) => r.json())
      .then((d) =>
        setSpecialists(
          (d.specialists ?? [])
            .sort((a: Specialist, b: Specialist) =>
              Number(b.acceptingPatients) - Number(a.acceptingPatients)
            )
            .slice(0, 2)
        )
      )
      .catch(() => setSpecialists([]))
      .finally(() => setSpecialistsLoading(false));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, conditionsLoaded]);

  const hasConditions = conditions.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <OnboardingModal userIsLoggedIn={isLoggedIn} />

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--primary)" }}>
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-stone-500 text-sm mt-1.5">
          {hasConditions
            ? `Here's what's personalised for ${conditions.join(", ")}.`
            : "Add your conditions in your profile to personalise your dashboard."
          }
        </p>
      </div>

      {/* 2×2 tile grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Clinical Trials ── */}
        {trialsLoading ? <TileSkeleton /> : (
          <TileWrapper
            iconBg="#ede9fe" iconColor="#6d28d9"
            icon={
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            label="Clinical Trials"
            href="/trials"
            linkLabel="View all trials"
          >
            {!hasConditions ? (
              <EmptyPrompt text="Add your conditions to find trials you may be eligible for." href="/profile" />
            ) : trials?.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No eligible trials found for your conditions right now.</p>
            ) : trials?.map((trial, i) => {
              const ec = eligibilityColors[trial.eligibility_match] ?? eligibilityColors.likely_eligible;
              return (
                <div key={i} className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: "var(--soft)" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "var(--background)", color: "#6d28d9" }}
                    >
                      {trial.phase}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: trialStatusColors[trial.status] ?? "#9ca3af" }}
                    >
                      {trial.status}
                    </span>
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: ec.bg, color: ec.text }}
                    >
                      {ec.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug" style={{ color: "var(--primary)" }}>
                    {trial.title}
                  </p>
                  {trial.location && (
                    <p className="text-xs text-stone-400 flex items-center gap-1">
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {trial.location}
                    </p>
                  )}
                </div>
              );
            })}
          </TileWrapper>
        )}

        {/* ── Community Voices ── */}
        {postsLoading ? <TileSkeleton /> : (
          <TileWrapper
            iconBg="#fef3c7" iconColor="#d97706"
            icon={
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            label="From the Community"
            href="/community"
            linkLabel="Join communities"
          >
            {!hasConditions ? (
              <EmptyPrompt text="Add your conditions to see what patients like you are discussing." href="/profile" />
            ) : posts?.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No community posts found right now.</p>
            ) : posts?.map((post, i) => (
              <div key={i} className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "var(--soft)" }}>
                <div className="flex items-center gap-2 text-xs text-stone-400 flex-wrap">
                  {post.subreddit ? (
                    <span className="font-medium" style={{ color: "#FF4500" }}>r/{post.subreddit}</span>
                  ) : (
                    <span className="font-medium" style={{ color: "var(--accent)" }}>Community</span>
                  )}
                  <span>·</span>
                  <span>u/{post.author}</span>
                  {post.timeAgo && <><span>·</span><span>{post.timeAgo}</span></>}
                </div>
                <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: "var(--primary)" }}>
                  {post.title}
                </p>
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:underline self-start"
                    style={{ color: "var(--accent)" }}
                  >
                    Read thread →
                  </a>
                )}
              </div>
            ))}
          </TileWrapper>
        )}

        {/* ── Recommended Specialists ── */}
        {specialistsLoading ? <TileSkeleton /> : (
          <TileWrapper
            iconBg="#dbeafe" iconColor="#1d4ed8"
            icon={
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Recommended Specialists"
            href="/specialist"
            linkLabel="View all specialists"
          >
            {!hasConditions ? (
              <EmptyPrompt text="Add your conditions to find specialists matched to your needs." href="/profile" />
            ) : specialists?.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No specialists found for your conditions.</p>
            ) : specialists?.map((s, i) => {
              const portraitUrl = `https://randomuser.me/api/portraits/${s.gender === "female" ? "women" : "men"}/${s.portraitIndex}.jpg`;
              return (
                <div key={i} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--soft)" }}>
                  <img
                    src={portraitUrl}
                    alt={s.name}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{s.name}</p>
                    <p className="text-xs text-stone-500">{s.specialty}</p>
                    <p className="text-xs text-stone-400 truncate">{s.hospital}, {s.city}</p>
                    {s.acceptingPatients && (
                      <span className="text-xs font-medium flex items-center gap-1 mt-0.5" style={{ color: "#15803d" }}>
                        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Accepting patients
                      </span>
                    )}
                  </div>
                  <a
                    href={`mailto:${s.email}`}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex-shrink-0 transition-opacity hover:opacity-70"
                    style={{ background: "#dbeafe", color: "#1d4ed8" }}
                  >
                    Contact
                  </a>
                </div>
              );
            })}
          </TileWrapper>
        )}

        {/* ── My Care Team (Doctors) ── */}
        {doctorsLoading ? <TileSkeleton /> : (
          <TileWrapper
            iconBg="#ccfbf1" iconColor="#0f766e"
            icon={
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
            label="My Care Team"
            href="/my-doctors"
            linkLabel="Manage care team"
          >
            {doctors?.length === 0 ? (
              <EmptyPrompt
                text="Add your doctor's email to share your health records and stay connected."
                href="/my-doctors"
                cta="Add a doctor"
              />
            ) : doctors?.slice(0, 3).map((doc, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-2xl p-4" style={{ background: "var(--soft)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white"
                    style={{ background: "#0f766e" }}
                  >
                    {doc.doctor_email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--primary)" }}>
                      {doc.doctor_email}
                    </p>
                    <p className="text-xs text-stone-400">
                      Connected {new Date(doc.granted_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:${doc.doctor_email}`}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-opacity hover:opacity-70"
                  style={{ background: "#ccfbf1", color: "#0f766e" }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Message
                </a>
              </div>
            ))}
          </TileWrapper>
        )}

      </div>
    </div>
  );
}
