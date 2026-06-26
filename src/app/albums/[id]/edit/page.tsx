import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionRole, canEdit } from "@/lib/permissions";
import { AlbumEditClient } from "./AlbumEditClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await prisma.album.findUnique({ where: { id }, select: { name: true } });
  return { title: `수정 — ${album?.name ?? "Album"}` };
}

export default async function AlbumEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getSessionRole();

  if (!canEdit(role)) redirect(`/albums/${id}`);

  const album = await prisma.album.findUnique({
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
      tracks: {
        orderBy: [{ trackNumber: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          image: true,
          trackNumber: true,
          artists: {
            orderBy: { role: "asc" },
            select: { role: true, artist: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!album) notFound();

  return (
    <AlbumEditClient
      initialData={{
        id: album.id,
        name: album.name,
        aliases: album.aliases,
        image: album.image,
        publishedYear: album.publishedYear,
        publishedMonth: album.publishedMonth,
        publishedDay: album.publishedDay,
        youtubeUrl: album.youtubeUrl,
        youtubeMusicUrl: album.youtubeMusicUrl,
        appleMusicUrl: album.appleMusicUrl,
        soundcloudUrl: album.soundcloudUrl,
        artists: album.artists.map((aa) => ({
          id: aa.artist.id,
          name: aa.artist.name,
          role: aa.role,
          image: aa.artist.image,
          appleMusicUrl: aa.artist.appleMusicUrl,
          itunesArtistId: aa.artist.itunesArtistId,
          note: aa.note,
          showInOverview: aa.showInOverview,
        })),
        tags: album.tags.map((tt) => tt.tag),
        tracks: album.tracks,
      }}
    />
  );
}
