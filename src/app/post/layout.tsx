import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/permissions";

export default async function PostLayout({ children }: { children: React.ReactNode }) {
  const role = await getSessionRole();
  if (role !== "ADMIN" && role !== "EDITOR") redirect("/");

  return (
    <div className="max-w-4xl mx-auto">
      {children}
    </div>
  );
}
