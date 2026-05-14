"use client";

import { useEffect, useState } from "react";
import { usePoppyContext } from "../components/PoppyProvider";

type Article = {
  condition: string;
  title: string;
  summary: string;
  keyPoints: string[];
  readingTime: string;
};

function SkeletonCard() {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-4 animate-pulse"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 rounded-full w-1/3" style={{ background: "var(--soft)" }} />
        <div className="h-4 rounded-full w-20" style={{ background: "var(--soft)" }} />
      </div>
      <div className="h-5 rounded-full w-3/4" style={{ background: "var(--soft)" }} />
      <div className="h-3 rounded-full w-full" style={{ background: "var(--soft)" }} />
      <div className="h-3 rounded-full w-5/6" style={{ background: "var(--soft)" }} />
      <div className="flex flex-col gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3 rounded-full w-4/5" style={{ background: "var(--soft)" }} />
        ))}
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col gap-4"
      style={{ background: "var(--background)", boxShadow: "0 2px 16px 0 rgba(0,0,0,0.07)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          style={{ background: "var(--soft)", color: "var(--accent)" }}
        >
          {article.condition}
        </span>
        <span className="text-xs text-stone-400">{article.readingTime}</span>
      </div>

      <h2 className="text-lg font-semibold leading-snug" style={{ color: "var(--primary)" }}>
        {article.title}
      </h2>

      <p className="text-sm text-stone-500 leading-relaxed">{article.summary}</p>

      <div style={{ borderTop: "1px solid var(--soft)" }} />

      <ul className="flex flex-col gap-2">
        {article.keyPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="flex-shrink-0 mt-0.5"
              style={{ color: "var(--accent)" }}
            >
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LearnPage() {
  const { conditions, conditionsLoaded, documents, documentsLoaded, setPageContext } = usePoppyContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasContext = conditions.length > 0 || documents.length > 0;

  // Use value-based keys so the effect re-runs whenever conditions actually change,
  // not just when the array reference changes (which can be missed after navigation).
  const conditionsKey = conditions.slice().sort().join("|");
  const documentsKey = documents.map((d) => d.id).sort().join("|");

  useEffect(() => {
    if (!conditionsLoaded || !documentsLoaded) return;

    // Always clear stale articles immediately when conditions change
    setArticles([]);
    setError("");

    if (!hasContext) {
      setLoading(false);
      return;
    }

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

  if (!loading && conditionsLoaded && documentsLoaded && !hasContext) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: "var(--soft)", color: "var(--accent)" }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3" style={{ color: "var(--primary)" }}>
          Learn About Your Conditions
        </h1>
        <p className="text-stone-500 leading-relaxed">
          Add your conditions in your profile and Poppy will create personalised educational articles for you.
        </p>
        <a
          href="/profile"
          className="inline-block mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          Go to Profile
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: "var(--primary)" }}>
          Learn About Your Conditions
        </h1>
        <p className="text-stone-500 text-sm">
          Plain-language guides for: {conditions.join(", ")}
        </p>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      <div className="flex flex-col gap-5">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.map((a, i) => <ArticleCard key={i} article={a} />)
        }
      </div>
    </div>
  );
}
