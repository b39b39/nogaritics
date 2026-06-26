"use client";

import { useState, useRef } from "react";
import { TagIcon, XIcon } from "lucide-react";

export interface SelectedTag {
  id: string;
  name: string;
}

interface Props {
  value: SelectedTag[];
  onChange: (tags: SelectedTag[]) => void;
}

export function TagPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedTag[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults((data.items ?? []).filter((t: SelectedTag) => !value.some(v => v.id === t.id)));
    }, 300);
  }

  function add(tag: SelectedTag) {
    if (value.some((t) => t.id === tag.id)) return;
    onChange([...value, tag]);
    setQuery("");
    setResults([]);
  }

  function remove(id: string) {
    onChange(value.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">태그</label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {value.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {t.name}
              <button type="button" onClick={() => remove(t.id)} className="hover:text-indigo-900">
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onBlur={() => setTimeout(() => setResults([]), 200)}
          placeholder="태그 검색…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {results.length > 0 && query && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={() => add(r)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
