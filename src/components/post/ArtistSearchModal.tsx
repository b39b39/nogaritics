"use client";

import { useState, useRef } from "react";
import { SearchIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { SelectedArtist } from "@/components/post/ArtistRolePicker";
import { koreanIncludes, koreanStem } from "@/lib/hangul";

interface DBResult {
  id: string;
  name: string;
  aliases: string[];
  image: string | null;
  itunesArtistId: string | null;
  appleMusicUrl: string | null;
}

interface ItunesArtist {
  artistId: number;
  artistName: string;
  artistLinkUrl?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (artist: SelectedArtist) => void;
  excludeIds?: string[];
}

export function ArtistSearchModal({ open, onClose, onSelect, excludeIds = [] }: Props) {
  const [query, setQuery] = useState("");
  const [dbResults, setDbResults] = useState<DBResult[]>([]);
  const [itunesResults, setItunesResults] = useState<ItunesArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClose() {
    setQuery(""); setDbResults([]); setItunesResults([]); onClose();
  }

  async function search(q: string) {
    setQuery(q);
    if (!q.trim()) { setDbResults([]); setItunesResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const stem = koreanStem(q);
        const [dbRes, stemRes, itunesRes] = await Promise.all([
          fetch(`/api/artists?q=${encodeURIComponent(q)}&pageSize=10`).then((r) => r.json()),
          stem
            ? fetch(`/api/artists?q=${encodeURIComponent(stem)}&pageSize=10`).then((r) => r.json())
            : Promise.resolve({ items: [] }),
          fetch(`/api/itunes?entity=musicArtist&term=${encodeURIComponent(q)}&limit=10`).then((r) => r.json()),
        ]);

        // Merge DB results from main + stem, deduplicate
        const seenDb = new Set<string>();
        const db: DBResult[] = [];
        for (const item of [...(dbRes.items ?? []), ...(stemRes.items ?? [])]) {
          if (!seenDb.has(item.id) && !excludeIds.includes(item.id)) {
            seenDb.add(item.id);
            db.push(item);
          }
        }

        const itunes: ItunesArtist[] = itunesRes.results ?? [];

        const dbItunesIds = new Set(db.map((d) => d.itunesArtistId).filter(Boolean));
        const itunesFiltered = itunes.filter((a) => !dbItunesIds.has(String(a.artistId)));

        // Promote: iTunes artists already in DB but not in current text search
        const checkIds = itunesFiltered.map((a) => String(a.artistId));
        let finalDb = db;
        let finalItunes = itunesFiltered;
        if (checkIds.length > 0) {
          const promoteRes = await fetch(`/api/artists?itunesArtistIds=${checkIds.join(",")}`).then((r) => r.json());
          const promoted: DBResult[] = (promoteRes.items ?? []).filter((p: DBResult) => !db.some((d) => d.id === p.id) && !excludeIds.includes(p.id));
          const promotedItunesIds = new Set(promoted.map((p) => p.itunesArtistId).filter(Boolean));
          finalDb = [...db, ...promoted];
          finalItunes = itunesFiltered.filter((a) => !promotedItunesIds.has(String(a.artistId)));
        }

        setDbResults(finalDb.filter((a) => koreanIncludes(a.name, q) || a.aliases.some((al) => koreanIncludes(al, q))));
        setItunesResults(finalItunes.filter((a) => koreanIncludes(a.artistName, q)));
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function pick(artist: SelectedArtist) {
    onSelect(artist);
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="아티스트 검색" maxWidth="max-w-md">
      <div className="p-4 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="아티스트 이름 검색…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="h-80 overflow-y-auto space-y-3">
          {loading && <p className="text-sm text-center text-gray-400 py-4">검색 중…</p>}

          {!loading && query && (
            <>
              {dbResults.length > 0 && (
                <section>
                  <p className="text-xs font-medium text-gray-400 px-1 mb-1">DB</p>
                  {dbResults.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => pick({ id: a.id, name: a.name, role: "MAIN", image: a.image, itunesArtistId: a.itunesArtistId ?? undefined, appleMusicUrl: a.appleMusicUrl })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      {a.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.image} alt={a.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-900">{a.name}</span>
                    </button>
                  ))}
                </section>
              )}

              {itunesResults.length > 0 && (
                <section>
                  <p className="text-xs font-medium text-gray-400 px-1 mb-1">iTunes</p>
                  {itunesResults.map((a) => (
                    <button
                      key={a.artistId}
                      type="button"
                      onClick={() => pick({ id: null, name: a.artistName, role: "MAIN", image: null, itunesArtistId: String(a.artistId), appleMusicUrl: a.artistLinkUrl ?? null })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">♪</div>
                      <span className="text-sm text-gray-900">{a.artistName}</span>
                      <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 ml-auto flex-shrink-0">신규</span>
                    </button>
                  ))}
                </section>
              )}

              {!loading && dbResults.length === 0 && itunesResults.length === 0 && (
                <p className="text-sm text-center text-gray-400 py-4">결과 없음</p>
              )}
            </>
          )}

          {!query && (
            <p className="text-sm text-center text-gray-400 py-4">아티스트 이름을 입력하세요</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
