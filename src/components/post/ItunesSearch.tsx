"use client";

import { useState, useRef } from "react";
import { SearchIcon, MusicIcon } from "lucide-react";

interface Props<T> {
  placeholder: string;
  onSearch: (term: string) => Promise<T[]>;
  renderResult: (item: T, index: number) => React.ReactNode;
  onSelect: (item: T) => void;
  label?: string;
}

export function ItunesSearch<T>({ placeholder, onSearch, renderResult, onSelect, label }: Props<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await onSearch(q));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  }

  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-medium text-indigo-600">{label}</p>}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl">
          <MusicIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => setTimeout(() => setResults([]), 200)}
              placeholder={placeholder}
              className="w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <span className="text-xs text-indigo-400 flex-shrink-0 font-medium">iTunes</span>
        </div>
        {query && (results.length > 0 || loading) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-40 overflow-hidden">
            {loading && <div className="px-3 py-3 text-sm text-gray-400">검색 중…</div>}
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {results.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => { onSelect(item); setQuery(""); setResults([]); }}
                  className="w-full text-left hover:bg-indigo-50 transition-colors"
                >
                  {renderResult(item, i)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
