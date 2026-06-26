import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.artist.findMany({
    where: { nation: { not: null } },
    select: { nation: true },
    distinct: ["nation"],
    orderBy: { nation: "asc" },
  });

  const items = rows.map((r) => r.nation!).filter(Boolean);
  return NextResponse.json({ items });
}
