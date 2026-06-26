import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionRole, canEdit } from "@/lib/permissions";
import { TrackEditClient } from "./TrackEditClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = await prisma.track.findUnique({ where: { id }, select: { name: true } });
  return { title: `수정 — ${track?.name ?? "Track"}` };
}

export default async function TrackEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getSessionRole();

  if (!canEdit(role)) redirect(`/tracks/${id}`);

  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      artists: {
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              image: true,
              appleMusicUrl: true,
              itunesArtistId: true,
            },
          },
        },
        orderBy: { role: "asc" },
      },
      tags: {
        include: { tag: { select: { id: true, name: true } } },
      },
      album: { select: { id: true, name: true, image: true } },
    },
  });

  if (!track) notFound();

  return (
    <TrackEditClient
      initialData={{
        id: track.id,
        name: track.name,
        aliases: track.aliases,
        image: track.image,
        publishedYear: track.publishedYear,
        publishedMonth: track.publishedMonth,
        publishedDay: track.publishedDay,
        youtubeUrl: track.youtubeUrl,
        youtubeMusicUrl: track.youtubeMusicUrl,
        appleMusicUrl: track.appleMusicUrl,
        soundcloudUrl: track.soundcloudUrl,
        album: track.album,
        artists: track.artists.map((ta) => ({
          id: ta.artist.id,
          name: ta.artist.name,
          role: ta.role,
          image: ta.artist.image,
          appleMusicUrl: ta.artist.appleMusicUrl,
          itunesArtistId: ta.artist.itunesArtistId,
          note: ta.note,
          showInOverview: ta.showInOverview,
        })),
        tags: track.tags.map((tt) => tt.tag),
      }}
    />
  );
}
