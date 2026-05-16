"use client";

import { useEffect, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";
import AILoadingMessage from "../components/AILoadingMessage";
import UpdateButton from "../components/UpdateButton";
import GeneralContentBanner from "../components/GeneralContentBanner";

const LEARN_MESSAGES = [
  "Searching the latest medical research…",
  "Finding articles relevant to your conditions…",
  "Reviewing recently published studies…",
  "Curating educational content for you…",
  "Checking clinical guidelines and literature…",
  "Summarising key findings in plain language…",
];

type Article = {
  condition: string;
  title: string;
  summary: string;
  keyPoints: string[];
  readingTime: string;
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
  <span
    style={{
      fontFamily: "'Geist Mono', ui-monospace, monospace",
      fontSize: 10,
      letterSpacing: "0.14em",
      textTransform: "uppercase" as const,
      color: color ?? "var(--ink-faded)",
      ...style,
    }}
  >
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

// Colours cycle across articles
const ARTICLE_COLORS = [
  "var(--poppy)",
  "var(--sage)",
  "var(--gold)",
  "#C96B7A",
  "var(--accent)",
];

// ── Botanical cover motif (CSS-only circles, no SVG dependency) ───────────────

function BotanicalCover({ color = "var(--poppy)" }: { color?: string }) {
  return (
    <div style={{ background: "var(--soft)", position: "relative", minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* Large flower-like blobs */}
      <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: color, opacity: 0.10, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
      <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: color, opacity: 0.12, top: "20%", left: "20%" }} />
      <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", background: "var(--sage)", opacity: 0.10, bottom: "20%", right: "18%" }} />
      <div style={{ position: "absolute", width: 60, height: 60, borderRadius: "50%", background: "var(--gold)", opacity: 0.13, top: "15%", right: "22%" }} />
      {/* Center */}
      <div style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", background: color, opacity: 0.22 }} />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonFeatured() {
  return (
    <GardenPaper style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1.1fr", marginBottom: 44 }}>
      <div style={{ background: "var(--soft)", minHeight: 240 }} />
      <div style={{ padding: 36, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ height: 10, width: "60%", borderRadius: 999, background: "var(--soft)" }} />
        <div style={{ height: 22, width: "90%", borderRadius: 999, background: "var(--soft)" }} />
        <div style={{ height: 22, width: "70%", borderRadius: 999, background: "var(--soft)" }} />
        <div style={{ height: 14, borderRadius: 8, background: "var(--soft)", marginTop: 8 }} />
        <div style={{ height: 14, borderRadius: 8, background: "var(--soft)" }} />
        <div style={{ height: 60, borderRadius: 12, background: "var(--soft)", marginTop: 8 }} />
      </div>
    </GardenPaper>
  );
}

function SkeletonCard() {
  return (
    <GardenPaper style={{ padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ height: 10, width: "60%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 15, width: "85%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 10, width: "100%", borderRadius: 999, background: "var(--soft)" }} />
      <div style={{ height: 10, width: "80%", borderRadius: 999, background: "var(--soft)" }} />
    </GardenPaper>
  );
}

// ── Expand toggle button ──────────────────────────────────────────────────────

function ExpandToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
        fontSize: 13, color: "var(--ink-faded)",
      }}
    >
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      {expanded ? "show less" : "read more"}
    </button>
  );
}

// ── Featured article ──────────────────────────────────────────────────────────

