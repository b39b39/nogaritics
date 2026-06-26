"use client";

import { useState, useRef } from "react";
import { SearchIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { SelectedTrack } from "@/types";
import { koreanIncludes, koreanStem } from "@/lib/hangul";

interface DBTrack {
  id: string;
  name: string;
  aliases: string[];
  image: string | null;
  itunesTrackId: string | null;
  artists: { role: string; artist: { name: string } }[];
}

interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  trackViewUrl?: string;
  artistId: number;
}

function toArtistDisplay(artists: { role: string; artist: { name: string } }[]): string {
  return artists.map((a) => a.artist.name).join(", ");
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (track: SelectedTrack) => void;
}

export function TrackSearchModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [dbResults, setDbResults] = useState<DBTrack[]>([]);
  const [itunesResults, setItunesResults] = useState<ItunesTrack[]>([]);
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
          fetch(`/api/tracks?q=${encodeURIComponent(q)}&pageSize=10`).then((r) => r.json()),
          stem
            ? fetch(`/api/tracks?q=${encodeURIComponent(stem)}&pageSize=10`).then((r) => r.json())
            : Promise.resolve({ items: [] }),
          fetch(`/api/itunes?action=search&entity=song&term=${encodeURIComponent(q)}&limit=10`).then((r) => r.json()),
        ]);

        // Merge DB results from main + stem, deduplicate
        const seenDb = new Set<string>();
        const db: DBTrack[] = [];
        for (const item of [...(dbRes.items ?? []), ...(stemRes.items ?? [])]) {
          if (!seenDb.has(item.id)) { seenDb.add(item.id); db.push(item); }
        }

        const itunes: ItunesTrack[] = (itunesRes.results ?? []).filter((t: ItunesTrack) => t.trackName);

        const dbItunesIds = new Set(db.map((d) => d.itunesTrackId).filter(Boolean));
        const itunesFiltered = itunes.filter((t) => !dbItunesIds.has(String(t.trackId)));

        const checkIds = itunesFiltered.map((t) => String(t.trackId));
        let finalDb = db;
        let finalItunes = itunesFiltered;
        if (checkIds.length > 0) {
          const promoteRes = await fetch(`/api/tracks?itunesTrackIds=${checkIds.join(",")}`).then((r) => r.json());
          const promoted: DBTrack[] = (promoteRes.items ?? []).filter((p: DBTrack) => !db.some((d) => d.id === p.id));
          const promotedIds = new Set(promoted.map((p) => p.itunesTrackId).filter(Boolean));
          finalDb = [...db, ...promoted];
          finalItunes = itunesFiltered.filter((t) => !promotedIds.has(String(t.trackId)));
        }

        setDbResults(finalDb.filter((t) => koreanIncludes(t.name, q) || t.aliases.some((al) => koreanIncludes(al, q))));
        setItunesResults(finalItunes.filter((t) => koreanIncludes(t.trackName, q)));
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function pick(track: SelectedTrack) {
    onSelect(track);
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="트랙 검색" maxWidth="max-w-md">
      <div className="p-4 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="트랙 이름 검색…"
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
                  {dbResults.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => pick({
                        id: t.id,
                        name: t.name,
                        image: t.image,
                        artistDisplay: toArtistDisplay(t.artists),
                        itunesTrackId: t.itunesTrackId ?? undefined,
                      })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      {t.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.image} alt={t.name} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{t.name}</p>
                        <p className="text-xs text-gray-400 truncate">{toArtistDisplay(t.artists)}</p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {itunesResults.length > 0 && (
                <section>
                  <p className="text-xs font-medium text-gray-400 px-1 mb-1">iTunes</p>
                  {itunesResults.map((t) => (
                    <button
                      key={t.trackId}
                      type="button"
                      onClick={() => pick({
                        id: null,
                        name: t.trackName,
                        image: t.artworkUrl100?.replace("100x100", "300x300") ?? null,
                        artistDisplay: t.artistName,
                        itunesTrackId: String(t.trackId),
                        itunesArtistId: String(t.artistId),
                        appleMusicUrl: t.trackViewUrl ?? null,
                      })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      {t.artworkUrl100 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.artworkUrl100.replace("100x100", "300x300")} alt={t.trackName} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{t.trackName}</p>
                        <p className="text-xs text-gray-400 truncate">{t.artistName}</p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 flex-shrink-0">신규</span>
                    </button>
                  ))}
                </section>
              )}

              {dbResults.length === 0 && itunesResults.length === 0 && (
                <p className="text-sm text-center text-gray-400 py-4">결과 없음</p>
              )}
            </>
          )}

          {!query && (
            <p className="text-sm text-center text-gray-400 py-4">트랙 이름을 입력하세요</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
