import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CoverImage } from "@/components/ui/CoverImage";
import { Pagination } from "@/components/ui/Pagination";
import { searchIdsByQuery, applyRankSort } from "@/lib/dbSearch";
import type { PageSize } from "@/types";

export const metadata = { title: "Artists" };

export default async function ArtistsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = sp.page ? parseInt(sp.page) : 1;
  const pageSize = (sp.pageSize ? parseInt(sp.pageSize) : 30) as PageSize;

  const SELECT = { id: true, name: true, image: true, nation: true, isGroup: true, aliases: true } as const;

  let artists: Awaited<ReturnType<typeof prisma.artist.findMany<{ select: typeof SELECT }>>>;
  let total: number;

  if (q) {
    // Rank: 0=name startsWith, 1=alias startsWith, 2=name contains, 3=alias contains
    const ranked = await searchIdsByQuery("Artist", q, 500);
    total = ranked.length;
    const pageRanked = ranked.slice((page - 1) * pageSize, page * pageSize);
    const fetched = await prisma.artist.findMany({
      where: { id: { in: pageRanked.map((r) => r.id) } },
      select: SELECT,
    });
    artists = applyRankSort(fetched, pageRanked);
  } else {
    [artists, total] = await Promise.all([
      prisma.artist.findMany({
        select: SELECT,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.artist.count(),
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Artists</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {/* Search bar */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search artists…"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Search
        </button>
      </form>

      {artists.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No artists found.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {artists.map((artist) => (
              <Link key={artist.id} href={`/artists/${artist.id}.svg`} className="group text-center">
                <CoverImage
                  src={artist.image}
                  alt={artist.name}
                  size="lg"
                  type="circle"
                  className="mx-auto mb-2 group-hover:opacity-90 transition-opacity"
                />
                <div className="flex items-center justify-center gap-1">
                  {artist.nation && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/flags/${artist.nation}.svg`} alt={artist.nation} title={artist.nation} width={20} height={14} className="w-5 h-[14px] object-cover rounded-[2px] flex-shrink-0" />
                  )}
                  <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                    {artist.name}
                  </p>
                </div>
                {artist.isGroup && (
                  <span className="text-xs text-gray-400">Group</span>
                )}
              </Link>
            ))}
          </div>
          <Pagination total={total} page={page} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
