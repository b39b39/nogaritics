"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin";
import type { UserRole } from "@prisma/client";

const ROLES: UserRole[] = ["USER", "EDITOR", "ADMIN"];

interface RoleSelectorProps {
  userId: string;
  currentRole: UserRole;
  roleLabel: Record<string, string>;
  roleColor: Record<string, string>;
}

export function RoleSelector({ userId, currentRole, roleLabel, roleColor }: RoleSelectorProps) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(newRole: UserRole) {
    if (newRole === role) return;
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.ok) {
        setRole(newRole);
        setMessage(null);
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => handleChange(r)}
            disabled={isPending || currentRole === "ADMIN" && r !== "ADMIN"}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all border ${
              role === r
                ? `${roleColor[r]} border-transparent`
                : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isPending && role !== r && r === ROLES.find((x) => x !== role) ? "…" : roleLabel[r]}
          </button>
        ))}
      </div>
      {message && <p className="text-xs text-red-500">{message}</p>}
    </div>
  );
}
