"use client";

import { useEffect, useRef, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";
import AILoadingMessage from "../components/AILoadingMessage";
import UpdateButton from "../components/UpdateButton";
import GeneralContentBanner from "../components/GeneralContentBanner";

const COMMUNITY_MESSAGES = [
  "Searching patient communities for your conditions…",
  "Scanning Reddit and health forums…",
  "Finding recent discussions relevant to you…",
  "Discovering support groups that match your needs…",
  "Looking for people with similar experiences…",
  "Checking the most active communities right now…",
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Community = {
  platform: "Reddit" | "Facebook" | "HealthUnlocked" | "Inspire" | "PatientsLikeMe" | "X" | "Other";
  name: string;
  condition: string;
  description: string;
  members?: string;
  url: string;
  tone: string;
};

type SocialPost = {
  platform: "Reddit" | "Community";
  subreddit?: string;
  author: string;
  title: string;
  excerpt: string;
  score?: number;
  numComments?: number;
  url?: string;
  condition: string;
  timeAgo?: string;
};

type SearchSource = {
  title: string;
  subreddit: string;
  url: string;
  score: number;
  numComments: number;
};

type LocalCommunity = {
  name: string;
  type: "charity" | "nhs" | "helpline" | "meetup" | "facebook";
  condition: string;
  description: string;
  url: string;
  isInPerson?: boolean;
};

// ── Platform config ────────────────────────────────────────────────────────────

const platformConfig: Record<string, { color: string; textColor: string; icon: React.ReactNode }> = {
  Reddit: {
    color: "#FF4500", textColor: "#fff",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>,
  },
  Facebook: {
    color: "#1877F2", textColor: "#fff",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  HealthUnlocked: {
    color: "#00897b", textColor: "#fff",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
  Inspire: {
    color: "#005baa", textColor: "#fff",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  PatientsLikeMe: {
    color: "#00b5ad", textColor: "#fff",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  X: {
    color: "#000", textColor: "#fff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.264 5.633 5.9-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  Other: {
    color: "var(--accent)", textColor: "#fff",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
};

// ── Skeletons ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 animate-pulse flex-shrink-0 w-80" style={{ background: "var(--background)", boxShadow: "0 2px 12px 0 rgba(0,0,0,0.06)" }}>
      <div className="flex gap-2">
        <div className="h-3 rounded-full w-16" style={{ background: "var(--soft)" }} />
        <div className="h-3 rounded-full w-24" style={{ background: "var(--soft)" }} />
      </div>
      <div className="h-4 rounded-full w-5/6" style={{ background: "var(--soft)" }} />
      <div className="h-3 rounded-full w-full" style={{ background: "var(--soft)" }} />
      <div className="h-3 rounded-full w-4/5" style={{ background: "var(--soft)" }} />
    </div>
  );
}

function TileSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden animate-pulse" style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}>
      <div className="h-16" style={{ background: "var(--soft)" }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 rounded-full w-2/3" style={{ background: "var(--soft)" }} />
        <div className="h-3 rounded-full w-1/3" style={{ background: "var(--soft)" }} />
        <div className="h-3 rounded-full w-full" style={{ background: "var(--soft)" }} />
        <div className="h-3 rounded-full w-4/5" style={{ background: "var(--soft)" }} />
        <div className="h-9 rounded-xl w-full mt-2" style={{ background: "var(--soft)" }} />
      </div>
    </div>
  );
}

// ── Social post card ──────────────────────────────────────────────────────────

function PostCard({ post }: { post: SocialPost }) {
  const isReddit = post.platform === "Reddit";
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 flex-shrink-0 w-80"
      style={{ background: "var(--background)", boxShadow: "0 2px 12px 0 rgba(0,0,0,0.07)" }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {isReddit ? (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#fff0ec", color: "#FF4500" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
            r/{post.subreddit}
          </span>
        ) : (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--soft)", color: "var(--accent)" }}>
            Patient Community
          </span>
        )}
        <span className="text-xs text-stone-400">u/{post.author}</span>
        {post.timeAgo && <span className="text-xs text-stone-300">· {post.timeAgo}</span>}
      </div>

      {/* Quote mark + title */}
      <div>
        <svg className="mb-1 opacity-20" width="20" height="14" viewBox="0 0 24 16" fill="var(--accent)">
          <path d="M0 16V9.5C0 5.5 2.5 2.2 7.5 0L9 2.5C6.2 3.8 4.7 5.8 4.5 8.5H8V16H0zm13 0V9.5C13 5.5 15.5 2.2 20.5 0L22 2.5C19.2 3.8 17.7 5.8 17.5 8.5H21V16H13z"/>
        </svg>
        <p className="text-sm font-medium leading-snug" style={{ color: "var(--primary)" }}>
          {post.title}
        </p>
      </div>

      {/* Excerpt */}
      {post.excerpt && post.excerpt !== post.title && (
        <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-3 text-xs text-stone-400">
          {post.score !== undefined && (
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              {post.score > 999 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
            </span>
          )}
          {post.numComments !== undefined && (
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {post.numComments}
            </span>
          )}
        </div>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
            Read more →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Community tile ─────────────────────────────────────────────────────────────

function CommunityTile({ community }: { community: Community }) {
  const config = platformConfig[community.platform] ?? platformConfig.Other;
  return (
    <div className="rounded-3xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1" style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.07)" }}>
      <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ background: config.color }}>
        <div className="flex items-center gap-2.5" style={{ color: config.textColor }}>
          {config.icon}
          <span className="text-sm font-semibold tracking-wide" style={{ color: config.textColor }}>{community.platform}</span>
        </div>
        {community.members && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: config.textColor }}>
            {community.members}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <p className="font-semibold text-base leading-snug" style={{ color: "var(--primary)" }}>{community.name}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: "var(--soft)", color: "var(--accent)" }}>{community.condition}</span>
          <span className="text-xs text-stone-400">{community.tone}</span>
        </div>
        <p className="text-sm text-stone-500 leading-relaxed flex-1">{community.description}</p>
        <a href={community.url} target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-85"
          style={{ background: config.color }}>
          Join Community
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
        </a>
      </div>
    </div>
  );
}

// ── Ask the community ─────────────────────────────────────────────────────────

function AskSection({ conditions }: { conditions: string[] }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: SearchSource[]; usedRealData: boolean } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/community-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, conditions }),
      });
      const data = await res.json();
      if (data.error) { setError("Could not find community insights. Please try again."); }
      else { setResult(data); }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl p-6 flex flex-col gap-5" style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--soft)", color: "var(--accent)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <div>
          <h2 className="font-semibold text-base" style={{ color: "var(--primary)" }}>Ask the Community</h2>
          <p className="text-xs text-stone-400">Search patient communities for real experiences and insights</p>
        </div>
      </div>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`e.g. "What helps with fatigue?" or "Side effects of Metformin?"`}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none disabled:opacity-50"
          style={{ background: "var(--soft)", color: "var(--foreground)", border: "1px solid transparent" }}
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-5 py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Searching…
            </span>
          ) : "Search"}
        </button>
      </form>

      {/* Suggested prompts */}
      {!result && !loading && (
        <div className="flex flex-wrap gap-2">
          {[
            "What do others wish they'd known at diagnosis?",
            "How do people manage flare-ups?",
            "Which medications have helped most?",
            "Tips for talking to family about my condition",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => { setQuery(prompt); inputRef.current?.focus(); }}
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
              style={{ background: "var(--soft)", color: "var(--primary)" }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-4 rounded-full w-3/4" style={{ background: "var(--soft)" }} />
          <div className="h-4 rounded-full w-full" style={{ background: "var(--soft)" }} />
          <div className="h-4 rounded-full w-5/6" style={{ background: "var(--soft)" }} />
          <div className="h-4 rounded-full w-full" style={{ background: "var(--soft)" }} />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-5">
          {/* Source badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={result.usedRealData ? { background: "#fff0ec", color: "#FF4500" } : { background: "var(--soft)", color: "var(--accent)" }}>
              {result.usedRealData ? "Based on real community discussions" : "Based on community knowledge"}
            </span>
          </div>

          {/* Answer */}
          <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap rounded-2xl p-5" style={{ background: "var(--soft)" }}>
            {result.answer}
          </div>

          {/* Real sources */}
          {result.usedRealData && result.sources.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Community threads</p>
              {result.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-xl px-4 py-3 transition-opacity hover:opacity-75"
                  style={{ background: "var(--background)", border: "1px solid var(--soft)" }}>
                  <span className="text-xs font-medium mt-0.5 flex-shrink-0" style={{ color: "#FF4500" }}>r/{s.subreddit}</span>
                  <span className="text-xs text-stone-600 flex-1 leading-snug">{s.title}</span>
                  <span className="text-xs text-stone-300 flex-shrink-0 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    {s.score > 999 ? `${(s.score / 1000).toFixed(1)}k` : s.score}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Reset */}
          <button onClick={() => { setResult(null); setQuery(""); }} className="text-xs text-stone-400 hover:underline self-start">
            ← Ask another question
          </button>
        </div>
      )}
    </div>
  );
}

// ── Local community card ──────────────────────────────────────────────────────

const LOCAL_TYPE_CONFIG = {
  charity:  { label: "Charity",  bg: "#f5f3ff", color: "#7c3aed" },
  nhs:      { label: "NHS",      bg: "#eff6ff", color: "#1d4ed8" },
  helpline: { label: "Helpline", bg: "#f0fdf4", color: "#15803d" },
  meetup:   { label: "Meetup",   bg: "#fff1f2", color: "#e11d48" },
  facebook: { label: "Facebook", bg: "#eff6ff", color: "#1877F2" },
};

function LocalCommunityCard({ community }: { community: LocalCommunity }) {
  const tc = LOCAL_TYPE_CONFIG[community.type] ?? LOCAL_TYPE_CONFIG.charity;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "var(--background)", boxShadow: "0 2px 12px 0 rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: tc.bg, color: tc.color }}
          >
            {tc.label}
          </span>
          {community.isInPerson && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: "#f0fdf4", color: "#15803d" }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              In person
            </span>
          )}
        </div>
        <span className="text-xs text-stone-400 flex-shrink-0 text-right leading-tight" style={{ maxWidth: "110px" }}>
          {community.condition}
        </span>
      </div>
      <p className="font-semibold text-sm leading-snug" style={{ color: "var(--primary)" }}>{community.name}</p>
      <p className="text-xs text-stone-500 leading-relaxed flex-1">{community.description}</p>
      <a
        href={community.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-semibold mt-auto transition-opacity hover:opacity-75"
        style={{ color: "var(--accent)" }}
      >
        Find local support
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
        </svg>
      </a>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, setPageContext, credits, setCredits } = usePoppyContext();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [communitiesUpdating, setCommunitiesUpdating] = useState(false);
  const [postsUpdating, setPostsUpdating] = useState(false);
  const [communitiesCachedAt, setCommunitiesCachedAt] = useState<string | null>(null);
  const [postsCachedAt, setPostsCachedAt] = useState<string | null>(null);
  const [postsSource, setPostsSource] = useState<"reddit" | "generated" | null>(null);
  const [error, setError] = useState("");

  // Local communities
  const [location, setLocation] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [localCommunities, setLocalCommunities] = useState<LocalCommunity[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localUpdating, setLocalUpdating] = useState(false);
  const [localCachedAt, setLocalCachedAt] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const hasContext = conditions.length > 0 || documents.length > 0;

  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey = documents.map((d) => d.id).sort().join("|");

  // Load location from profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile?.location) {
          setLocation(profile.location);
          setLocationInput(profile.location);
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, []);

  // Load local communities when location + conditions are available
  useEffect(() => {
    if (!location || !conditionsLoaded || conditions.length === 0) return;
    setLocalLoading(true);
    setLocalError("");
    fetch("/api/local-communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions, location }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.communities) {
          setLocalCommunities(data.communities);
          setLocalCachedAt(data.cachedAt ?? null);
          if (data.remainingCredits !== undefined) setCredits(data.remainingCredits);
        } else if (data.error) {
          setLocalError(data.error);
        }
      })
      .catch(() => setLocalError("Could not load local communities."))
      .finally(() => setLocalLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, conditionsKey, conditionsLoaded]);

  // Load community tiles
  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded) return;
    if (!hasContext) { setCommunitiesLoading(false); return; }

    fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.communities) {
          setCommunities(data.communities);
          setCommunitiesCachedAt(data.cachedAt ?? null);
          setPageContext(`The user is on the Community page. Communities: ${data.communities.map((c: Community) => `${c.name} on ${c.platform}`).join("; ")}.`);
        } else { setError("Could not load communities."); }
      })
      .catch(() => setError("Could not load communities."))
      .finally(() => setCommunitiesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, conditionsLoaded, documentsLoaded]);

  // Load social posts
  useEffect(() => {
    if (!conditionsLoaded || conditions.length === 0) return;

    fetch("/api/community-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.posts) { setPosts(data.posts); setPostsSource(data.source); setPostsCachedAt(data.cachedAt ?? null); }
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, conditionsLoaded]);

  async function updateCommunities() {
    if (!hasContext || communitiesUpdating) return;
    setCommunitiesUpdating(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id), forceRefresh: true }),
      });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.communities) {
        setCommunities(data.communities);
        setCommunitiesCachedAt(data.cachedAt ?? null);
        if (data.remainingCredits !== undefined) setCredits(data.remainingCredits);
      }
    } catch { setError("Could not refresh communities."); }
    finally { setCommunitiesUpdating(false); }
  }

  async function updatePosts() {
    if (conditions.length === 0 || postsUpdating) return;
    setPostsUpdating(true);
    try {
      const res = await fetch("/api/community-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, forceRefresh: true }),
      });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setPostsSource(data.source);
        setPostsCachedAt(data.cachedAt ?? null);
        if (data.remainingCredits !== undefined) setCredits(data.remainingCredits);
      }
    } catch { setError("Could not refresh posts."); }
    finally { setPostsUpdating(false); }
  }

  async function handleSetLocation(e: React.FormEvent) {
    e.preventDefault();
    const loc = locationInput.trim();
    if (!loc) return;
    setLocation(loc);
    // Best-effort save to profile so it persists across sessions
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc }),
      });
    } catch {}
  }

  async function updateLocalCommunities() {
    if (!location || conditions.length === 0 || localUpdating) return;
    setLocalUpdating(true);
    setLocalError("");
    try {
      const res = await fetch("/api/local-communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, location, forceRefresh: true }),
      });
      if (res.status === 402) { setLocalError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.communities) {
        setLocalCommunities(data.communities);
        setLocalCachedAt(data.cachedAt ?? null);
        if (data.remainingCredits !== undefined) setCredits(data.remainingCredits);
      }
    } catch { setLocalError("Could not refresh local communities."); }
    finally { setLocalUpdating(false); }
  }

  if (!communitiesLoading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: "var(--soft)", color: "var(--accent)" }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3" style={{ color: "var(--primary)" }}>Find Your Community</h1>
        <p className="text-stone-500 leading-relaxed">Add your conditions in your profile and Poppy will find patient communities and real discussions relevant to you.</p>
        <a href="/profile" className="inline-block mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: "var(--accent)" }}>Go to Profile</a>
      </div>
    );
  }

  const platforms = [...new Set(communities.map((c) => c.platform))];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
      <GeneralContentBanner />

      {/* AI loading message */}
      {(communitiesLoading || postsLoading) && (
        <AILoadingMessage messages={COMMUNITY_MESSAGES} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: "var(--primary)" }}>Patient Communities</h1>
        <p className="text-stone-500 text-sm">Connect with people who truly understand — matched to: {conditions.join(", ")}</p>
        {!communitiesLoading && platforms.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {platforms.map((p) => {
              const cfg = platformConfig[p] ?? platformConfig.Other;
              return (
                <span key={p} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full text-white" style={{ background: cfg.color }}>
                  {cfg.icon}{p}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Community voices (social posts) ── */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-lg" style={{ color: "var(--primary)" }}>What patients are saying</h2>
          {postsSource === "reddit" && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium" style={{ background: "#fff0ec", color: "#FF4500" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
              Live from Reddit
            </span>
          )}
          {postsSource === "generated" && (
            <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: "var(--soft)", color: "var(--primary)" }}>
              Representative community voices
            </span>
          )}
          {!postsLoading && conditions.length > 0 && (
            <UpdateButton onClick={updatePosts} loading={postsUpdating} credits={credits} cachedAt={postsCachedAt} />
          )}
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {postsLoading
            ? Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
            : posts.map((p, i) => <PostCard key={i} post={p} />)
          }
        </div>
      </div>

      {/* ── Ask the community Q&A ── */}
      {conditions.length > 0 && <AskSection conditions={conditions} />}

      {/* ── Communities Near You ── */}
      {conditions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-lg" style={{ color: "var(--primary)" }}>
                Communities Near You
              </h2>
              {location && (
                <p className="text-sm text-stone-400 mt-0.5">Local support in {location}</p>
              )}
            </div>
            {location && !localLoading && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setLocation(""); setLocationInput(""); setLocalCommunities([]); }}
                  className="text-xs text-stone-400 hover:underline"
                >
                  Change location
                </button>
                <UpdateButton onClick={updateLocalCommunities} loading={localUpdating} credits={credits} cachedAt={localCachedAt} />
              </div>
            )}
          </div>

          {!location && profileLoaded ? (
            /* Location input prompt */
            <div className="rounded-2xl p-6" style={{ background: "var(--soft)" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--background)", color: "var(--accent)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>
                  Find in-person support near you
                </p>
              </div>
              <p className="text-sm text-stone-500 mb-4">
                Enter your city or region to find local patient support groups, charity branches, and helplines close to you.
              </p>
              <form onSubmit={handleSetLocation} className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. London, Manchester, New York"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--soft)" }}
                />
                <button
                  type="submit"
                  disabled={!locationInput.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent)" }}
                >
                  Find Groups
                </button>
              </form>
            </div>
          ) : location ? (
            <div>
              {localError && <p className="text-red-500 text-sm mb-4">{localError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {localLoading
                  ? Array.from({ length: 6 }).map((_, i) => <TileSkeleton key={i} />)
                  : localCommunities.map((c, i) => <LocalCommunityCard key={i} community={c} />)
                }
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Community tiles ── */}
      <div>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="font-semibold text-lg" style={{ color: "var(--primary)" }}>Join a Community</h2>
          {!communitiesLoading && hasContext && (
            <UpdateButton onClick={updateCommunities} loading={communitiesUpdating} credits={credits} cachedAt={communitiesCachedAt} />
          )}
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {communitiesLoading
            ? Array.from({ length: 9 }).map((_, i) => <TileSkeleton key={i} />)
            : communities.map((c, i) => <CommunityTile key={i} community={c} />)
          }
        </div>
      </div>

      {!communitiesLoading && communities.length > 0 && (
        <p className="text-center text-xs text-stone-400">
          Links open in the respective platform. Poppy does not moderate these communities.
        </p>
      )}
    </div>
  );
}
