import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (session.user.id !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, username, image, banner, blockColor, blockTextColor } = body as Record<string, string | null>;

  // Validate username format if provided
  if (username != null && username !== "") {
    if (!/^[a-zA-Z0-9_.-]{2,32}$/.test(username)) {
      return NextResponse.json({ error: "Username must be 2–32 chars (letters, numbers, _, -, .)" }, { status: 400 });
    }
    // Check uniqueness (excluding self)
    const existing = await prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" }, NOT: { id } } });
    if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name || null }),
      ...(username !== undefined && { username: username || null }),
      ...(image !== undefined && { image }),
      ...(banner !== undefined && { banner }),
      ...(blockColor !== undefined && { blockColor }),
      ...(blockTextColor !== undefined && { blockTextColor }),
    },
    select: { id: true, name: true, username: true, image: true, banner: true, blockColor: true, blockTextColor: true },
  });

  return NextResponse.json(user);
}
