"use client";

import { useState, useRef, useEffect, useId } from "react";
import { CONDITIONS } from "./conditions";

type Props = {
  selected: string[];
  onChange: (conditions: string[]) => void;
};

export default function ConditionSelector({ selected, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const suggestions = query.trim().length === 0
    ? []
    : CONDITIONS.filter(
        (c) =>
          c.toLowerCase().includes(query.toLowerCase()) &&
          !selected.includes(c)
      ).slice(0, 8);

  const showCustomOption =
    query.trim().length > 0 &&
    !CONDITIONS.some((c) => c.toLowerCase() === query.trim().toLowerCase()) &&
    !selected.includes(query.trim());

  function add(condition: string) {
    const trimmed = condition.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function remove(condition: string) {
    onChange(selected.filter((c) => c !== condition));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        add(suggestions[0]);
      } else if (showCustomOption) {
        add(query.trim());
      }
    }
    if (e.key === "Backspace" && query === "" && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Close when clicking outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Input + tags */}
      <div
        className="flex flex-wrap gap-2 items-center px-4 py-3 rounded-2xl border border-stone-200 cursor-text min-h-[52px]"
        style={{ background: "var(--soft)" }}
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((condition) => (
          <span
            key={condition}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            {condition}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(condition); }}
              className="hover:opacity-70 transition-opacity leading-none"
              aria-label={`Remove ${condition}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? "Search or type a condition…" : "Add another…"}
          className="flex-1 min-w-[160px] bg-transparent outline-none text-sm"
          style={{ color: "var(--foreground)" }}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          role="combobox"
        />
      </div>

      {/* Dropdown */}
      {open && (suggestions.length > 0 || showCustomOption) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-2xl border border-stone-100 shadow-lg overflow-hidden"
          style={{ background: "var(--background)" }}
        >
          {suggestions.map((condition) => (
            <li key={condition} role="option" aria-selected={false}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:opacity-70 transition-opacity"
                style={{ color: "var(--foreground)" }}
                onMouseDown={(e) => { e.preventDefault(); add(condition); }}
              >
                {condition}
              </button>
            </li>
          ))}
          {showCustomOption && (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm border-t border-stone-100"
                style={{ color: "var(--primary)" }}
                onMouseDown={(e) => { e.preventDefault(); add(query.trim()); }}
              >
                Add &ldquo;{query.trim()}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
