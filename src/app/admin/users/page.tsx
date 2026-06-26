import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { RoleSelector } from "./RoleSelector";
import type { PageSize } from "@/types";

export const metadata = { title: "유저 관리" };

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "관리자",
  EDITOR: "에디터",
  USER: "일반",
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  EDITOR: "bg-indigo-100 text-indigo-700",
  USER: "bg-gray-100 text-gray-600",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = sp.page ? parseInt(sp.page) : 1;
  const pageSize = 30;

  const where = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        discordId: true,
        role: true,
        createdAt: true,
        _count: { select: { rates: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">유저 목록</h2>
        <span className="text-sm text-gray-500">총 {total}명</span>
      </div>

      {/* 검색 */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="이름으로 검색…"
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          검색
        </button>
      </form>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">유저</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Discord ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">평가 수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">가입일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">역할</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? ""}
                        width={32}
                        height={32}
                        className="rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-[140px]">
                        {user.name ?? "이름 없음"}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">
                        {user.email ?? ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">
                  {user.discordId ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                  {user._count.rates}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">
                  <RoleSelector
                    userId={user.id}
                    currentRole={user.role}
                    roleLabel={ROLE_LABEL}
                    roleColor={ROLE_COLOR}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-400">유저가 없습니다.</div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/users?q=${q}&page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
