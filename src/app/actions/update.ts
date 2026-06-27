"use server";

import { prisma } from "@/lib/prisma";
import { getSessionRole, canEdit } from "@/lib/permissions";
import { maybeDeleteR2 } from "@/lib/imageCleanup";
import type { SelectedAlbum } from "@/types";

// ─── Album update ─────────────────────────────────────────────────────────────

export interface UpdateAlbumTrackEntry {
  id: string | null;
  trackNumber: number;
  itunesTrackId?: string;
  name?: string;
  image?: string | null;
  itunesArtistId?: string;
  artistName?: string;
  appleMusicUrl?: string | null;
}

export interface UpdateAlbumInput {
  name: string;
  aliases: string[];
  image: string | null;
  publishedYear: number | null;
  publishedMonth: number | null;
  publishedDay: number | null;
  youtubeUrl: string | null;
  youtubeMusicUrl: string | null;
  appleMusicUrl: string | null;
  soundcloudUrl: string | null;
  artists: ArtistUpdateInput[];
  tagIds: string[];
  tracks: UpdateAlbumTrackEntry[];
}

function albumTimestamp(year: number | null, month: number | null, day: number | null): number {
  if (!year) return 99990000;
  return year * 10000 + (month ?? 12) * 100 + (day ?? 31);
}

function isEarlierAlbum(
  a: { publishedYear: number | null; publishedMonth: number | null; publishedDay: number | null },
  b: { publishedYear: number | null; publishedMonth: number | null; publishedDay: number | null },
): boolean {
  return albumTimestamp(a.publishedYear, a.publishedMonth, a.publishedDay) <
    albumTimestamp(b.publishedYear, b.publishedMonth, b.publishedDay);
}

