import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAlbums } from "@/lib/queries";
import { requireEditor } from "@/lib/permissions";
import { searchIdsByQuery, applyRankSort } from "@/lib/dbSearch";
import type { ChartFilter, PageSize, SortBy, SortOrder } from "@/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const itunesAlbumIds = sp.get("itunesAlbumIds")
    ? sp.get("itunesAlbumIds")!.split(",").filter(Boolean)
    : null;

  if (itunesAlbumIds) {
    const albums = await prisma.album.findMany({
      where: { itunesAlbumId: { in: itunesAlbumIds } },
      select: { id: true, name: true, image: true, itunesAlbumId: true, appleMusicUrl: true },
    });
    return NextResponse.json({ items: albums });
  }

  const q = sp.get("q");
  const isModalSearch = q && !sp.get("sortBy") && !sp.get("artistId") && !sp.get("tagId") && !sp.get("ratedBy") && !sp.get("starredBy");

  if (isModalSearch) {
    const pageSize = sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 10;
    const ranked = await searchIdsByQuery("Album", q, pageSize);
    if (ranked.length === 0) return NextResponse.json({ items: [] });
    const albums = await prisma.album.findMany({
      where: { id: { in: ranked.map((r) => r.id) } },
      select: { id: true, name: true, aliases: true, image: true, itunesAlbumId: true, appleMusicUrl: true },
    });
    return NextResponse.json({ items: applyRankSort(albums, ranked) });
  }

  const filter: ChartFilter = {
    q: q ?? undefined,
    artistId: sp.get("artistId") ?? undefined,
    tagId: sp.get("tagId") ?? undefined,
    ratedBy: sp.get("ratedBy") ?? undefined,
    starredBy: sp.get("starredBy") ?? undefined,
    sortBy: (sp.get("sortBy") as SortBy) ?? "recently",
    sortOrder: (sp.get("sortOrder") as SortOrder) ?? "desc",
    page: sp.get("page") ? parseInt(sp.get("page")!) : 1,
    pageSize: (sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 30) as PageSize,
  };
  const result = await getAlbums(filter);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const denied = await requireEditor();
  if (denied) return denied;

  const body = await req.json();
  const {
    name, aliases = [], artistIds = [], tagIds = [], image,
    publishedYear, publishedMonth, publishedDay,
    youtubeUrl, youtubeMusicUrl, appleMusicUrl, soundcloudUrl,
  } = body;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const album = await prisma.album.create({
    data: {
      name,
      aliases,
      image: image ?? null,
      publishedYear: publishedYear ?? null,
      publishedMonth: publishedMonth ?? null,
      publishedDay: publishedDay ?? null,
      youtubeUrl: youtubeUrl || null,
      youtubeMusicUrl: youtubeMusicUrl || null,
      appleMusicUrl: appleMusicUrl || null,
      soundcloudUrl: soundcloudUrl || null,
      artists: {
        create: artistIds.map(({ id, role }: { id: string; role: string }) => ({
          artistId: id,
          role,
        })),
      },
      tags: {
        create: tagIds.map((tagId: string) => ({ tagId })),
      },
    },
  });

  return NextResponse.json(album, { status: 201 });
}
