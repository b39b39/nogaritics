import { auth } from "@/auth";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

/** 현재 세션 유저의 role을 DB에서 조회 */
export async function getSessionRole(): Promise<UserRole | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role ?? null;
}

export function canEdit(role: UserRole | null): boolean {
  return role === "EDITOR" || role === "ADMIN";
}

export function isAdmin(role: UserRole | null): boolean {
  return role === "ADMIN";
}

/** API 라우트용 — 권한 없으면 Response 반환, 있으면 null */
export async function requireEditor(): Promise<Response | null> {
  const role = await getSessionRole();
  if (!canEdit(role)) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  return null;
}

export async function requireAdmin(): Promise<Response | null> {
  const role = await getSessionRole();
  if (!isAdmin(role)) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  return null;
}
