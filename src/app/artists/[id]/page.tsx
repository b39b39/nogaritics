import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { TrackCard } from "@/components/music/TrackCard";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { ExternalLinks } from "@/components/ui/ExternalLinks";
import { computeStats, tagInclude } from "@/lib/queries";
import { formatPublishedDate, formatScore } from "@/lib/utils";
import { getSessionRole, canEdit } from "@/lib/permissions";
import { ArtistActions } from "@/components/music/ArtistActions";
import { ArtistHoverCard } from "@/components/music/ArtistHoverCard";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await prisma.artist.findUnique({ where: { id }, select: { name: true } });
  return { title: artist?.name ?? "Artist" };
}

export default async function ArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getSessionRole();
  const editable = canEdit(role);

  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      ...tagInclude,
      memberEntries: {
        include: {
          member: { select: { id: true, name: true, image: true, nation: true, isGroup: true } },
        },
      },
      groupEntries: {
        include: {
          group: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!artist) notFound();

  const trackArtists = await prisma.trackArtist.findMany({
    where: { artistId: id, role: "MAIN" },
    include: {
      track: {
        include: {
          artists: { include: { artist: { select: { id: true, name: true, image: true, nation: true, isGroup: true } } } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
          album: { select: { id: true, name: true, image: true } },
          rates: { select: { score: true, starred: true } },
        },
      },
    },
    orderBy: { track: { publishedYear: "desc" } },
    take: 5,
  });

  const albumArtists = await prisma.albumArtist.findMany({
    where: { artistId: id, role: "MAIN" },
    include: {
      album: {
        include: {
          artists: { include: { artist: { select: { id: true, name: true, image: true, nation: true, isGroup: true } } } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
          _count: { select: { tracks: true } },
          rates: { select: { score: true, starred: true } },
        },
      },
    },
    orderBy: { album: { publishedYear: "desc" } },
    take: 5,
  });

  const trackItems = trackArtists.map(({ track: t }) => {
    const { avgScore, rateCount, starCount } = computeStats(t.rates);
    return {
      id: t.id, name: t.name, aliases: t.aliases, image: t.image,
      publishedYear: t.publishedYear, publishedMonth: t.publishedMonth, publishedDay: t.publishedDay,
      createdAt: t.createdAt,
      artists: t.artists.map((a) => ({ artist: a.artist, role: a.role })),
      album: t.album, tags: t.tags.map((tt) => tt.tag),
      avgScore, rateCount, starCount,
    };
  });

  const albumItems = albumArtists.map(({ album: a }) => {
    const { avgScore, rateCount, starCount } = computeStats(a.rates);
    return {
      id: a.id, name: a.name, aliases: a.aliases, image: a.image,
      publishedYear: a.publishedYear, publishedMonth: a.publishedMonth, publishedDay: a.publishedDay,
      createdAt: a.createdAt,
      artists: a.artists.map((ar) => ({ artist: ar.artist, role: ar.role })),
      tags: a.tags.map((tt) => tt.tag),
      trackCount: a._count.tracks, avgScore, rateCount, starCount,
    };
  });

  const members = artist.memberEntries.map((e) => e.member);
  const groups = artist.groupEntries.map((e) => e.group);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Overview ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden relative">
        {/* Edit/Delete — positioned at top of black section, not inside it */}
        {editable && (
          <div className="absolute top-[216px] right-4 z-10">
            <ArtistActions artistId={id} />
          </div>
        )}

        {/* Banner — top 60% */}
        <div className="relative h-52 bg-gradient-to-br from-gray-800 to-gray-900">
          {artist.banner && (
            <Image src={artist.banner} alt="" fill className="object-cover" />
          )}
        </div>

        {/* Black section — bottom 40% */}
        <div className="bg-black px-6 pb-8 text-center">
          {/* Profile image centered at the banner/black junction */}
          <div className="-mt-16 mb-4 flex justify-center">
            <div className="relative w-32 h-32 rounded-full ring-4 ring-black overflow-hidden bg-gray-700 flex-shrink-0">
              {artist.image ? (
                <Image src={artist.image} alt={artist.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {artist.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name + flag */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <h1 className="text-3xl font-bold text-white leading-tight">{artist.name}</h1>
            {artist.nation && (
              <FlagIcon code={artist.nation} className="w-7 h-auto rounded-sm flex-shrink-0" />
            )}
          </div>

          {/* Alias line */}
          {artist.isGroup ? (
            artist.aliases.length > 0 && (
              <p className="mt-1 text-sm text-white/55">{artist.aliases.join(", ")}</p>
            )
          ) : (
            (artist.aliases.length > 0 || groups.length > 0) && (
              <p className="mt-1 text-sm text-white/55">
                {artist.aliases.length > 0 && artist.aliases.join(", ")}
                {groups.length > 0 && (
                  <>
                    {artist.aliases.length > 0 && " "}
                    {"of "}
                    {groups.map((g, i) => (
                      <span key={g.id}>
                        {i > 0 && ", "}
                        <ArtistHoverCard artistId={g.id}>
                          <Link href={`/artists/${g.id}`} className="hover:text-white/90 underline underline-offset-2 transition-colors">
                            {g.name}
                          </Link>
                        </ArtistHoverCard>
                      </span>
                    ))}
                  </>
                )}
              </p>
            )
          )}

          {/* Tags */}
          {artist.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-3">
              {artist.tags.map((at) => (
                <Link key={at.tag.id} href={`/chart?tagId=${at.tag.id}`}>
                  <Badge variant="tag" className="!bg-white/15 !text-white/80 border border-white/20 hover:!bg-white/25 transition-colors">
                    {at.tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* External links */}
          <div className="mt-4 flex justify-center">
            <ExternalLinks links={{
              xUrl: artist.xUrl,
              instagramUrl: artist.instagramUrl,
              youtubeUrl: artist.youtubeUrl,
              youtubeMusicUrl: artist.youtubeMusicUrl,
              appleMusicUrl: artist.appleMusicUrl,
              soundcloudUrl: artist.soundcloudUrl,
            }} />
          </div>
        </div>

        {/* Members grid (group only) */}
        {artist.isGroup && members.length > 0 && (
          <div className="bg-black border-t border-white/10 px-6 py-6">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/40 mb-6">
              Members
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-8 gap-x-3 gap-y-5">
              {members.map((member) => (
                <Link
                  key={member.id}
                  href={`/artists/${member.id}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/10 bg-gray-800 flex-shrink-0 group-hover:ring-white/40 transition-all">
                    {member.image ? (
                      <Image src={member.image} alt={member.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60 text-base font-bold">
                        {member.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-white/60 text-xs text-center leading-tight group-hover:text-white/90 transition-colors line-clamp-2">
                    {member.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Albums ───────────────────────────────────────────────────── */}
      {albumItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Albums</h2>
            <Link
              href={`/chart?artistId=${id}&targetType=album`}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              Show all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {albumItems.map((album) => (
              <Link key={album.id} href={`/albums/${album.id}`} className="group block">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-200 mb-2">
                  {album.image ? (
                    <Image
                      src={album.image}
                      alt={album.name}
                      fill
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
                  {album.avgScore != null && (
                    <span className="font-bold text-indigo-600">{formatScore(album.avgScore)}</span>
                  )}
                  {album.publishedYear && <span>{formatPublishedDate(album.publishedYear)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Tracks ───────────────────────────────────────────────────── */}
      {trackItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Tracks</h2>
            <Link
              href={`/chart?artistId=${id}&targetType=track`}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              Show all
            </Link>
          </div>
          <div className="space-y-2">
            {trackItems.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
