import Link from "next/link";
import { Fragment } from "react";
import { StarIcon } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { ArtistLinks } from "./ArtistLinks";
import { ArtistHoverCard } from "./ArtistHoverCard";
import { formatPublishedDate, formatScore } from "@/lib/utils";
import type { AlbumSummary } from "@/types";

interface AlbumCardProps {
  album: AlbumSummary;
  layout?: "grid" | "list";
}

export function AlbumCard({ album, layout = "grid" }: AlbumCardProps) {
  if (layout === "list") {
    return (
      <div className="relative flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5 hover:border-indigo-200 hover:shadow-sm transition-all group">
        <Link href={`/albums/${album.id}`} className="absolute inset-0 rounded-xl z-[1]" aria-label={album.name} />
        <CoverImage src={album.image} alt={album.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="truncate">
            <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {album.name}
            </span>
            {album.aliases.length > 0 && (
              <span className="text-xs text-gray-400 ml-1.5">{album.aliases.join(", ")}</span>
            )}
          </div>
          <ArtistLinks artists={album.artists} />
        </div>
        <div className="flex flex-col items-end gap-1 text-sm flex-shrink-0">
          {album.avgScore != null && (
            <span className="font-bold text-indigo-600">{formatScore(album.avgScore)}</span>
          )}
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            {album.starCount > 0 && (
              <span className="flex items-center gap-0.5">
                <StarIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {album.starCount}
              </span>
            )}
            <span>{formatPublishedDate(album.publishedYear, album.publishedMonth, album.publishedDay)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
      <Link href={`/albums/${album.id}`} className="absolute inset-0 z-[1]" aria-label={album.name} />
      <CoverImage
        src={album.image}
        alt={album.name}
        size="full"
        className="w-full aspect-square group-hover:opacity-90 transition-opacity"
      />
      <div className="p-3">
        <div className="truncate font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
          {album.name}
          {album.aliases.length > 0 && (
            <span className="text-xs text-gray-400 font-normal ml-1.5">{album.aliases.join(", ")}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {album.artists.map((a, i) => (
            <Fragment key={a.artist.id}>
              <ArtistHoverCard artistId={a.artist.id}>
                <Link href={`/artists/${a.artist.id}`} className="relative z-10 hover:text-indigo-600 hover:underline">
                  {a.artist.name}
                </Link>
              </ArtistHoverCard>
              {i < album.artists.length - 1 && ", "}
            </Fragment>
          ))}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          {album.avgScore != null && <span className="font-bold text-indigo-600">{formatScore(album.avgScore)}</span>}
          <span>{formatPublishedDate(album.publishedYear)}</span>
        </div>
      </div>
    </div>
  );
}