export async function updateAlbum(
  albumId: string,
  input: UpdateAlbumInput,
): Promise<{ ok: boolean; error?: string }> {
  const role = await getSessionRole();
  if (!canEdit(role)) return { ok: false, error: "권한이 없습니다." };

  try {
    const artistIds = await Promise.all(input.artists.map(resolveArtistId));
    const artistsWithRole = artistIds.map((id, i) => ({
      artistId: id,
      role: input.artists[i].role,
      note: input.artists[i].note ?? null,
      showInOverview: input.artists[i].showInOverview ?? true,
    }));

    const currentAlbum = await prisma.album.findUnique({
      where: { id: albumId },
      select: { image: true, publishedYear: true, publishedMonth: true, publishedDay: true },
    });
    if (!currentAlbum) throw new Error("앨범을 찾을 수 없습니다.");

    await prisma.albumArtist.deleteMany({ where: { albumId } });
    await prisma.albumTag.deleteMany({ where: { albumId } });
    await prisma.album.update({
      where: { id: albumId },
      data: {
        name: input.name,
        aliases: input.aliases,
        image: input.image,
        publishedYear: input.publishedYear,
        publishedMonth: input.publishedMonth,
        publishedDay: input.publishedDay,
        youtubeUrl: input.youtubeUrl,
        youtubeMusicUrl: input.youtubeMusicUrl,
        appleMusicUrl: input.appleMusicUrl,
        soundcloudUrl: input.soundcloudUrl,
        artists: { create: artistsWithRole },
        tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
      },
    });

    const currentTracks = await prisma.track.findMany({
      where: { albumId },
      select: { id: true },
    });
    const currentTrackIds = new Set(currentTracks.map((t) => t.id));
    const finalTrackIds = new Set<string>();

    for (const t of input.tracks) {
      let trackId = t.id;

      if (!trackId && t.itunesTrackId) {
        const existing = await prisma.track.findUnique({ where: { itunesTrackId: t.itunesTrackId } });
        if (existing) {
          trackId = existing.id;
        } else if (t.name && t.itunesArtistId) {
          let artistId: string;
          const existingArtist = await prisma.artist.findUnique({ where: { itunesArtistId: t.itunesArtistId } });
          if (existingArtist) {
            artistId = existingArtist.id;
          } else {
            const newArtist = await prisma.artist.create({
              data: { name: t.artistName ?? "Unknown", itunesArtistId: t.itunesArtistId },
            });
            artistId = newArtist.id;
          }
          const newTrack = await prisma.track.create({
            data: {
              name: t.name,
              image: t.image ?? null,
              appleMusicUrl: t.appleMusicUrl ?? null,
              itunesTrackId: t.itunesTrackId,
              trackNumber: t.trackNumber,
              albumId,
              artists: { create: [{ artistId, role: "MAIN" }] },
            },
          });
          finalTrackIds.add(newTrack.id);
          continue;
        }
      }

      if (!trackId) continue;
      finalTrackIds.add(trackId);

      let newAlbumId = albumId;

      if (!currentTrackIds.has(trackId)) {
        const track = await prisma.track.findUnique({
          where: { id: trackId },
          select: {
            albumId: true,
            album: { select: { publishedYear: true, publishedMonth: true, publishedDay: true } },
          },
        });

        if (track?.albumId && track.albumId !== albumId && track.album) {
          if (isEarlierAlbum(track.album, currentAlbum)) {
            newAlbumId = track.albumId;
          }
        }
      }

      await prisma.track.update({
        where: { id: trackId },
        data: { trackNumber: t.trackNumber, albumId: newAlbumId },
      });
    }

    const toUnlink = [...currentTrackIds].filter((id) => !finalTrackIds.has(id));
    if (toUnlink.length > 0) {
      await prisma.track.updateMany({
        where: { id: { in: toUnlink } },
        data: { albumId: null, trackNumber: null },
      });
    }

    if (currentAlbum.image !== input.image) await maybeDeleteR2(currentAlbum.image);

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}

export interface ArtistUpdateInput {
  id: string | null;
  itunesArtistId?: string;
  name: string;
  image?: string | null;
  appleMusicUrl?: string | null;
  role: "MAIN" | "FEAT" | "PROD";
  note?: string | null;
  showInOverview?: boolean;
}

export interface UpdateTrackInput {
  name: string;
  aliases: string[];
  image: string | null;
  publishedYear: number | null;
  publishedMonth: number | null;
  publishedDay: number | null;
  youtubeUrl: string | null;
  youtubeMusicUrl: string | null;
  appleMusicUrl: string | null;
  soundcloudUrl: string | null;
  album: SelectedAlbum | null;
  artists: ArtistUpdateInput[];
  tagIds: string[];
}

async function resolveArtistId(a: ArtistUpdateInput): Promise<string> {
  if (a.id) return a.id;
  if (a.itunesArtistId) {
    const existing = await prisma.artist.findUnique({ where: { itunesArtistId: a.itunesArtistId } });
    if (existing) return existing.id;
    const created = await prisma.artist.create({
      data: { name: a.name, image: a.image ?? null, appleMusicUrl: a.appleMusicUrl ?? null, itunesArtistId: a.itunesArtistId },
    });
    return created.id;
  }
  throw new Error(`아티스트 "${a.name}"를 찾을 수 없습니다.`);
}

async function resolveAlbumId(album: SelectedAlbum): Promise<string | null> {
  if (album.id) return album.id;
  if (album.itunesAlbumId) {
    const existing = await prisma.album.findUnique({ where: { itunesAlbumId: album.itunesAlbumId } });
    if (existing) return existing.id;
    const created = await prisma.album.create({
      data: {
        name: album.name,
        image: album.image ?? null,
        appleMusicUrl: album.appleMusicUrl ?? null,
        itunesAlbumId: album.itunesAlbumId,
      },
    });
    return created.id;
  }
  return null;
}

export async function updateTrack(
  id: string,
  input: UpdateTrackInput,
): Promise<{ ok: boolean; error?: string }> {
  const role = await getSessionRole();
  if (!canEdit(role)) return { ok: false, error: "권한이 없습니다." };

  try {
    const oldTrack = await prisma.track.findUnique({ where: { id }, select: { image: true } });

    const [artistIds, albumId] = await Promise.all([
      Promise.all(input.artists.map(resolveArtistId)),
      input.album ? resolveAlbumId(input.album) : null,
    ]);

    const artistsWithRole = artistIds.map((artistId, i) => ({
      artistId,
      role: input.artists[i].role,
      note: input.artists[i].note ?? null,
      showInOverview: input.artists[i].showInOverview ?? true,
    }));

    await prisma.trackArtist.deleteMany({ where: { trackId: id } });
    await prisma.trackTag.deleteMany({ where: { trackId: id } });
    await prisma.track.update({
      where: { id },
      data: {
        name: input.name,
        aliases: input.aliases,
        image: input.image,
        publishedYear: input.publishedYear,
        publishedMonth: input.publishedMonth,
        publishedDay: input.publishedDay,
        youtubeUrl: input.youtubeUrl,
        youtubeMusicUrl: input.youtubeMusicUrl,
        appleMusicUrl: input.appleMusicUrl,
        soundcloudUrl: input.soundcloudUrl,
        albumId,
        artists: { create: artistsWithRole },
        tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
      },
    });

    if (oldTrack?.image !== input.image) await maybeDeleteR2(oldTrack?.image);

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}

// ─── Artist update ────────────────────────────────────────────────────────────

export interface UpdateArtistInput {
  name: string;
  aliases: string[];
  isGroup: boolean;
  nation: string | null;
  image: string | null;
  banner: string | null;
  tagIds: string[];
  memberIds: string[];
  xUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  youtubeMusicUrl: string | null;
  appleMusicUrl: string | null;
  soundcloudUrl: string | null;
}

export async function updateArtist(
  id: string,
  input: UpdateArtistInput,
): Promise<{ ok: boolean; error?: string }> {
  const role = await getSessionRole();
  if (!canEdit(role)) return { ok: false, error: "권한이 없습니다." };

  try {
    const oldArtist = await prisma.artist.findUnique({ where: { id }, select: { image: true, banner: true } });

    await prisma.artistTag.deleteMany({ where: { artistId: id } });
    await prisma.artistMember.deleteMany({ where: { groupId: id } });
    await prisma.artist.update({
      where: { id },
      data: {
        name: input.name,
        aliases: input.aliases,
        isGroup: input.isGroup,
        nation: input.nation,
        image: input.image,
        banner: input.banner,
        xUrl: input.xUrl,
        instagramUrl: input.instagramUrl,
        youtubeUrl: input.youtubeUrl,
        youtubeMusicUrl: input.youtubeMusicUrl,
        appleMusicUrl: input.appleMusicUrl,
        soundcloudUrl: input.soundcloudUrl,
        tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
        ...(input.isGroup && input.memberIds.length > 0 && {
          memberEntries: {
            create: input.memberIds.map((memberId) => ({ memberId })),
          },
        }),
      },
    });

    await Promise.all([
      oldArtist?.image !== input.image ? maybeDeleteR2(oldArtist?.image) : Promise.resolve(),
      oldArtist?.banner !== input.banner ? maybeDeleteR2(oldArtist?.banner) : Promise.resolve(),
    ]);

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}
