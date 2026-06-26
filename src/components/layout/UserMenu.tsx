"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/Button";

interface UserMenuProps {
  session: Session | null;
}

export function UserMenu({ session }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  if (!session?.user) {
    return (
      <Button size="sm" onClick={() => signIn("discord")}>
        Login with Discord
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {session.user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700">{session.user.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
            <Link
              href={`/user/${session.user.id}`}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              My Profile
            </Link>
            <hr className="my-1 border-gray-100" />
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => { setOpen(false); signOut(); }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
