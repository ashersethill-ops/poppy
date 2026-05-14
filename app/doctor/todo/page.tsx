"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Todo = {
  priority: "high" | "medium" | "low";
  patient: string | null;
  action: string;
  detail: string;
  category: "documents" | "review" | "follow-up" | "general";
};

const PRIORITY_STYLES = {
  high:   { dot: "#dc2626", bg: "#fee2e2", text: "#dc2626", label: "High" },
  medium: { dot: "#d97706", bg: "#fef3c7", text: "#92400e", label: "Medium" },
  low:    { dot: "#6b7280", bg: "#f3f4f6", text: "#6b7280", label: "Low" },
};

const CATEGORY_ICONS: Record<string, string> = {
  documents:  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  review:     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  "follow-up":"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  general:    "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

export default function DoctorTodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/doctor/todo")
      .then((r) => r.json())
      .then((d) => setTodos(d.todos ?? []))
      .finally(() => setLoading(false));
  }, []);

  function toggleDone(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const remaining = todos.filter((_, i) => !done.has(i)).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <a
        href="/doctor"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-6"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Doctor home
      </a>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--primary)" }}>
          To-Do List
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {loading
            ? "Generating your personalised action list…"
            : todos.length === 0
            ? "Nothing to action right now."
            : `${remaining} of ${todos.length} tasks remaining`}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--soft)" }} />
          ))}
          <p className="text-center text-xs text-stone-400 mt-2">
            Analysing your patient caseload…
          </p>
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--soft)" }}
          >
            <svg className="w-7 h-7" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: "var(--primary)" }}>All caught up</p>
          <p className="text-stone-400 text-sm mt-1">No actions needed right now.</p>
          <Link
            href="/my-patients"
            className="inline-block mt-4 text-sm hover:underline"
            style={{ color: "var(--accent)" }}
          >
            View your patients →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {todos.map((todo, i) => {
            const isDone = done.has(i);
            const p = PRIORITY_STYLES[todo.priority];
            const iconPath = CATEGORY_ICONS[todo.category] ?? CATEGORY_ICONS.general;
            return (
              <div
                key={i}
                className="rounded-2xl px-5 py-4 flex items-start gap-4 transition-opacity"
                style={{
                  background: "var(--background)",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                  opacity: isDone ? 0.45 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleDone(i)}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                  style={{
                    borderColor: isDone ? "var(--accent)" : "#d1d5db",
                    background: isDone ? "var(--accent)" : "transparent",
                  }}
                  aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                >
                  {isDone && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Category icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--soft)" }}
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="var(--accent)" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p
                      className="text-sm font-semibold"
                      style={{
                        color: "var(--primary)",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {todo.action}
                    </p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: p.bg, color: p.text }}
                    >
                      {p.label}
                    </span>
                  </div>
                  {todo.patient && (
                    <p className="text-xs font-medium mt-0.5" style={{ color: "var(--accent)" }}>
                      {todo.patient}
                    </p>
                  )}
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{todo.detail}</p>
                </div>
              </div>
            );
          })}

          {todos.length > 0 && done.size === todos.length && (
            <div
              className="rounded-2xl px-5 py-4 text-center mt-2"
              style={{ background: "#dcfce7" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#15803d" }}>
                All tasks complete 🎉
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#166534" }}>
                Great work. Check back tomorrow for new suggestions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
