import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      aliases: true,
      image: true,
      artists: {
        where: { showInOverview: true },
        select: { artist: { select: { id: true, name: true } } },
      },
      tags: { select: { tag: { select: { id: true, name: true } } } },
    },
  });
  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(album);
}
