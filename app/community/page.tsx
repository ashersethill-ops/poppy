"use client";

import { useEffect, useRef, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";
import AILoadingMessage from "../components/AILoadingMessage";
import UpdateButton from "../components/UpdateButton";
import GeneralContentBanner from "../components/GeneralContentBanner";
import LocationAutocomplete from "../components/LocationAutocomplete";

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

// ── Garden atoms ──────────────────────────────────────────────────────────────

const Overline = ({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) => (
  <span style={{
    fontFamily: "'Geist Mono', ui-monospace, monospace",
    fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
    color: color ?? "var(--ink-faded)", ...style,
  }}>
    {children}
  </span>
);

const GardenPaper = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div style={{ background: "var(--paper)", borderRadius: 18, border: "1px solid var(--rule)", ...style }}>
    {children}
  </div>
);

const Portrait = ({
  initials,
  color,
  size = 42,
}: {
  initials: string;
  color: string;
  size?: number;
}) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: `radial-gradient(circle at 30% 25%, ${color}55, ${color}22)`,
    border: "1px solid var(--rule)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
    fontSize: size * 0.40, color: "var(--ink)",
  }}>
    {initials}
  </div>
);

const POST_COLORS = [
  "var(--poppy)", "var(--sage)", "var(--gold)", "#C96B7A", "var(--accent)",
];

// ── Platform config ────────────────────────────────────────────────────────────

const platformConfig: Record<string, { color: string; textColor: string; icon: React.ReactNode }> = {
  Reddit: {
    color: "#FF4500", textColor: "#fff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>,
  },
  Facebook: {
    color: "#1877F2", textColor: "#fff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  HealthUnlocked: {
    color: "#00897b", textColor: "#fff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
  Inspire: {
    color: "#005baa", textColor: "#fff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  PatientsLikeMe: {
    color: "#00b5ad", textColor: "#fff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  X: {
    color: "#000", textColor: "#fff",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.264 5.633 5.9-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  Other: {
    color: "var(--accent)", textColor: "#fff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
};

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({ post, index }: { post: SocialPost; index: number }) {
  const color = POST_COLORS[index % POST_COLORS.length];
  const initial = (post.author ?? "?")[0].toUpperCase();

  return (
    <GardenPaper style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Portrait initials={initial} color={color} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 15, color: "var(--ink)", margin: 0 }}>
            {post.platform === "Reddit" ? `u/${post.author}` : post.author}
          </p>
          <Overline style={{ display: "block", marginTop: 2 }}>
            {post.platform === "Reddit" && post.subreddit ? `r/${post.subreddit}` : post.condition}
            {post.timeAgo ? ` · ${post.timeAgo}` : ""}
          </Overline>
        </div>
      </div>
      <h3 style={{
        fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
        fontSize: 19, fontWeight: 400, color: "var(--ink)", margin: 0, lineHeight: 1.25,
      }}>
        {post.title}
      </h3>
      {post.excerpt && post.excerpt !== post.title && (
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
          {post.excerpt}
        </p>
      )}
      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px dashed var(--rule)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 14 }}>
          {post.score !== undefined && (
            <Overline>
              ↑ {post.score > 999 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
            </Overline>
          )}
          {post.numComments !== undefined && (
            <Overline>{post.numComments} replies</Overline>
          )}
        </div>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 13, color, textDecoration: "none",
          }}>
            open ›
          </a>
        )}
      </div>
    </GardenPaper>
  );
}

// ── Community tile ─────────────────────────────────────────────────────────────

