"use client";

import { useState, useRef } from "react";
import { SearchIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { SelectedAlbum } from "@/types";
import { koreanIncludes, koreanStem } from "@/lib/hangul";

interface DBAlbum {
  id: string;
  name: string;
  aliases: string[];
  image: string | null;
  itunesAlbumId: string | null;
  appleMusicUrl: string | null;
}

interface ItunesAlbum {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
  collectionViewUrl?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (album: SelectedAlbum) => void;
}

export function AlbumSearchModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [dbResults, setDbResults] = useState<DBAlbum[]>([]);
  const [itunesResults, setItunesResults] = useState<ItunesAlbum[]>([]);
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
          fetch(`/api/albums?q=${encodeURIComponent(q)}&pageSize=10`).then((r) => r.json()),
          stem
            ? fetch(`/api/albums?q=${encodeURIComponent(stem)}&pageSize=10`).then((r) => r.json())
            : Promise.resolve({ items: [] }),
          fetch(`/api/itunes?entity=album&term=${encodeURIComponent(q)}&limit=10`).then((r) => r.json()),
        ]);

        // Merge DB results from main + stem, deduplicate
        const seenDb = new Set<string>();
        const db: DBAlbum[] = [];
        for (const item of [...(dbRes.items ?? []), ...(stemRes.items ?? [])]) {
          if (!seenDb.has(item.id)) { seenDb.add(item.id); db.push(item); }
        }

        const itunes: ItunesAlbum[] = (itunesRes.results ?? []).filter((a: ItunesAlbum) => a.collectionName);

        const dbItunesIds = new Set(db.map((d) => d.itunesAlbumId).filter(Boolean));
        const itunesFiltered = itunes.filter((a) => !dbItunesIds.has(String(a.collectionId)));

        const checkIds = itunesFiltered.map((a) => String(a.collectionId));
        let finalDb = db;
        let finalItunes = itunesFiltered;
        if (checkIds.length > 0) {
          const promoteRes = await fetch(`/api/albums?itunesAlbumIds=${checkIds.join(",")}`).then((r) => r.json());
          const promoted: DBAlbum[] = (promoteRes.items ?? []).filter((p: DBAlbum) => !db.some((d) => d.id === p.id));
          const promotedIds = new Set(promoted.map((p) => p.itunesAlbumId).filter(Boolean));
          finalDb = [...db, ...promoted];
          finalItunes = itunesFiltered.filter((a) => !promotedIds.has(String(a.collectionId)));
        }

        setDbResults(finalDb.filter((a) => koreanIncludes(a.name, q) || a.aliases.some((al) => koreanIncludes(al, q))));
        setItunesResults(finalItunes.filter((a) => koreanIncludes(a.collectionName, q)));
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function pick(album: SelectedAlbum) {
    onSelect(album);
    handleClose();
  }

  function artworkUrl(url?: string) {
    return url?.replace("100x100", "300x300") ?? null;
  }

  return (
    <Modal open={open} onClose={handleClose} title="앨범 검색" maxWidth="max-w-md">
      <div className="p-4 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="앨범 이름 검색…"
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
                      onClick={() => pick({ id: a.id, name: a.name, image: a.image, itunesAlbumId: a.itunesAlbumId ?? undefined, appleMusicUrl: a.appleMusicUrl })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      {a.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.image} alt={a.name} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-900 flex-1 truncate">{a.name}</span>
                    </button>
                  ))}
                </section>
              )}

              {itunesResults.length > 0 && (
                <section>
                  <p className="text-xs font-medium text-gray-400 px-1 mb-1">iTunes</p>
                  {itunesResults.map((a) => (
                    <button
                      key={a.collectionId}
                      type="button"
                      onClick={() => pick({ id: null, name: a.collectionName, image: artworkUrl(a.artworkUrl100), itunesAlbumId: String(a.collectionId), appleMusicUrl: a.collectionViewUrl ?? null })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      {a.artworkUrl100 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={artworkUrl(a.artworkUrl100)!} alt={a.collectionName} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{a.collectionName}</p>
                        <p className="text-xs text-gray-400 truncate">{a.artistName}</p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 flex-shrink-0">신규</span>
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
            <p className="text-sm text-center text-gray-400 py-4">앨범 이름을 입력하세요</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
