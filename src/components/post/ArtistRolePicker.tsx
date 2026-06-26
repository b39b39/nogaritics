"use client";

import { useState, useRef } from "react";
import { SearchIcon, XIcon } from "lucide-react";

type ArtistRole = "MAIN" | "FEAT" | "PROD";

export interface SelectedArtist {
  id: string | null;        // null = iTunes 자동완성으로 추가된 미등록 아티스트
  name: string;
  role: ArtistRole;
  itunesArtistId?: string;
  appleMusicUrl?: string | null;
  image?: string | null;
  note?: string;
  showInOverview?: boolean;
}

interface Props {
  value: SelectedArtist[];
  onChange: (artists: SelectedArtist[]) => void;
  label?: string;
}

const ROLE_LABELS: Record<ArtistRole, string> = {
  MAIN: "메인",
  FEAT: "피처링",
  PROD: "프로듀서",
};

function getKey(a: SelectedArtist): string {
  return a.id ?? `itunes-${a.itunesArtistId ?? a.name}`;
}

export function ArtistRolePicker({ value, onChange, label = "아티스트" }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/artists?q=${encodeURIComponent(q)}&pageSize=10`);
        const data = await res.json();
        setResults((data.items ?? []).filter((r: { id: string }) => !value.some(a => a.id === r.id)));
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function add(artist: { id: string; name: string }) {
    if (value.some((a) => a.id === artist.id)) return;
    onChange([...value, { id: artist.id, name: artist.name, role: "MAIN" }]);
    setQuery("");
    setResults([]);
  }

  function remove(key: string) {
    onChange(value.filter((a) => getKey(a) !== key));
  }

  function setRole(key: string, role: ArtistRole) {
    onChange(value.map((a) => (getKey(a) === key ? { ...a, role } : a)));
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {value.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {value.map((a) => {
            const key = getKey(a);
            return (
              <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">{a.name}</span>
                {!a.id && (
                  <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 flex-shrink-0">신규</span>
                )}
                <select
                  value={a.role}
                  onChange={(e) => setRole(key, e.target.value as ArtistRole)}
                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {(Object.keys(ROLE_LABELS) as ArtistRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <button type="button" onClick={() => remove(key)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onBlur={() => setTimeout(() => setResults([]), 200)}
          placeholder="DB에서 아티스트 검색…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {(results.length > 0 || loading) && query && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {loading && <div className="px-3 py-2 text-sm text-gray-400">검색 중…</div>}
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
            {!loading && results.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">결과 없음</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
