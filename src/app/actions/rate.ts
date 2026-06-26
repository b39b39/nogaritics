"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RateInput {
  targetId: string;
  targetType: "track" | "album";
  score?: number | null;
  comment?: string | null;
  starred?: boolean;
  _delete?: boolean;
}

export async function toggleStarred(
  targetId: string,
  targetType: "track" | "album",
  starred: boolean,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  const userId = session.user.id;
  try {
    if (targetType === "track") {
      await prisma.rate.upsert({
        where: { userId_trackId: { userId, trackId: targetId } },
        update: { starred },
        create: { userId, trackId: targetId, starred, score: null, comment: null },
      });
    } else {
      await prisma.rate.upsert({
        where: { userId_albumId: { userId, albumId: targetId } },
        update: { starred },
        create: { userId, albumId: targetId, starred, score: null, comment: null },
      });
    }
    revalidatePath(`/${targetType}s/${targetId}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function submitRate(input: RateInput): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "You must be signed in." };
  }

  const { targetId, targetType, score, comment, starred = false, _delete = false } = input;

  if (score != null && (score < 0 || score > 5)) {
    return { ok: false, message: "Score must be between 0 and 5." };
  }

  const userId = session.user.id;
  const where =
    targetType === "track"
      ? { userId_trackId: { userId, trackId: targetId } }
      : { userId_albumId: { userId, albumId: targetId } };

  const data =
    targetType === "track"
      ? { userId, trackId: targetId, score: score ?? null, comment: comment ?? null, starred }
      : { userId, albumId: targetId, score: score ?? null, comment: comment ?? null, starred };

  try {
    if (_delete) {
      await prisma.rate.deleteMany({
        where:
          targetType === "track"
            ? { userId, trackId: targetId }
            : { userId, albumId: targetId },
      });
      revalidatePath(`/${targetType}s/${targetId}`);
      return { ok: true, message: "Rating deleted." };
    }

    await prisma.rate.upsert({
      where: where as Parameters<typeof prisma.rate.upsert>[0]["where"],
      update: { score: score ?? null, comment: comment ?? null, starred },
      create: data,
    });

    revalidatePath(`/${targetType}s/${targetId}`);
    return { ok: true, message: "Rating saved!" };
  } catch (err) {
    console.error("submitRate error:", err);
    return { ok: false, message: "Error saving rating." };
  }
}
