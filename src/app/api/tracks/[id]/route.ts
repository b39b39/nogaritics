import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = await prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      aliases: true,
      image: true,
      album: { select: { id: true, name: true, image: true } },
      artists: {
        where: { showInOverview: true },
        select: { artist: { select: { id: true, name: true } } },
      },
      tags: { select: { tag: { select: { id: true, name: true } } } },
    },
  });
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(track);
}
