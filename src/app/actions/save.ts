"use server";

import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

// ─── Input types ─────────────────────────────────────────────────────────────

export interface ArtistInput {
  id?: string;             // DB id — use directly if present
  itunesArtistId?: string; // dedup key from iTunes
  name: string;
  image?: string | null;
  appleMusicUrl?: string | null;
  role: "MAIN" | "FEAT" | "PROD";
}

export interface TrackInput {
  itunesTrackId?: string;
  name: string;
  trackNumber?: number;
  image?: string | null;
  publishedYear?: number | null;
  publishedMonth?: number | null;
  publishedDay?: number | null;
  appleMusicUrl?: string | null;
}

export interface AlbumInput {
  id?: string;
  itunesAlbumId?: string;
  name: string;
  aliases?: string[];
  image?: string | null;
  publishedYear?: number | null;
  publishedMonth?: number | null;
  publishedDay?: number | null;
  appleMusicUrl?: string | null;
  youtubeUrl?: string | null;
  youtubeMusicUrl?: string | null;
  soundcloudUrl?: string | null;
  artists: ArtistInput[];
  tracks: TrackInput[];  // full tracklist from iTunes for cascade creation
  tagIds?: string[];
}

export interface SaveTrackArgs {
  name: string;
  aliases: string[];
  image: string | null;
  trackNumber?: number;
  publishedYear: number | null;
  publishedMonth: number | null;
  publishedDay: number | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  youtubeMusicUrl: string | null;
  soundcloudUrl: string | null;
  itunesTrackId?: string;
  artists: ArtistInput[];
  album: AlbumInput | null;
  tagIds: string[];
}