function CommunityTile({ community }: { community: Community }) {
  const config = platformConfig[community.platform] ?? platformConfig.Other;
  return (
    <GardenPaper style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: config.color }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: config.textColor }}>
          {config.icon}
          <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: config.textColor, fontWeight: 500 }}>
            {community.platform}
          </span>
        </div>
        {community.members && (
          <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.1em", background: "rgba(255,255,255,0.2)", color: config.textColor, padding: "3px 8px", borderRadius: 999 }}>
            {community.members}
          </span>
        )}
      </div>
      <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 18, fontWeight: 400, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
          {community.name}
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Overline color={config.color}>{community.condition}</Overline>
          <Overline>· {community.tone}</Overline>
        </div>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0, flex: 1 }}>
          {community.description}
        </p>
        <a
          href={community.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px", borderRadius: 12, fontSize: 14,
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            background: config.color, color: config.textColor, textDecoration: "none",
          }}
        >
          join community ›
        </a>
      </div>
    </GardenPaper>
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
      if (data.error) setError("Could not find community insights. Please try again.");
      else setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GardenPaper style={{ padding: 28 }}>
      <Overline style={{ display: "block", marginBottom: 8 }}>ask the community</Overline>
      <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 24, fontWeight: 400, color: "var(--ink)", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
        what do others say?
      </h2>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'What helps with fatigue?' or 'Side effects of Metformin?'"
          disabled={loading}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 14, fontSize: 15,
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            outline: "none", background: "var(--soft)", color: "var(--ink)",
            border: "1px solid var(--rule)",
          }}
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          style={{
            padding: "12px 20px", borderRadius: 999, fontSize: 15,
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            background: "var(--ink)", color: "var(--paper)", border: "none",
            cursor: "pointer", opacity: (!query.trim() || loading) ? 0.45 : 1,
          }}
        >
          {loading ? "searching…" : "search"}
        </button>
      </form>

      {/* Suggested prompts */}
      {!result && !loading && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {[
            "What do others wish they'd known at diagnosis?",
            "How do people manage flare-ups?",
            "Which medications have helped most?",
            "Tips for talking to family about my condition",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => { setQuery(prompt); inputRef.current?.focus(); }}
              style={{
                fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
                fontSize: 13, padding: "6px 14px", borderRadius: 999,
                background: "var(--soft)", color: "var(--ink-soft)", border: "none", cursor: "pointer",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[80, 100, 70, 90].map((w, i) => (
            <div key={i} style={{ height: 10, width: `${w}%`, borderRadius: 999, background: "var(--soft)" }} />
          ))}
        </div>
      )}

      {error && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "#dc2626" }}>{error}</p>}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Overline color={result.usedRealData ? "#FF4500" : "var(--sage)"} style={{ background: result.usedRealData ? "#fff0ec" : "rgba(124,142,107,0.15)", padding: "4px 10px", borderRadius: 999 }}>
              {result.usedRealData ? "based on real community discussions" : "based on community knowledge"}
            </Overline>
          </div>

          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.7, whiteSpace: "pre-wrap", padding: 20, borderRadius: 12, background: "var(--soft)" }}>
            {result.answer}
          </div>

          {result.usedRealData && result.sources.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Overline>community threads</Overline>
              {result.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", gap: 12, borderRadius: 12, padding: "10px 14px", background: "var(--paper)", border: "1px solid var(--rule)", textDecoration: "none" }}>
                  <Overline color="#FF4500">r/{s.subreddit}</Overline>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, color: "var(--ink-soft)", flex: 1, lineHeight: 1.4 }}>{s.title}</span>
                </a>
              ))}
            </div>
          )}

          <button onClick={() => { setResult(null); setQuery(""); }} style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13, color: "var(--ink-faded)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
            ← ask another question
          </button>
        </div>
      )}
    </GardenPaper>
  );
}

// ── Local type config ─────────────────────────────────────────────────────────

const LOCAL_TYPE_CONFIG = {
  charity:  { label: "Charity",  color: "#7c3aed" },
  nhs:      { label: "NHS",      color: "#1d4ed8" },
  helpline: { label: "Helpline", color: "var(--sage)" },
  meetup:   { label: "Meetup",   color: "#e11d48" },
  facebook: { label: "Facebook", color: "#1877F2" },
};

