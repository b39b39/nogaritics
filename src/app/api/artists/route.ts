import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/permissions";
import { searchIdsByQuery, applyRankSort } from "@/lib/dbSearch";
import type { PageSize } from "@/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? undefined;
  const page = sp.get("page") ? parseInt(sp.get("page")!) : 1;
  const pageSize = (sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 30) as PageSize;

  const itunesArtistIds = sp.get("itunesArtistIds")
    ? sp.get("itunesArtistIds")!.split(",").filter(Boolean)
    : null;

  if (itunesArtistIds) {
    const artists = await prisma.artist.findMany({
      where: { itunesArtistId: { in: itunesArtistIds } },
      select: { id: true, name: true, image: true, itunesArtistId: true, appleMusicUrl: true },
    });
    return NextResponse.json({ items: artists });
  }

  if (q) {
    const ranked = await searchIdsByQuery("Artist", q, pageSize);
    if (ranked.length === 0) return NextResponse.json({ items: [], total: 0 });
    const artists = await prisma.artist.findMany({
      where: { id: { in: ranked.map((r) => r.id) } },
      select: { id: true, name: true, aliases: true, image: true, nation: true, isGroup: true, itunesArtistId: true, appleMusicUrl: true },
    });
    return NextResponse.json({ items: applyRankSort(artists, ranked), total: artists.length });
  }

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({
      select: { id: true, name: true, aliases: true, image: true, nation: true, isGroup: true, itunesArtistId: true, appleMusicUrl: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.artist.count(),
  ]);

  return NextResponse.json({ items: artists, total });
}

export async function POST(req: NextRequest) {
  const denied = await requireEditor();
  if (denied) return denied;

  const body = await req.json();
  const {
    name, aliases = [], isGroup = false, nation, image, banner,
    memberIds = [], tagIds = [], itunesArtistId,
    xUrl, instagramUrl, youtubeUrl, soundcloudUrl, appleMusicUrl, youtubeMusicUrl,
  } = body;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const artist = await prisma.artist.create({
    data: {
      name,
      aliases,
      isGroup,
      nation: nation ?? null,
      image: image ?? null,
      banner: banner ?? null,
      itunesArtistId: itunesArtistId ?? null,
      xUrl: xUrl || null,
      instagramUrl: instagramUrl || null,
      youtubeUrl: youtubeUrl || null,
      soundcloudUrl: soundcloudUrl || null,
      appleMusicUrl: appleMusicUrl || null,
      youtubeMusicUrl: youtubeMusicUrl || null,
      ...(isGroup && memberIds.length > 0 && {
        memberEntries: {
          create: memberIds.map((memberId: string) => ({ memberId })),
        },
      }),
      tags: {
        create: tagIds.map((tagId: string) => ({ tagId })),
      },
    },
  });

  return NextResponse.json(artist, { status: 201 });
}
