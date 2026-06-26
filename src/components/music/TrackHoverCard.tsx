"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const CARD_W = 200;
const CARD_H = 150;
const SHOW_DELAY = 280;
const HIDE_DELAY = 120;

interface TrackPreview {
  id: string;
  name: string;
  aliases: string[];
  image: string | null;
  album: { id: string; name: string; image: string | null } | null;
  artists: { artist: { id: string; name: string } }[];
  tags: { tag: { id: string; name: string } }[];
}

const previewCache = new Map<string, TrackPreview>();

interface CardPos {
  top?: number;
  bottom?: number;
  left: number;
}

function Card({
  data, pos, onMouseEnter, onMouseLeave,
}: {
  data: TrackPreview;
  pos: CardPos;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const cover = data.image ?? data.album?.image ?? null;
  const artistNames = data.artists.map((a) => a.artist.name).join(", ");

  return (
    <div
      style={{ position: "fixed", ...pos, width: CARD_W, height: CARD_H, zIndex: 9999 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 pointer-events-auto"
    >
      {cover ? (
        <Image src={cover} alt="" fill className="object-cover" sizes="200px" />
      ) : (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <span className="text-white/20 text-5xl font-bold">{data.name[0]?.toUpperCase()}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/10" />
      <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
        <p className="text-white text-sm font-semibold truncate leading-tight">{data.name}</p>
        {data.aliases.length > 0 && (
          <p className="text-white/50 text-xs truncate leading-tight mt-0.5">{data.aliases.join(" · ")}</p>
        )}
        {artistNames && (
          <p className="text-white/70 text-xs truncate leading-tight mt-1">{artistNames}</p>
        )}
        {data.album && (
          <p className="text-white/50 text-xs truncate leading-tight mt-1">{data.album.name}</p>
        )}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {data.tags.map(({ tag }) => (
              <span key={tag.id} className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] text-white/70 leading-tight">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  trackId: string;
  children: React.ReactNode;
}

export function TrackHoverCard({ trackId, children }: Props) {
  const [preview, setPreview] = useState<TrackPreview | null>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<CardPos>({ left: 0, top: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  function handleEnter() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (showTimer.current) clearTimeout(showTimer.current);
    activeRef.current = true;

    showTimer.current = setTimeout(async () => {
      if (!activeRef.current || !triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - CARD_W - 8));
      const newPos: CardPos =
        window.innerHeight - rect.bottom >= CARD_H + 8
          ? { top: rect.bottom + 6, left }
          : { bottom: window.innerHeight - rect.top + 6, left };
      setPos(newPos);

      let data = previewCache.get(trackId);
      if (!data) {
        try {
          const res = await fetch(`/api/tracks/${trackId}`);
          if (res.ok) {
            data = await res.json() as TrackPreview;
            previewCache.set(trackId, data);
          }
        } catch { /* ignore */ }
      }

      if (data && activeRef.current) {
        setPreview(data);
        setVisible(true);
      }
    }, SHOW_DELAY);
  }

  function handleLeave() {
    activeRef.current = false;
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY);
  }

  function handleCardEnter() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    activeRef.current = true;
  }

  return (
    <span ref={triggerRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {mounted && visible && preview && createPortal(
        <Card data={preview} pos={pos} onMouseEnter={handleCardEnter} onMouseLeave={handleLeave} />,
        document.body,
      )}
    </span>
  );
}
