import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 1) return NextResponse.json({ items: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { discordId: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, image: true },
    take: 10,
  });

  return NextResponse.json({ items: users });
}
