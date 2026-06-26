import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getSessionRole();
  if (role !== "ADMIN") redirect("/");

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">관리자 패널</h1>
        <nav className="flex gap-4 mt-3 text-sm">
          <a href="/admin/users" className="text-indigo-600 hover:underline font-medium">유저 관리</a>
        </nav>
      </div>
      {children}
    </div>
  );
}
