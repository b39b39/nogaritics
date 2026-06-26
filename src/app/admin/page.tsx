import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const [userCount, editorCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { in: ["EDITOR", "ADMIN"] } } }),
  ]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg">
      <Link href="/admin/users" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
        <div className="text-3xl font-bold text-indigo-600">{userCount}</div>
        <div className="text-sm text-gray-500 mt-1">전체 유저</div>
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-3xl font-bold text-emerald-600">{editorCount}</div>
        <div className="text-sm text-gray-500 mt-1">편집 권한 유저</div>
      </div>
    </div>
  );
}