export interface SaveAlbumArgs {
  name: string;
  aliases: string[];
  image: string | null;
  publishedYear: number | null;
  publishedMonth: number | null;
  publishedDay: number | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  youtubeMusicUrl: string | null;
  soundcloudUrl: string | null;
  itunesAlbumId?: string;
  artists: ArtistInput[];
  tracks: TrackInput[];
  existingTracks: { id: string; trackNumber?: number }[];
  tagIds: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveArtistId(a: ArtistInput): Promise<string> {
  if (a.id) return a.id;

  if (a.itunesArtistId) {
    const existing = await prisma.artist.findUnique({ where: { itunesArtistId: a.itunesArtistId } });
    if (existing) return existing.id;
    const created = await prisma.artist.create({
      data: { name: a.name, image: a.image ?? null, appleMusicUrl: a.appleMusicUrl ?? null, itunesArtistId: a.itunesArtistId },
    });
    return created.id;
  }

  throw new Error(`아티스트 "${a.name}" 는 DB에서 선택하거나 iTunes로 불러와야 합니다.`);
}

async function createMissingTracks(
  albumId: string,
  tracks: TrackInput[],
  artistIds: { id: string; role: "MAIN" | "FEAT" | "PROD" }[],
  skipItunesTrackId?: string,
) {
  for (const t of tracks) {
    if (skipItunesTrackId && t.itunesTrackId === skipItunesTrackId) continue;
    if (t.itunesTrackId) {
      const exists = await prisma.track.findUnique({ where: { itunesTrackId: t.itunesTrackId } });
      if (exists) {
        const updates: Record<string, unknown> = {};
        if (!exists.albumId) updates.albumId = albumId;
        if (exists.trackNumber == null && t.trackNumber != null) updates.trackNumber = t.trackNumber;
        if (Object.keys(updates).length > 0) {
          await prisma.track.update({ where: { id: exists.id }, data: updates });
        }
        continue;
      }
    }
    await prisma.track.create({
      data: {
        name: t.name,
        trackNumber: t.trackNumber ?? null,
        image: t.image ?? null,
        publishedYear: t.publishedYear ?? null,
        publishedMonth: t.publishedMonth ?? null,
        publishedDay: t.publishedDay ?? null,
        appleMusicUrl: t.appleMusicUrl ?? null,
        itunesTrackId: t.itunesTrackId,
        albumId,
        artists: { create: artistIds.map(a => ({ artistId: a.id, role: a.role })) },
      },
    });
  }
}

async function resolveAlbumId(
  albumInput: AlbumInput,
  fallbackArtistIds: { id: string; role: "MAIN" | "FEAT" | "PROD" }[],
  skipItunesTrackId?: string,
): Promise<string> {
  if (albumInput.id) {
    if (albumInput.tracks.length > 0) {
      await createMissingTracks(albumInput.id, albumInput.tracks, fallbackArtistIds, skipItunesTrackId);
    }
    return albumInput.id;
  }

  if (albumInput.itunesAlbumId) {
    const existing = await prisma.album.findUnique({ where: { itunesAlbumId: albumInput.itunesAlbumId } });
    if (existing) {
      if (albumInput.tracks.length > 0) {
        await createMissingTracks(existing.id, albumInput.tracks, fallbackArtistIds, skipItunesTrackId);
      }
      return existing.id;
    }
  }

  const albumArtistIds =
    albumInput.artists.length > 0
      ? await Promise.all(albumInput.artists.map(resolveArtistId)).then(ids =>
          ids.map((id, i) => ({ id, role: albumInput.artists[i].role }))
        )
      : fallbackArtistIds;

  const album = await prisma.album.create({
    data: {
      name: albumInput.name,
      aliases: albumInput.aliases ?? [],
      image: albumInput.image ?? null,
      publishedYear: albumInput.publishedYear ?? null,
      publishedMonth: albumInput.publishedMonth ?? null,
      publishedDay: albumInput.publishedDay ?? null,
      appleMusicUrl: albumInput.appleMusicUrl ?? null,
      youtubeUrl: albumInput.youtubeUrl ?? null,
      youtubeMusicUrl: albumInput.youtubeMusicUrl ?? null,
      soundcloudUrl: albumInput.soundcloudUrl ?? null,
      itunesAlbumId: albumInput.itunesAlbumId,
      artists: { create: albumArtistIds.map(a => ({ artistId: a.id, role: a.role })) },
      tags: { create: (albumInput.tagIds ?? []).map(tagId => ({ tagId })) },
    },
  });

  if (albumInput.tracks.length > 0) {
    await createMissingTracks(album.id, albumInput.tracks, albumArtistIds, skipItunesTrackId);
  }

  return album.id;
}

// ─── Public actions ───────────────────────────────────────────────────────────

export async function saveTrack(input: SaveTrackArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const role = await getSessionRole();
  if (role !== "ADMIN" && role !== "EDITOR") return { ok: false, error: "권한이 없습니다." };

  try {
    if (input.itunesTrackId) {
      const existing = await prisma.track.findUnique({ where: { itunesTrackId: input.itunesTrackId } });
      if (existing) { revalidatePath("/tracks"); return { ok: true, id: existing.id }; }
    }

    const artistIds = await Promise.all(input.artists.map(resolveArtistId));
    const artistIdsWithRole = artistIds.map((id, i) => ({ id, role: input.artists[i].role }));

    let albumId: string | null = null;
    if (input.album) {
      albumId = await resolveAlbumId(input.album, artistIdsWithRole, input.itunesTrackId);
    }

    // Re-check after album cascade (track might have been created inside createMissingTracks)
    if (input.itunesTrackId) {
      const existing = await prisma.track.findUnique({ where: { itunesTrackId: input.itunesTrackId } });
      if (existing) { revalidatePath("/tracks"); return { ok: true, id: existing.id }; }
    }

    const track = await prisma.track.create({
      data: {
        name: input.name,
        aliases: input.aliases,
        image: input.image,
        trackNumber: input.trackNumber ?? null,
        publishedYear: input.publishedYear,
        publishedMonth: input.publishedMonth,
        publishedDay: input.publishedDay,
        appleMusicUrl: input.appleMusicUrl,
        youtubeUrl: input.youtubeUrl,
        youtubeMusicUrl: input.youtubeMusicUrl,
        soundcloudUrl: input.soundcloudUrl,
        itunesTrackId: input.itunesTrackId,
        albumId,
        artists: { create: artistIdsWithRole.map(a => ({ artistId: a.id, role: a.role })) },
        tags: { create: input.tagIds.map(tagId => ({ tagId })) },
      },
    });

    revalidatePath("/tracks");
    return { ok: true, id: track.id };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}

export async function saveAlbum(input: SaveAlbumArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const role = await getSessionRole();
  if (role !== "ADMIN" && role !== "EDITOR") return { ok: false, error: "권한이 없습니다." };

  try {
    if (input.itunesAlbumId) {
      const existing = await prisma.album.findUnique({ where: { itunesAlbumId: input.itunesAlbumId } });
      if (existing) { revalidatePath("/albums"); return { ok: true, id: existing.id }; }
    }

    const artistIds = await Promise.all(input.artists.map(resolveArtistId));
    const artistIdsWithRole = artistIds.map((id, i) => ({ id, role: input.artists[i].role }));

    const album = await prisma.album.create({
      data: {
        name: input.name,
        aliases: input.aliases,
        image: input.image,
        publishedYear: input.publishedYear,
        publishedMonth: input.publishedMonth,
        publishedDay: input.publishedDay,
        appleMusicUrl: input.appleMusicUrl,
        youtubeUrl: input.youtubeUrl,
        youtubeMusicUrl: input.youtubeMusicUrl,
        soundcloudUrl: input.soundcloudUrl,
        itunesAlbumId: input.itunesAlbumId,
        artists: { create: artistIdsWithRole.map(a => ({ artistId: a.id, role: a.role })) },
        tags: { create: input.tagIds.map(tagId => ({ tagId })) },
      },
    });

    await createMissingTracks(album.id, input.tracks, artistIdsWithRole);

    const newAlbum = { publishedYear: input.publishedYear, publishedMonth: input.publishedMonth, publishedDay: input.publishedDay };
    for (const entry of input.existingTracks) {
      const track = await prisma.track.findUnique({
        where: { id: entry.id },
        select: { albumId: true, album: { select: { publishedYear: true, publishedMonth: true, publishedDay: true } } },
      });
      let targetAlbumId = album.id;
      if (track?.albumId && track.albumId !== album.id && track.album) {
        if (saveAlbumTimestamp(track.album) < saveAlbumTimestamp(newAlbum)) {
          targetAlbumId = track.albumId;
        }
      }
      await prisma.track.update({
        where: { id: entry.id },
        data: { albumId: targetAlbumId, trackNumber: entry.trackNumber ?? null },
      });
    }

    revalidatePath("/albums");
    return { ok: true, id: album.id };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}

function saveAlbumTimestamp(a: { publishedYear: number | null; publishedMonth: number | null; publishedDay: number | null }): number {
  if (!a.publishedYear) return 99990000;
  return a.publishedYear * 10000 + (a.publishedMonth ?? 12) * 100 + (a.publishedDay ?? 31);
}
