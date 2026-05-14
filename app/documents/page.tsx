"use client";

import { useState, useEffect, useRef } from "react";
import { usePoppyContext } from "../components/PoppyProvider";

type StoredDocument = {
  id: string;
  name: string;
  size_bytes: number;
  uploaded_at: string;
};

type Message = { role: "user" | "assistant"; text: string };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" />
    </svg>
  );
}

export default function DocumentsPage() {
  const { conditions } = usePoppyContext();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [asking, setAsking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load stored documents on mount
  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then(({ documents: docs }) => {
        if (Array.isArray(docs)) setDocuments(docs);
      })
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError("");
    setUploading(true);

    for (const file of files) {
      if (documents.some((d) => d.name === file.name)) continue;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/documents", { method: "POST", body: formData });
        const data = await res.json();
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev]);
        } else {
          setUploadError(data.error ?? "Upload failed");
        }
      } catch {
        setUploadError("Upload failed. Please try again.");
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setMessages([]);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    const body: Record<string, unknown> = { question: text };
    if (documents.length > 0) {
      body.documentIds = documents.map((d) => d.id);
    } else if (conditions.length > 0) {
      body.conditions = conditions;
    }

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer ?? "Sorry, I couldn't get an answer." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setAsking(false);
    }
  }

  const hasContext = documents.length > 0 || conditions.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
        My Documents
      </h1>
      <p className="text-stone-500 mb-8 text-sm">
        Upload medical records, lab results, or reports. Documents are stored securely and encrypted — only you can access them.
      </p>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors hover:border-stone-400 mb-3"
        style={{
          borderColor: documents.length > 0 ? "var(--accent)" : "#d6cdc4",
          background: "var(--soft)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        {uploading ? (
          <p className="text-stone-500 text-sm animate-pulse">Uploading…</p>
        ) : (
          <>
            <svg className="w-9 h-9 mx-auto mb-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="font-medium text-stone-600 text-sm">Click to upload documents</p>
            <p className="text-xs text-stone-400 mt-1">PDF or TXT · max 10 MB each</p>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-red-500 text-xs mb-4">{uploadError}</p>
      )}

      {/* Security badge */}
      <div
        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6"
        style={{ background: "var(--soft)", color: "var(--primary)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Encrypted at rest · Private · Only accessible by you
      </div>

      {/* Stored documents list */}
      {loadingDocs ? (
        <div className="space-y-2 mb-8">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--soft)" }} />
          ))}
        </div>
      ) : documents.length > 0 ? (
        <ul className="space-y-2 mb-8">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "var(--soft)" }}
            >
              <span style={{ color: "var(--accent)" }}>
                <FileIcon />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--primary)" }}>
                  {doc.name}
                </p>
                <p className="text-xs text-stone-400">
                  {formatBytes(doc.size_bytes)} · {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-40"
                title="Delete document"
                aria-label={`Delete ${doc.name}`}
              >
                {deletingId === doc.id ? (
                  <span className="animate-pulse text-xs">…</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !loadingDocs && (
          <p className="text-sm text-stone-400 mb-8">No documents yet. Upload one above to get started.</p>
        )
      )}

      {/* Chat section */}
      {hasContext && (
        <div className="mt-2">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--primary)" }}>
            Ask Poppy
          </h2>
          <div className="rounded-2xl overflow-hidden border border-stone-100">
            {/* Messages */}
            <div className="p-5 space-y-3 min-h-[160px] max-h-[380px] overflow-y-auto" style={{ background: "#fff" }}>
              {messages.length === 0 && (
                <p className="text-stone-400 text-sm text-center pt-6">
                  {documents.length > 0
                    ? `${documents.length} document${documents.length > 1 ? "s" : ""} ready. Ask anything about them below.`
                    : `Poppy knows about ${conditions.join(", ")}. Ask anything below.`}
                </p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "var(--accent)", color: "#fff" }
                        : { background: "var(--soft)", color: "var(--foreground)" }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {asking && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl flex gap-1 items-center" style={{ background: "var(--soft)" }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleAsk} className="border-t border-stone-100 p-4 flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  documents.length > 0
                    ? "Ask a question about your documents…"
                    : "Ask anything about your conditions…"
                }
                className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
                style={{ background: "var(--soft)", color: "var(--foreground)" }}
              />
              <button
                type="submit"
                disabled={asking || !question.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                Ask
              </button>
            </form>
          </div>
          <p className="text-xs text-stone-400 mt-3 text-center">
            Poppy is not a substitute for professional medical advice. Always consult your doctor.
          </p>
        </div>
      )}
    </div>
  );
}
