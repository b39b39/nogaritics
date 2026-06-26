import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CoverImage } from "@/components/ui/CoverImage";
import { Badge } from "@/components/ui/Badge";
import { ArtistCreditDisplay } from "@/components/music/ArtistCreditDisplay";
import { TrackActions } from "@/components/music/TrackActions";
import { RateForm } from "@/components/music/RateForm";
import { RateList } from "@/components/music/RateList";
import { PlatformLinks } from "@/components/ui/PlatformLinks";
import { formatPublishedDate } from "@/lib/utils";
import { computeStats, artistInclude, tagInclude } from "@/lib/queries";
import { getSessionRole, canEdit } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = await prisma.track.findUnique({ where: { id }, select: { name: true } });
  return { title: track?.name ?? "Track" };
}

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, role] = await Promise.all([auth(), getSessionRole()]);

  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      ...artistInclude,
      ...tagInclude,
      album: { select: { id: true, name: true, image: true } },
      rates: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!track) notFound();

  const myRate = session?.user?.id
    ? (track.rates.find((r) => r.userId === session.user!.id) ?? null)
    : null;

  const { starCount } = computeStats(track.rates);
  const artists = track.artists.map((a) => ({
    artist: a.artist,
    role: a.role,
    note: a.note,
    showInOverview: a.showInOverview,
  }));

  const publishedDate = formatPublishedDate(track.publishedYear, track.publishedMonth, track.publishedDay);
  const displayDate = publishedDate !== "Unknown" ? publishedDate : null;
  const coverSrc = track.image ?? track.album?.image ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Overview */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* 블러 배경 */}
        {coverSrc ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${coverSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: "scale(1.15)",
              filter: "blur(22px) brightness(0.28)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}

        {/* 컨텐츠 */}
        <div className="relative z-10 p-6 flex gap-6">
          {/* Left: 커버 이미지 */}
          <CoverImage
            src={coverSrc}
            alt={track.name}
            size="lg"
            className="flex-shrink-0 ring-1 ring-white/10"
          />

          {/* Center: 정보 */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white mb-1">{track.name}</h1>
            {track.aliases.length > 0 && (
              <p className="text-sm text-white/55 mb-2">{track.aliases.join(", ")}</p>
            )}
            <ArtistCreditDisplay credits={artists} />
            {track.album && (
              <Link
                href={`/albums/${track.album.id}`}
                className="block mt-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                {track.album.name}
              </Link>
            )}
            {displayDate && (
              <p className="text-sm text-white/55 mt-1">{displayDate}</p>
            )}
            {track.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {track.tags.map((tt) => (
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
                youtubeUrl: track.youtubeUrl,
                youtubeMusicUrl: track.youtubeMusicUrl,
                appleMusicUrl: track.appleMusicUrl,
                soundcloudUrl: track.soundcloudUrl,
              }} />
            </div>
          </div>

          {/* Right: 인터랙션 버튼 */}
          <TrackActions
            trackId={track.id}
            canEdit={canEdit(role)}
            initialStarred={myRate?.starred ?? false}
            isLoggedIn={!!session?.user}
          />
        </div>
      </div>

      {/* 나의 리뷰 */}
      {session?.user ? (
        <RateForm
          targetId={track.id}
          targetType="track"
          existingRate={myRate ? { score: myRate.score, comment: myRate.comment, starred: myRate.starred } : null}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-400">
          <Link href="/auth/signin" className="text-indigo-600 hover:underline">로그인</Link>하여 리뷰를 남기세요
        </div>
      )}

      {/* 리뷰 목록 */}
      <RateList rates={track.rates} currentUserId={session?.user?.id} />
    </div>
  );
}
