import { getAlbums } from "@/lib/queries";
import { AlbumCard } from "@/components/music/AlbumCard";
import { Pagination } from "@/components/ui/Pagination";
import { ChartControls } from "@/components/music/ChartControls";
import type { ChartFilter, PageSize, SortBy, SortOrder } from "@/types";

export const metadata = { title: "Albums" };

export default async function AlbumsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const filter: ChartFilter = {
    q: sp.q,
    artistId: sp.artistId,
    tagId: sp.tagId,
    ratedBy: sp.ratedBy,
    starredBy: sp.starredBy,
    sortBy: (sp.sortBy as SortBy) || "recently",
    sortOrder: (sp.sortOrder as SortOrder) || "desc",
    page: sp.page ? parseInt(sp.page) : 1,
    pageSize: (sp.pageSize ? parseInt(sp.pageSize) : 30) as PageSize,
  };

  const layout = sp.view === "grid" ? "grid" : "list";
  const { items: albums, total } = await getAlbums(filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Albums</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <ChartControls currentFilter={filter} showViewToggle />

      {albums.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No albums found.</div>
      ) : layout === "grid" ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} layout="grid" />
            ))}
          </div>
          <Pagination total={total} page={filter.page!} pageSize={filter.pageSize!} />
        </>
      ) : (
        <>
          <div className="space-y-2">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} layout="list" />
            ))}
          </div>
          <Pagination total={total} page={filter.page!} pageSize={filter.pageSize!} />
        </>
      )}
    </div>
  );
}
