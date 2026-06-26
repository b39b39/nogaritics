"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ ok: boolean; message: string }> {
  const sessionRole = await getSessionRole();
  if (sessionRole !== "ADMIN") {
    return { ok: false, message: "관리자 권한이 필요합니다." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { ok: false, message: "유저를 찾을 수 없습니다." };

  // 다른 ADMIN 계정의 role은 변경 불가
  if (target.role === "ADMIN" && role !== "ADMIN") {
    return { ok: false, message: "다른 관리자의 권한은 변경할 수 없습니다." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { ok: true, message: "권한이 변경되었습니다." };
}
