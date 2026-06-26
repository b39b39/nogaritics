import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "./UserMenu";
import { PostButton } from "./PostButton";

export async function Header() {
  const session = await auth();

  const role = session?.user?.id
    ? (await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      }))?.role
    : null;

  const isAdmin = role === "ADMIN";
  const hasEditAccess = role === "ADMIN" || role === "EDITOR";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-1.5 font-bold text-xl text-indigo-600 hover:text-indigo-700 transition-colors">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-indigo-600 text-white text-base font-black" style={{ fontFamily: "serif", lineHeight: 1 }}>ℕ</span>
              Nogaritics
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <NavLink href="/tracks">Tracks</NavLink>
              <NavLink href="/albums">Albums</NavLink>
              <NavLink href="/artists">Artists</NavLink>
              <NavLink href="/chart">Chart</NavLink>
              {isAdmin && (
                <NavLink href="/admin" className="text-red-500 hover:text-red-600">
                  Admin
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {hasEditAccess && <PostButton />}
            <UserMenu session={session} />
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={className ?? "text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"}
    >
      {children}
    </Link>
  );
}