function FeaturedArticle({ article, color }: { article: Article; color: string }) {
  const [expanded, setExpanded] = useState(false);

  // Show only first sentence of summary by default
  const shortSummary = article.summary.split(/(?<=\.)\s/)[0] ?? article.summary;
  const hasMore = article.summary.length > shortSummary.length || article.keyPoints.length > 0;

  return (
    <GardenPaper style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1.1fr", boxShadow: "0 16px 36px -22px rgba(36,26,20,0.16)" }}>
      <BotanicalCover color={color} />
      <div style={{ padding: "32px 32px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Overline color={color}>{article.condition}</Overline>
          <Overline>· {article.readingTime}</Overline>
        </div>
        <h2 style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 26, lineHeight: 1.15, fontWeight: 400,
          color: "var(--ink)", margin: "0 0 12px", letterSpacing: "-0.015em",
        }}>
          {article.title}
        </h2>
        <p style={{
          fontFamily: "'Newsreader', Georgia, serif", fontSize: 15,
          color: "var(--ink-soft)", margin: "0 0 14px", lineHeight: 1.65,
        }}>
          {expanded ? article.summary : shortSummary}
        </p>

        {expanded && article.keyPoints.length > 0 && (
          <div style={{
            padding: "12px 16px", background: "var(--soft)", borderRadius: 12,
            border: "1px dashed var(--rule)", marginBottom: 14,
          }}>
            <Overline color="var(--poppy-deep)" style={{ display: "block", marginBottom: 8 }}>key points</Overline>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
              {article.keyPoints.map((pt, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", lineHeight: 1 }}>·</span>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 14, color: "var(--ink)", lineHeight: 1.55 }}>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasMore && <ExpandToggle expanded={expanded} onToggle={() => setExpanded((v) => !v)} />}
      </div>
    </GardenPaper>
  );
}

// ── Further reading card ──────────────────────────────────────────────────────

function FurtherReadingCard({ article, color }: { article: Article; color: string }) {
  const [expanded, setExpanded] = useState(false);

  const shortSummary = article.summary.split(/(?<=\.)\s/)[0] ?? article.summary;
  const hasMore = article.summary.length > shortSummary.length || article.keyPoints.length > 0;

  return (
    <GardenPaper style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <Overline color={color}>{article.condition}</Overline>
      <h3 style={{
        fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
        fontSize: 18, fontWeight: 400, color: "var(--ink)", margin: 0, lineHeight: 1.2,
      }}>
        {article.title}
      </h3>
      <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
        {expanded ? article.summary : shortSummary}
      </p>

      {expanded && article.keyPoints.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {article.keyPoints.map((pt, i) => (
            <li key={i} style={{ display: "flex", gap: 8 }}>
              <span style={{ color, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic" }}>·</span>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{pt}</span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px dashed var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Overline>{article.readingTime}</Overline>
        {hasMore && <ExpandToggle expanded={expanded} onToggle={() => setExpanded((v) => !v)} />}
      </div>
    </GardenPaper>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, setPageContext, credits, setCredits } = usePoppyContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const hasContext = conditions.length > 0 || documents.length > 0;
  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey = documents.map((d) => d.id).sort().join("|");

  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded) return;

    setArticles([]);
    setError("");

    if (!hasContext) { setLoading(false); return; }

    setLoading(true);
    fetch("/api/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) {
          setArticles(data.articles);
          setCachedAt(data.cachedAt ?? null);
          setPageContext(
            `The user is on the Learn page. Articles available: ${data.articles
              .map((a: Article) => `"${a.title}" (${a.condition})`)
              .join("; ")}.`
          );
        } else {
          setError("Could not load articles.");
        }
      })
      .catch(() => setError("Could not load articles."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionsKey, documentsKey, conditionsLoaded, documentsLoaded, setPageContext]);

  async function updateLearn() {
    if (!hasContext || updating) return;
    setUpdating(true);
    setError("");
    try {
      const res = await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, documentIds: documents.map((d) => d.id), forceRefresh: true }),
      });
      if (res.status === 402) { setError("No AI credits remaining."); return; }
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
        setCachedAt(data.cachedAt ?? null);
        if (data.remainingCredits !== undefined) setCredits(data.remainingCredits);
      }
    } catch {
      setError("Could not refresh articles.");
    } finally {
      setUpdating(false);
    }
  }

  if (!loading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 36, fontWeight: 400, color: "var(--ink)", margin: "0 0 16px" }}>
          reading, <em>just for you.</em>
        </h1>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: 28 }}>
          Add your conditions in your profile and Poppy will create personalised educational articles for you.
        </p>
        <a href="/profile" style={{ padding: "12px 22px", borderRadius: 999, fontSize: 15, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", background: "var(--ink)", color: "var(--paper)", textDecoration: "none" }}>
          Go to Profile
        </a>
      </div>
    );
  }

  const featured = articles[0];
  const further = articles.slice(1);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      <GeneralContentBanner />

      {/* Header */}
      <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Overline color="var(--poppy)" style={{ display: "block", marginBottom: 10 }}>
            learn · personalised to {conditions.join(" · ") || "your conditions"}
          </Overline>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic",
            fontSize: 42, fontWeight: 400, color: "var(--ink)", margin: 0,
            letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>
            reading, <em>just</em> for you.
          </h1>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.6, margin: "12px 0 0", maxWidth: 560 }}>
            Poppy has chosen the pieces that touch your case directly — written in plain language, with the context that matters.
          </p>
        </div>
        {!loading && hasContext && (
          <UpdateButton onClick={updateLearn} loading={updating} credits={credits} cachedAt={cachedAt} />
        )}
      </div>

      {error && <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: "#dc2626", marginBottom: 16 }}>{error}</p>}
      {loading && <AILoadingMessage messages={LEARN_MESSAGES} />}

      {/* Featured article */}
      {loading ? (
        <SkeletonFeatured />
      ) : featured ? (
        <div style={{ marginBottom: 44 }}>
          <FeaturedArticle article={featured} color={ARTICLE_COLORS[0]} />
        </div>
      ) : null}

      {/* Further reading */}
      {!loading && further.length > 0 && (
        <div>
          <Overline style={{ display: "block", marginBottom: 14 }}>further reading</Overline>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {further.map((a, i) => (
              <FurtherReadingCard key={i} article={a} color={ARTICLE_COLORS[(i + 1) % ARTICLE_COLORS.length]} />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div>
          <div style={{ height: 10, width: 120, borderRadius: 999, background: "var(--soft)", marginBottom: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
