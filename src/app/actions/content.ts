"use server";

import { prisma } from "@/lib/prisma";
import { getSessionRole, canEdit } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { maybeDeleteGCS } from "@/lib/imageCleanup";

export async function deleteTrack(trackId: string): Promise<void> {
  const role = await getSessionRole();
  if (!canEdit(role)) throw new Error("권한이 없습니다.");
  const track = await prisma.track.findUnique({ where: { id: trackId }, select: { image: true } });
  await prisma.track.delete({ where: { id: trackId } });
  await maybeDeleteGCS(track?.image);
  revalidatePath("/tracks");
  redirect("/tracks");
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const role = await getSessionRole();
  if (!canEdit(role)) throw new Error("권한이 없습니다.");
  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { image: true } });
  await prisma.album.delete({ where: { id: albumId } });
  await maybeDeleteGCS(album?.image);
  revalidatePath("/albums");
  redirect("/albums");
}

export async function deleteArtist(artistId: string): Promise<void> {
  const role = await getSessionRole();
  if (!canEdit(role)) throw new Error("권한이 없습니다.");
  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { image: true, banner: true } });
  await prisma.artist.delete({ where: { id: artistId } });
  await Promise.all([maybeDeleteGCS(artist?.image), maybeDeleteGCS(artist?.banner)]);
  revalidatePath("/artists");
  redirect("/artists");
}
