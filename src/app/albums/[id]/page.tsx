import { notFound } from "next/navigation";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CoverImage } from "@/components/ui/CoverImage";
import { Badge } from "@/components/ui/Badge";
import { ArtistCreditDisplay } from "@/components/music/ArtistCreditDisplay";
import { AlbumActions } from "@/components/music/AlbumActions";
import { RateForm } from "@/components/music/RateForm";
import { RateList } from "@/components/music/RateList";
import { PlatformLinks } from "@/components/ui/PlatformLinks";
import { ArtistHoverCard } from "@/components/music/ArtistHoverCard";
import { formatPublishedDate, formatScore } from "@/lib/utils";
import { tagInclude } from "@/lib/queries";
import { getSessionRole, canEdit } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await prisma.album.findUnique({ where: { id }, select: { name: true } });
  return { title: album?.name ?? "Album" };
}

export default async function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, role] = await Promise.all([auth(), getSessionRole()]);
  const userId = session?.user?.id;

  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      artists: {
        orderBy: { role: "asc" },
        select: {
          role: true,
          note: true,
          showInOverview: true,
          artist: { select: { id: true, name: true, image: true, nation: true, isGroup: true } },
        },
      },
      ...tagInclude,
      tracks: {
        orderBy: [{ trackNumber: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          artists: {
            orderBy: { role: "asc" },
            select: {
              role: true,
              note: true,
              showInOverview: true,
              artist: { select: { id: true, name: true } },
            },
          },
          rates: {
            where: { userId: userId ?? "__no_user__" },
            select: { score: true, starred: true },
            take: 1,
          },
        },
      },
      rates: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!album) notFound();

  const myRate = userId ? (album.rates.find((r) => r.userId === userId) ?? null) : null;

  const artists = album.artists.map((a) => ({
    artist: a.artist,
    role: a.role,
    note: a.note,
    showInOverview: a.showInOverview,
  }));

  const publishedDate = formatPublishedDate(album.publishedYear, album.publishedMonth, album.publishedDay);
  const displayDate = publishedDate !== "Unknown" ? publishedDate : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Overview + Track list */}
      <div className="relative rounded-2xl overflow-hidden">
        {album.image ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${album.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: "scale(1.15)",
              filter: "blur(22px) brightness(0.28)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}

        <div className="relative z-10 p-6 flex gap-6">
          <CoverImage
            src={album.image}
            alt={album.name}
            size="lg"
            className="flex-shrink-0 ring-1 ring-white/10"
          />

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white mb-1">{album.name}</h1>
            {album.aliases.length > 0 && (
              <p className="text-sm text-white/55 mb-2">{album.aliases.join(", ")}</p>
            )}
            <ArtistCreditDisplay credits={artists} />
            {displayDate && (
              <p className="text-sm text-white/55 mt-1">{displayDate}</p>
            )}
            {album.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {album.tags.map((tt) => (
                  <Link key={tt.tag.id} href={`/chart?tagId=${tt.tag.id}`}>
                    <Badge variant="tag" className="!bg-white/15 !text-white/90 border border-white/20">
                      {tt.tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-3">
              <PlatformLinks links={{
                youtubeUrl: album.youtubeUrl,
                youtubeMusicUrl: album.youtubeMusicUrl,
                appleMusicUrl: album.appleMusicUrl,
                soundcloudUrl: album.soundcloudUrl,
              }} />
            </div>
          </div>

          <AlbumActions
            albumId={album.id}
            canEdit={canEdit(role)}
            initialStarred={myRate?.starred ?? false}
            isLoggedIn={!!userId}
          />
        </div>

        {/* Track list */}
        {album.tracks.length > 0 && (
        <div className="relative z-10 border-t border-white/10">
          <table className="w-full">
            <tbody>
              {album.tracks.map((track, i) => {
                const overviewArtists = track.artists.filter((a) => a.showInOverview);
                const myTrackRate = track.rates[0] ?? null;

                return (
                  <tr
                    key={track.id}
                    className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="pl-5 pr-3 py-3 w-8 text-right text-xs text-white/35 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="py-3 pr-4 min-w-0 max-w-0 w-1/3">
                      <Link href={`/tracks/${track.id}`} className="text-sm font-medium text-white/90 hover:text-white transition-colors truncate block">
                        {track.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 min-w-0 max-w-0 w-1/2">
                      <span className="text-sm text-white/50 truncate block">
                        {overviewArtists.map((a, i) => (
                          <span key={a.artist.id}>
                            {i > 0 && ", "}
                            <ArtistHoverCard artistId={a.artist.id}>
                              <Link href={`/artists/${a.artist.id}`} className="hover:text-white/80 transition-colors">
                                {a.artist.name}
                              </Link>
                            </ArtistHoverCard>
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-16 text-right">
                      {myTrackRate?.score != null && (
                        <span className="text-sm font-semibold text-white/80 tabular-nums">
                          {formatScore(myTrackRate.score)}
                        </span>
                      )}
                    </td>
                    <td className="pr-5 py-3 w-8 text-center">
                      {myTrackRate?.starred && (
                        <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 inline-block" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* 나의 리뷰 */}
      {userId ? (
        <RateForm
          targetId={album.id}
          targetType="album"
          existingRate={myRate ? { score: myRate.score, comment: myRate.comment, starred: myRate.starred } : null}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-400">
          <Link href="/auth/signin" className="text-indigo-600 hover:underline">로그인</Link>하여 리뷰를 남기세요
        </div>
      )}

      <RateList rates={album.rates} currentUserId={userId} />
    </div>
  );
}
