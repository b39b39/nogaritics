import Link from "next/link";
import { Fragment } from "react";
import { StarIcon } from "lucide-react";
import { ArtistHoverCard } from "./ArtistHoverCard";
import { AlbumHoverCard } from "./AlbumHoverCard";
import { TrackHoverCard } from "./TrackHoverCard";
import { formatPublishedDate } from "@/lib/utils";
import type { SortBy, SortOrder } from "@/types";
import type { ChartRow } from "@/lib/queries";

export type { ChartRow };

const MAX_TAGS = 1;

const DEFAULT_SORT_ORDER: Record<SortBy, SortOrder> = {
  recently: "desc",
  published: "desc",
  name: "asc",
  type: "asc",
  artists: "asc",
  score: "desc",
  starred: "desc",
};

function SortHeader({
  label, col, currentCol, currentOrder, baseParams,
}: {
  label: string;
  col: SortBy;
  currentCol: SortBy;
  currentOrder: SortOrder;
  baseParams: Record<string, string>;
}) {
  const isActive = currentCol === col;
  const nextOrder = isActive
    ? currentOrder === "asc" ? "desc" : "asc"
    : DEFAULT_SORT_ORDER[col];
  const href = `/chart?${new URLSearchParams({ ...baseParams, sortBy: col, sortOrder: nextOrder, page: "1" }).toString()}`;
  const arrow = isActive ? (currentOrder === "asc" ? " ↑" : " ↓") : "";

  return (
    <Link
      href={href}
      className={`whitespace-nowrap hover:text-indigo-500 transition-colors ${isActive ? "text-indigo-600" : ""}`}
    >
      {label}{arrow}
    </Link>
  );
}

interface Props {
  items: ChartRow[];
  isLoggedIn: boolean;
  startRow?: number;
  sortBy: SortBy;
  sortOrder: SortOrder;
  baseSearchParams: Record<string, string>;
}

export function ChartTable({ items, isLoggedIn, startRow = 1, sortBy, sortOrder, baseSearchParams }: Props) {
  if (items.length === 0) return null;

  const sp = baseSearchParams;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            <th className="py-2.5 pl-4 pr-2 w-10 text-right">#</th>
            <th className="px-3 py-2.5 w-16 text-left">
              <SortHeader label="Type" col="type" currentCol={sortBy} currentOrder={sortOrder} baseParams={sp} />
            </th>
            <th className="px-3 py-2.5 text-left">
              <SortHeader label="Name" col="name" currentCol={sortBy} currentOrder={sortOrder} baseParams={sp} />
            </th>
            <th className="px-3 py-2.5 text-left">
              <SortHeader label="Artists" col="artists" currentCol={sortBy} currentOrder={sortOrder} baseParams={sp} />
            </th>
            {isLoggedIn && (
              <th className="px-3 py-2.5 w-14 text-right">
                <SortHeader label="Rate" col="score" currentCol={sortBy} currentOrder={sortOrder} baseParams={sp} />
              </th>
            )}
            {isLoggedIn && (
              <th className="px-3 py-2.5 w-9 text-center">
                <SortHeader label="★" col="starred" currentCol={sortBy} currentOrder={sortOrder} baseParams={sp} />
              </th>
            )}
            <th className="px-3 py-2.5 w-24 text-right">
              <SortHeader label="Published" col="published" currentCol={sortBy} currentOrder={sortOrder} baseParams={sp} />
            </th>
            <th className="px-3 py-2.5 w-28 text-left">Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const overviewArtists = item.artists.filter((a) => a.showInOverview !== false);
            const href = `/${item.type}s/${item.id}`;
            const published = formatPublishedDate(item.publishedYear, item.publishedMonth, item.publishedDay);

            const nameLink = (
              <Link
                href={href}
                className="font-medium text-gray-900 hover:text-indigo-600 transition-colors leading-snug"
              >
                {item.name}
              </Link>
            );

            return (
              <tr
                key={item.id}
                className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
              >
                <td className="py-2.5 pl-4 pr-2 text-right text-xs tabular-nums text-gray-300 font-mono">
                  {startRow + i}
                </td>

                <td className="px-3 py-2.5">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    item.type === "track"
                      ? "bg-indigo-50 text-indigo-500"
                      : "bg-amber-50 text-amber-500"
                  }`}>
                    {item.type}
                  </span>
                </td>

                <td className="px-3 py-2.5 max-w-[200px] truncate">
                  {item.type === "album" ? (
                    <AlbumHoverCard albumId={item.id}>{nameLink}</AlbumHoverCard>
                  ) : (
                    <TrackHoverCard trackId={item.id}>{nameLink}</TrackHoverCard>
                  )}
                </td>

                <td className="px-3 py-2.5 max-w-[180px]">
                  <p className="truncate text-xs text-gray-600">
                    {overviewArtists.map((a, j) => (
                      <Fragment key={a.artist.id}>
                        {j > 0 && <span className="text-gray-300">, </span>}
                        <ArtistHoverCard artistId={a.artist.id}>
                          <Link
                            href={`/artists/${a.artist.id}`}
                            className="hover:text-indigo-600 hover:underline underline-offset-2"
                          >
                            {a.artist.name}
                          </Link>
                        </ArtistHoverCard>
                      </Fragment>
                    ))}
                  </p>
                </td>

                {isLoggedIn && (
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {item.myScore != null ? (
                      <span className="font-semibold text-indigo-600">{item.myScore.toFixed(1)}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                )}

                {isLoggedIn && (
                  <td className="px-3 py-2.5 text-center">
                    {item.myStarred && (
                      <StarIcon className="inline-block w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    )}
                  </td>
                )}

                <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-gray-500 whitespace-nowrap">
                  {published === "Unknown" ? <span className="text-gray-300">—</span> : published}
                </td>

                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    {item.tags.slice(0, MAX_TAGS).map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/chart?${new URLSearchParams({ tagIds: tag.id }).toString()}`}
                        className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors whitespace-nowrap"
                      >
                        {tag.name}
                      </Link>
                    ))}
                    {item.tags.length > MAX_TAGS && (
                      <span className="text-[10px] text-gray-400">+{item.tags.length - MAX_TAGS}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
