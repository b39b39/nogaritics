import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const userId = sp.get("userId");
  const trackId = sp.get("trackId");
  const albumId = sp.get("albumId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const rates = await prisma.rate.findMany({
    where: {
      userId,
      ...(trackId && { trackId }),
      ...(albumId && { albumId }),
    },
    include: {
      track: { select: { id: true, name: true, image: true } },
      album: { select: { id: true, name: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items: rates });
}
