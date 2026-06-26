import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? undefined;

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    select: {
      id: true,
      name: true,
      parentId: true,
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json({ items: tags });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, parentId, siblingIds = [] } = body;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  // Check name uniqueness
  const existing = await prisma.tag.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "Tag name already exists" }, { status: 409 });

  const tag = await prisma.tag.create({
    data: {
      name,
      parentId: parentId ?? null,
    },
  });

  // Add sibling edges (store with smaller id first)
  if (siblingIds.length > 0) {
    await prisma.tagSibling.createMany({
      data: siblingIds.map((sibId: string) => {
        const [a, b] = [tag.id, sibId].sort();
        return { tagAId: a, tagBId: b };
      }),
      skipDuplicates: true,
    });
  }

  return NextResponse.json(tag, { status: 201 });
}
