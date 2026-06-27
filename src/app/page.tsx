import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAlbums, getTracks } from "@/lib/queries";
import { TrackCard } from "@/components/music/TrackCard";
import { AlbumCard } from "@/components/music/AlbumCard";
import { BarChart3, Music, Disc, Users } from "lucide-react";

export default async function HomePage() {
  const [{ items: recentTracks }, { items: recentAlbums }, counts] = await Promise.all([
    getTracks({ sortBy: "recently", sortOrder: "desc", pageSize: 10, page: 1 }),
    getAlbums({ sortBy: "recently", sortOrder: "desc", pageSize: 10, page: 1 }),
    Promise.all([
      prisma.track.count(),
      prisma.album.count(),
      prisma.artist.count(),
      prisma.rate.count({ where: { score: { not: null } } }),
    ]),
  ]);

  const [trackCount, albumCount, artistCount, rateCount] = counts;
  const recentAlbums5 = recentAlbums.slice(0, 5);
  const recentTracks5 = recentTracks.slice(0, 5);

  return (
    <div className="space-y-10">
      {/* Stats bar */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-1.5 py-3 border-b border-gray-200 text-sm text-gray-600">
        <StatItem icon={<Music className="w-4 h-4" />} label="Tracks" value={trackCount} />
        <StatItem icon={<Disc className="w-4 h-4" />} label="Albums" value={albumCount} />
        <StatItem icon={<Users className="w-4 h-4" />} label="Artists" value={artistCount} />
        <StatItem icon={<BarChart3 className="w-4 h-4" />} label="Ratings" value={rateCount} />
        <span className="text-gray-400 text-xs">— items registered in the database</span>
      </section>

      {/* Recent Albums */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Recent Albums</h2>
          <Link href="/albums" className="text-sm text-indigo-600 hover:underline">View all →</Link>
        </div>
        {recentAlbums5.length === 0 ? (
          <EmptyState message="No albums added yet." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {recentAlbums5.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Tracks */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Recent Tracks</h2>
          <Link href="/tracks" className="text-sm text-indigo-600 hover:underline">View all →</Link>
        </div>
        {recentTracks5.length === 0 ? (
          <EmptyState message="No tracks added yet." />
        ) : (
          <div className="space-y-3">
            {recentTracks5.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-indigo-500">{icon}</span>
      <span className="font-semibold text-gray-900">{value.toLocaleString()}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
      {message}
    </div>
  );
}
