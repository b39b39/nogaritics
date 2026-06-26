import Link from "next/link";
import { Fragment } from "react";
import { StarIcon } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { ArtistHoverCard } from "./ArtistHoverCard";
import { formatPublishedDate, formatScore } from "@/lib/utils";
import type { TrackSummary } from "@/types";

interface TrackCardProps {
  track: TrackSummary;
}

export function TrackCard({ track }: TrackCardProps) {
  return (
    <div className="relative flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5 hover:border-indigo-200 hover:shadow-sm transition-all group">
      <Link href={`/tracks/${track.id}`} className="absolute inset-0 rounded-xl z-0" aria-label={track.name} />
      <CoverImage src={track.image ?? track.album?.image} alt={track.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="truncate">
          <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {track.name}
          </span>
          {track.aliases.length > 0 && (
            <span className="text-xs text-gray-400 ml-1.5">{track.aliases.join(", ")}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {track.artists.map((a, i) => (
            <Fragment key={a.artist.id}>
              <ArtistHoverCard artistId={a.artist.id}>
                <Link href={`/artists/${a.artist.id}`} className="relative z-10 hover:text-indigo-600 hover:underline">
                  {a.artist.name}
                </Link>
              </ArtistHoverCard>
              {i < track.artists.length - 1 && ", "}
            </Fragment>
          ))}
          {track.album && (
            <>
              {" | "}
              <Link href={`/albums/${track.album.id}`} className="relative z-10 hover:text-indigo-600 hover:underline">
                {track.album.name}
              </Link>
            </>
          )}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 text-sm flex-shrink-0">
        {track.avgScore != null && (
          <span className="font-bold text-indigo-600">{formatScore(track.avgScore)}</span>
        )}
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          {track.starCount > 0 && (
            <span className="flex items-center gap-0.5">
              <StarIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {track.starCount}
            </span>
          )}
          <span>{formatPublishedDate(track.publishedYear, track.publishedMonth, track.publishedDay)}</span>
        </div>
      </div>
    </div>
  );
}
