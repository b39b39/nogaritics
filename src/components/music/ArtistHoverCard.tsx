"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const CARD_W = 200;
const CARD_H = 118; // banner(56) + black section(~62)
const SHOW_DELAY = 280;
const HIDE_DELAY = 120;

interface ArtistPreview {
  id: string;
  name: string;
  aliases: string[];
  image: string | null;
  banner: string | null;
  nation: string | null;
}

// Module-level cache — persists across hovers for the lifetime of the page
const previewCache = new Map<string, ArtistPreview>();

interface CardPos {
  top?: number;
  bottom?: number;
  left: number;
}

function Card({
  data, pos, onMouseEnter, onMouseLeave,
}: {
  data: ArtistPreview;
  pos: CardPos;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      style={{ position: "fixed", ...pos, width: CARD_W, zIndex: 9999 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 pointer-events-auto"
    >
      {/* Banner */}
      <div className="relative h-14 bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
        {data.banner && (
          <Image src={data.banner} alt="" fill className="object-cover" sizes="200px" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-black" />
      </div>

      {/* Black section */}
      <div className="bg-black px-3 pb-3 relative">
        {/* Profile — overlaps banner/black boundary */}
        <div className="absolute -top-5 left-3">
          <div className="relative w-9 h-9 rounded-full ring-2 ring-black overflow-hidden bg-gray-700 flex-shrink-0">
            {data.image ? (
              <Image src={data.image} alt={data.name} fill className="object-cover" sizes="36px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/70 text-xs font-bold">
                {data.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="pt-5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-white text-xs font-semibold truncate leading-tight">
              {data.name}
            </span>
            {data.nation && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/flags/${data.nation}.svg`}
                alt={data.nation}
                className="w-4 h-auto rounded-[2px] flex-shrink-0"
              />
            )}
          </div>
          {data.aliases.length > 0 && (
            <p className="text-white/45 text-[10px] truncate leading-tight mt-0.5">
              {data.aliases.join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  artistId: string;
  children: React.ReactNode;
}

export function ArtistHoverCard({ artistId, children }: Props) {
  const [preview, setPreview] = useState<ArtistPreview | null>(null);
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

      let data = previewCache.get(artistId);
      if (!data) {
        try {
          const res = await fetch(`/api/artists/${artistId}.svg`);
          if (res.ok) {
            data = await res.json() as ArtistPreview;
            previewCache.set(artistId, data);
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
