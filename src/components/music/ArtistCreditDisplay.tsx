"use client";

import { useState } from "react";
import Link from "next/link";
import { InfoIcon, XIcon } from "lucide-react";
import { ArtistHoverCard } from "./ArtistHoverCard";
import type { ArtistCredit } from "@/types";

interface Props {
  credits: ArtistCredit[];
}

function ArtistName({ id, name }: { id: string; name: string }) {
  if (id) {
    return (
      <ArtistHoverCard artistId={id}>
        <Link href={`/artists/${id}`} className="hover:underline underline-offset-2">
          {name}
        </Link>
      </ArtistHoverCard>
    );
  }
  return <>{name}</>;
}

export function ArtistCreditDisplay({ credits }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  if (credits.length === 0) return null;

  const visible = credits.filter((c) => c.showInOverview);
  const hasHidden = credits.some((c) => !c.showInOverview);
  const hasNotes = credits.some((c) => c.note);

  const main = visible.filter((c) => c.role === "MAIN");
  const feat = visible.filter((c) => c.role === "FEAT");
  const prod = visible.filter((c) => c.role === "PROD");

  const allMain = credits.filter((c) => c.role === "MAIN");
  const allFeat = credits.filter((c) => c.role === "FEAT");
  const allProd = credits.filter((c) => c.role === "PROD");

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-sm text-white/80">
          {main.map((c, i) => (
            <span key={c.artist.id || i}>
              {i > 0 && ", "}
              <ArtistName id={c.artist.id} name={c.artist.name} />
            </span>
          ))}
          {feat.length > 0 && (
            <span>
              {" (feat. "}
              {feat.map((c, i) => (
                <span key={c.artist.id || i}>
                  {i > 0 && ", "}
                  <ArtistName id={c.artist.id} name={c.artist.name} />
                </span>
              ))}
              {")"}
            </span>
          )}
          {prod.length > 0 && (
            <span>
              {" (prod. "}
              {prod.map((c, i) => (
                <span key={c.artist.id || i}>
                  {i > 0 && ", "}
                  <ArtistName id={c.artist.id} name={c.artist.name} />
                </span>
              ))}
              {")"}
            </span>
          )}
          {main.length === 0 && feat.length === 0 && prod.length === 0 && "(크레딧 없음)"}
        </span>
        {(hasHidden || hasNotes) && (
          <button
            onClick={() => setShowInfo(true)}
            className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
            title="전체 크레딧"
          >
            <InfoIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs mx-4 px-6 py-5">
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Track Credit</h2>
              <button onClick={() => setShowInfo(false)} className="text-gray-300 hover:text-gray-500 -mt-0.5 -mr-1">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {allMain.length > 0 && (
                <div className="space-y-1">
                  {allMain.map((c, i) => (
                    <p key={i} className="text-gray-900">
                      <ArtistName id={c.artist.id} name={c.artist.name} />
                      {c.note ? ` (${c.note})` : ""}
                    </p>
                  ))}
                </div>
              )}

              {allFeat.length > 0 && (
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs">feat</p>
                  {allFeat.map((c, i) => (
                    <p key={i} className="text-gray-900">
                      <ArtistName id={c.artist.id} name={c.artist.name} />
                      {c.note ? ` (${c.note})` : ""}
                    </p>
                  ))}
                </div>
              )}

              {allProd.length > 0 && (
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs">prod</p>
                  {allProd.map((c, i) => (
                    <p key={i} className="text-gray-900">
                      <ArtistName id={c.artist.id} name={c.artist.name} />
                      {c.note ? ` (${c.note})` : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
