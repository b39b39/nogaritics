import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TrackCard } from "@/components/music/TrackCard";
import { computeStats, artistInclude, tagInclude } from "@/lib/queries";
import { formatPublishedDate, formatScore } from "@/lib/utils";
import { Pencil } from "lucide-react";
import type { TrackSummary } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: id }, { id }] },
    select: { name: true, username: true },
  });
  return { title: user?.name ?? user?.username ?? "User" };
}

const ALBUM_INCLUDE = {
  ...artistInclude,
  rates: { select: { score: true as const, starred: true as const } },
  _count: { select: { tracks: true as const } },
} as const;

const TRACK_INCLUDE = {
  ...artistInclude,
  ...tagInclude,
  album: { select: { id: true as const, name: true as const, image: true as const } },
  rates: { select: { score: true as const, starred: true as const } },
} as const;

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  // look up by username first, then by data id
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: id }, { id }] },
    select: {
      id: true, name: true, username: true,
      image: true, banner: true,
      blockColor: true, blockTextColor: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;
  const handle = user.username ?? user.id;

  const blockBg = user.blockColor ?? "#1e293b";
  const blockText = user.blockTextColor ?? "#f8fafc";

  // Counts for stats
  const [ratingCount, starCount] = await Promise.all([
    prisma.rate.count({ where: { userId: user.id, score: { not: null } } }),
    prisma.rate.count({ where: { userId: user.id, starred: true } }),
  ]);

  // Top 5 starred albums with highest personal score
  const starredAlbumRates = await prisma.rate.findMany({
    where: { userId: user.id, starred: true, albumId: { not: null } },
    include: { album: { include: ALBUM_INCLUDE } },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: 5,
  });

  // Top 5 starred tracks (scored first, then unscored)
  const starredTrackRates = await prisma.rate.findMany({
    where: { userId: user.id, starred: true, trackId: { not: null } },
    include: { track: { include: TRACK_INCLUDE } },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: 5,
  });

  const starredAlbums = starredAlbumRates.map((r) => {
    const a = r.album!;
    const { avgScore, rateCount, starCount: sc } = computeStats(a.rates);
    return { id: a.id, name: a.name, image: a.image, publishedYear: a.publishedYear, publishedMonth: a.publishedMonth, artists: a.artists, trackCount: a._count.tracks, avgScore, rateCount, starCount: sc, myScore: r.score };
  });

  const starredTracks: TrackSummary[] = starredTrackRates.map((r) => {
    const t = r.track!;
    const { avgScore, rateCount, starCount: sc } = computeStats(t.rates);
    return {
      id: t.id, name: t.name, aliases: t.aliases, image: t.image,
      publishedYear: t.publishedYear, publishedMonth: t.publishedMonth, publishedDay: t.publishedDay,
      createdAt: t.createdAt,
      artists: t.artists.map((a) => ({ artist: a.artist, role: a.role, showInOverview: a.showInOverview })),
      album: t.album,
      tags: t.tags.map((tt) => tt.tag),
      avgScore, rateCount, starCount: sc,
      myScore: r.score, myStarred: true,
    };
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Profile header (7:3 banner:block) ─────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ height: "320px" }}>
        {/* Banner — top 70% = 224px */}
        <div className="relative w-full bg-gray-300" style={{ height: "70%" }}>
          {user.banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.banner} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />
          )}
          {isOwner && (
            <Link
              href={`/user/${handle}/edit`}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit profile
            </Link>
          )}
        </div>

        {/* Block — bottom 30% = 96px */}
        <div className="relative flex items-center px-6 gap-4" style={{ height: "30%", backgroundColor: blockBg, color: blockText }}>
          {/* Avatar sits at the banner/block boundary */}
          <div className="absolute left-6 -top-10 flex-shrink-0">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? "User"} className="w-20 h-20 rounded-full object-cover" style={{ boxShadow: `0 0 0 4px ${blockText}` }} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-200 flex items-center justify-center text-2xl font-bold text-indigo-700" style={{ boxShadow: `0 0 0 4px ${blockText}` }}>
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>

          {/* Content pushed right of avatar */}
          <div className="pl-24 flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight truncate" style={{ color: blockText }}>
              {user.name ?? user.username ?? "Unknown"}
            </p>
            {user.username && (
              <p className="text-sm opacity-60 leading-tight">@{user.username}</p>
            )}
            <div className="flex gap-4 mt-1 text-sm">
              <Link
                href={`/chart?ratedBy=${user.id}`}
                className="opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: blockText }}
              >
                <span className="font-bold">{ratingCount}</span>{" "}
                <span className="opacity-70">ratings</span>
              </Link>
              <Link
                href={`/chart?starredBy=${user.id}`}
                className="opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: blockText }}
              >
                <span className="font-bold">{starCount}</span>{" "}
                <span className="opacity-70">starred</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Starred Albums ─────────────────────────────────────────── */}
      {starredAlbums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Starred Albums</h2>
            <Link
              href={`/chart?starredBy=${user.id}&targetType=album`}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              Show all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {starredAlbums.map((album) => (
              <Link key={album.id} href={`/albums/${album.id}`} className="group block">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-200 mb-2">
                  {album.image ? (
                    <Image
                      src={album.image} alt={album.name} fill
                      className="object-cover group-hover:opacity-90 transition-opacity"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-xl font-bold">{album.name[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                  {album.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {album.artists.filter((a) => a.role === "MAIN").map((a) => a.artist.name).join(", ")}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  {album.myScore != null && (
                    <span className="font-bold text-indigo-600">{formatScore(album.myScore)}</span>
                  )}
                  {album.publishedYear && <span>{formatPublishedDate(album.publishedYear, album.publishedMonth)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Starred Tracks ─────────────────────────────────────────── */}
      {starredTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Starred Tracks</h2>
            <Link
              href={`/chart?starredBy=${user.id}&targetType=track`}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              Show all
            </Link>
          </div>
          <div className="space-y-2">
            {starredTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
