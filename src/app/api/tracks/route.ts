import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchIdsByQuery, applyRankSort } from "@/lib/dbSearch";

const artistSelect = {
  orderBy: { role: "asc" as const },
  select: { role: true, artist: { select: { name: true } } },
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const itunesTrackIds = sp.get("itunesTrackIds")
    ? sp.get("itunesTrackIds")!.split(",").filter(Boolean)
    : null;

  if (itunesTrackIds) {
    const tracks = await prisma.track.findMany({
      where: { itunesTrackId: { in: itunesTrackIds } },
      select: { id: true, name: true, image: true, itunesTrackId: true, artists: artistSelect },
    });
    return NextResponse.json({ items: tracks });
  }

  const q = sp.get("q");
  const page = sp.get("page") ? parseInt(sp.get("page")!) : 1;
  const pageSize = sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 10;

  if (q) {
    const ranked = await searchIdsByQuery("Track", q, pageSize);
    if (ranked.length === 0) return NextResponse.json({ items: [] });
    const tracks = await prisma.track.findMany({
      where: { id: { in: ranked.map((r) => r.id) } },
      select: { id: true, name: true, aliases: true, image: true, itunesTrackId: true, artists: artistSelect },
    });
    return NextResponse.json({ items: applyRankSort(tracks, ranked) });
  }

  const tracks = await prisma.track.findMany({
    select: { id: true, name: true, image: true, itunesTrackId: true, artists: artistSelect },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items: tracks });
}
