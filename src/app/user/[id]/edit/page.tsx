import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserEditClient } from "./UserEditClient";

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/user/${id}`);

  // look up by username or id
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: id }, { id }] },
    select: { id: true, name: true, username: true, image: true, banner: true, blockColor: true, blockTextColor: true },
  });
  if (!user) notFound();
  if (session.user.id !== user.id) redirect(`/user/${id}`);

  return (
    <div className="max-w-3xl mx-auto">
      <UserEditClient user={user} />
    </div>
  );
}
