import { getTracks } from "@/lib/queries";
import { TrackCard } from "@/components/music/TrackCard";
import { Pagination } from "@/components/ui/Pagination";
import { ChartControls } from "@/components/music/ChartControls";
import type { ChartFilter, PageSize, SortBy, SortOrder, TargetType } from "@/types";

export const metadata = { title: "Tracks" };

export default async function TracksPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const filter: ChartFilter = {
    q: sp.q,
    targetType: "track",
    artistId: sp.artistId,
    albumId: sp.albumId,
    tagId: sp.tagId,
    ratedBy: sp.ratedBy,
    starredBy: sp.starredBy,
    sortBy: (sp.sortBy as SortBy) || "recently",
    sortOrder: (sp.sortOrder as SortOrder) || "desc",
    page: sp.page ? parseInt(sp.page) : 1,
    pageSize: (sp.pageSize ? parseInt(sp.pageSize) : 30) as PageSize,
  };

  const { items: tracks, total } = await getTracks(filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tracks</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <ChartControls currentFilter={filter} />

      {tracks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No tracks found.</div>
      ) : (
        <>
          <div className="space-y-2">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
          <Pagination total={total} page={filter.page!} pageSize={filter.pageSize!} />
        </>
      )}
    </div>
  );
}