function LocalCommunityCard({ community }: { community: LocalCommunity }) {
  const tc = LOCAL_TYPE_CONFIG[community.type] ?? LOCAL_TYPE_CONFIG.charity;
  return (
    <GardenPaper style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Overline color={tc.color} style={{ background: `${tc.color}15`, padding: "3px 10px", borderRadius: 999 }}>
          {tc.label}
        </Overline>
        {community.isInPerson && (
          <Overline color="var(--sage)" style={{ background: "rgba(124,142,107,0.12)", padding: "3px 10px", borderRadius: 999 }}>
            ● in person
          </Overline>
        )}
        <Overline style={{ marginLeft: "auto" }}>{community.condition}</Overline>
      </div>
      <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 16, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
        {community.name}
      </h3>
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0, flex: 1 }}>
        {community.description}
      </p>
      <a href={community.url} target="_blank" rel="noopener noreferrer"
        style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13, color: tc.color, textDecoration: "none", marginTop: "auto" }}>
        find local support ›
      </a>
    </GardenPaper>
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

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile?.location) { setLocation(profile.location); setLocationInput(profile.location); }
      })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, []);

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
        if (data.communities) { setLocalCommunities(data.communities); setLocalCachedAt(data.cachedAt ?? null); if (data.remainingCredits !== undefined) setCredits(data.remainingCredits); }
        else if (data.error) setLocalError(data.error);
      })
      .catch(() => setLocalError("Could not load local communities."))
      .finally(() => setLocalLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, conditionsKey, conditionsLoaded]);

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
        } else setError("Could not load communities.");
      })
      .catch(() => setError("Could not load communities."))
      .finally(() => setCommunitiesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, conditionsLoaded, documentsLoaded]);

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
      const res = await fetch("/api/communities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id), forceRefresh: true }) });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.communities) { setCommunities(data.communities); setCommunitiesCachedAt(data.cachedAt ?? null); if (data.remainingCredits !== undefined) setCredits(data.remainingCredits); }
    } catch { setError("Could not refresh communities."); }
    finally { setCommunitiesUpdating(false); }
  }

  async function updatePosts() {
    if (conditions.length === 0 || postsUpdating) return;
    setPostsUpdating(true);
    try {
      const res = await fetch("/api/community-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conditions, forceRefresh: true }) });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.posts) { setPosts(data.posts); setPostsSource(data.source); setPostsCachedAt(data.cachedAt ?? null); if (data.remainingCredits !== undefined) setCredits(data.remainingCredits); }
    } catch { setError("Could not refresh posts."); }
    finally { setPostsUpdating(false); }
  }

  async function handleSetLocation(e: React.FormEvent) {
    e.preventDefault();
    const loc = locationInput.trim();
    if (!loc) return;
    setLocation(loc);
    try {
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: loc }) });
    } catch {}
  }

  async function updateLocalCommunities() {
    if (!location || conditions.length === 0 || localUpdating) return;
    setLocalUpdating(true);
    setLocalError("");
    try {
      const res = await fetch("/api/local-communities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conditions, location, forceRefresh: true }) });
      if (res.status === 402) { setLocalError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.communities) { setLocalCommunities(data.communities); setLocalCachedAt(data.cachedAt ?? null); if (data.remainingCredits !== undefined) setCredits(data.remainingCredits); }
    } catch { setLocalError("Could not refresh local communities."); }
    finally { setLocalUpdating(false); }
  }

  if (!communitiesLoading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 36, fontWeight: 400, color: "var(--ink)", margin: "0 0 16px" }}>
          you are <em>not</em> alone.
        </h1>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 28 }}>
          Add your conditions in your profile and Poppy will find patient communities and real discussions relevant to you.
        </p>
        <a href="/profile" style={{ padding: "12px 22px", borderRadius: 999, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", background: "var(--ink)", color: "var(--paper)", textDecoration: "none" }}>
          Go to Profile
        </a>
      </div>
    );
  }

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 52 }}>
      <GeneralContentBanner />

      {(communitiesLoading || postsLoading) && <AILoadingMessage messages={COMMUNITY_MESSAGES} />}

      {/* Page header */}
      <div>
        <Overline color="var(--poppy)" style={{ display: "block", marginBottom: 10 }}>
          community · {posts.length > 0 ? `${posts.length} voices this week` : "connecting you"}
        </Overline>
        <h1 style={{
          fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
          fontSize: 42, fontWeight: 400, color: "var(--ink)", margin: "0 0 12px",
          letterSpacing: "-0.02em", lineHeight: 1.1,
        }}>
          you are <em>not</em> alone.
        </h1>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
          Real conversations from real people living with — or caring for someone with — your conditions. Poppy surfaces the ones that touch your case.
        </p>
      </div>

      {/* ── Pull-quote anchor (first post) ── */}
      {!postsLoading && featuredPost && (
        <figure style={{
          margin: 0, padding: "36px 44px", background: "var(--bg-warm)",
          borderRadius: 22, border: "1px solid var(--rule)", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative blob */}
          <div style={{ position: "absolute", top: -60, right: -50, width: 220, height: 220, borderRadius: "50%", background: "var(--poppy)", opacity: 0.06, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 30, right: 40, width: 80, height: 80, borderRadius: "50%", background: "var(--sage)", opacity: 0.08, pointerEvents: "none" }} />
          {postsSource === "reddit" && (
            <Overline color="#FF4500" style={{ display: "block", marginBottom: 20, background: "#fff0ec", padding: "4px 10px", borderRadius: 999, width: "fit-content" }}>
              ● live from reddit
            </Overline>
          )}
          <blockquote style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 26, lineHeight: 1.4, color: "var(--ink)", margin: "0 0 24px",
            fontWeight: 400, letterSpacing: "-0.005em", position: "relative",
          }}>
            &ldquo;{featuredPost.title}&rdquo;
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Portrait initials={(featuredPost.author ?? "?")[0].toUpperCase()} color="var(--sage)" size={42} />
            <div>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 15, color: "var(--ink)", margin: 0 }}>
                {featuredPost.platform === "Reddit" ? `u/${featuredPost.author}` : featuredPost.author}
              </p>
              <Overline style={{ display: "block", marginTop: 2 }}>
                {featuredPost.platform === "Reddit" && featuredPost.subreddit ? `r/${featuredPost.subreddit}` : featuredPost.condition}
                {featuredPost.timeAgo ? ` · ${featuredPost.timeAgo}` : ""}
                {featuredPost.numComments !== undefined ? ` · ${featuredPost.numComments} replies` : ""}
              </Overline>
            </div>
            <div style={{ flex: 1 }} />
            {featuredPost.url && (
              <a href={featuredPost.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 14, color: "var(--poppy-deep)", textDecoration: "none", borderBottom: "1px solid var(--poppy-deep)", paddingBottom: 2 }}>
                read the thread ›
              </a>
            )}
          </div>
        </figure>
      )}

      {/* ── Other posts ── */}
      {(!postsLoading || otherPosts.length > 0) && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <Overline>recent conversations</Overline>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {postsSource === "reddit" && (
                <Overline color="#FF4500" style={{ background: "#fff0ec", padding: "3px 8px", borderRadius: 999 }}>● live from reddit</Overline>
              )}
              {!postsLoading && conditions.length > 0 && (
                <UpdateButton onClick={updatePosts} loading={postsUpdating} credits={credits} cachedAt={postsCachedAt} />
              )}
            </div>
          </div>

          {postsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <GardenPaper key={i} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--soft)" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ height: 10, width: "60%", borderRadius: 999, background: "var(--soft)" }} />
                      <div style={{ height: 8, width: "40%", borderRadius: 999, background: "var(--soft)" }} />
                    </div>
                  </div>
                  <div style={{ height: 14, width: "90%", borderRadius: 999, background: "var(--soft)" }} />
                  <div style={{ height: 10, borderRadius: 8, background: "var(--soft)" }} />
                  <div style={{ height: 10, width: "80%", borderRadius: 8, background: "var(--soft)" }} />
                </GardenPaper>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {otherPosts.map((p, i) => <PostCard key={i} post={p} index={i + 1} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Ask the community ── */}
      {conditions.length > 0 && <AskSection conditions={conditions} />}

      {/* ── Communities Near You ── */}
      {conditions.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div>
              <Overline style={{ display: "block", marginBottom: 4 }}>near you</Overline>
              <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 26, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
                {location ? `support in ${location}.` : "find support near you."}
              </h2>
            </div>
            {location && !localLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => { setLocation(""); setLocationInput(""); setLocalCommunities([]); }}
                  style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13, color: "var(--ink-faded)", background: "transparent", border: "none", cursor: "pointer" }}>
                  change location
                </button>
                <UpdateButton onClick={updateLocalCommunities} loading={localUpdating} credits={credits} cachedAt={localCachedAt} />
              </div>
            )}
          </div>

          {!location && profileLoaded && (
            <GardenPaper style={{ padding: 24 }}>
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, color: "var(--ink-soft)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Enter your city or region to find local patient support groups, charity branches, and helplines close to you.
              </p>
              <form onSubmit={handleSetLocation} style={{ display: "flex", gap: 10 }}>
                <LocationAutocomplete
                  value={locationInput}
                  onChange={setLocationInput}
                  placeholder="e.g. London, Manchester, New York"
                  style={{ flex: 1 }}
                  inputStyle={{ width: "100%", padding: "12px 16px", borderRadius: 14, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", outline: "none", background: "var(--soft)", color: "var(--ink)", border: "1px solid var(--rule)" }}
                />
                <button type="submit" disabled={!locationInput.trim()} style={{ padding: "12px 20px", borderRadius: 999, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", background: "var(--ink)", color: "var(--paper)", border: "none", cursor: "pointer", opacity: !locationInput.trim() ? 0.45 : 1 }}>
                  find groups
                </button>
              </form>
            </GardenPaper>
          )}

          {location && (
            <div>
              {localError && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "#dc2626", marginBottom: 12 }}>{localError}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                {localLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <GardenPaper key={i} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                        {[60, 80, 100, 90].map((w, j) => (
                          <div key={j} style={{ height: j === 0 ? 8 : 12, width: `${w}%`, borderRadius: 999, background: "var(--soft)" }} />
                        ))}
                      </GardenPaper>
                    ))
                  : localCommunities.map((c, i) => <LocalCommunityCard key={i} community={c} />)
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Community tiles ── */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <div>
            <Overline style={{ display: "block", marginBottom: 4 }}>join a community</Overline>
            <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 26, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
              find your people.
            </h2>
          </div>
          {!communitiesLoading && hasContext && (
            <UpdateButton onClick={updateCommunities} loading={communitiesUpdating} credits={credits} cachedAt={communitiesCachedAt} />
          )}
        </div>
        {error && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, color: "#dc2626", marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {communitiesLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <GardenPaper key={i} style={{ overflow: "hidden" }}>
                  <div style={{ height: 56, background: "var(--soft)" }} />
                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[70, 50, 90, 80].map((w, j) => (
                      <div key={j} style={{ height: j === 0 ? 14 : 10, width: `${w}%`, borderRadius: 999, background: "var(--soft)" }} />
                    ))}
                  </div>
                </GardenPaper>
              ))
            : communities.map((c, i) => <CommunityTile key={i} community={c} />)
          }
        </div>
        {!communitiesLoading && communities.length > 0 && (
          <p style={{ textAlign: "center", fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-faded)", marginTop: 20, textTransform: "uppercase" }}>
            links open in the respective platform · poppy does not moderate these communities
          </p>
        )}
      </div>
    </div>
  );
}
