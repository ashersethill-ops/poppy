"use client";

interface Props {
  onClick: () => void;
  loading: boolean;
  credits: number | null;
  cachedAt?: string | null;
}

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)  return "just now";
  if (hours < 1)  return `${mins}m ago`;
  if (days  < 1)  return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function UpdateButton({ onClick, loading, credits, cachedAt }: Props) {
  const noCredits = credits !== null && credits <= 0;

  return (
    <div className="flex items-center gap-2.5">
      {cachedAt && (
        <span className="text-xs text-stone-400 hidden sm:inline">
          Updated {formatAge(cachedAt)}
        </span>
      )}
      <button
        onClick={onClick}
        disabled={loading || noCredits}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-70 disabled:opacity-40"
        style={{ background: "var(--soft)", color: "var(--accent)" }}
        title={noCredits ? "No AI credits remaining" : "Refresh with latest AI content (1 credit)"}
      >
        <svg
          width="12" height="12"
          className={loading ? "animate-spin" : ""}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {loading ? "Updating…" : "Update"}
      </button>
    </div>
  );
}
