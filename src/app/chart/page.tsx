import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getChartItems } from "@/lib/queries";
import { Pagination } from "@/components/ui/Pagination";
import { ChartNav } from "@/components/music/ChartNav";
import { ChartTable } from "@/components/music/ChartTable";
import type { ChartNavInitial } from "@/components/music/ChartNav";
import type { ChartFilter, PageSize, SortBy, SortOrder, TargetType } from "@/types";

export const metadata = { title: "Chart" };

export default async function ChartPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [sp, session] = await Promise.all([searchParams, auth()]);
  const viewerId = session?.user?.id;

  const targetType = (sp.targetType as TargetType) || "both";
  const sortBy: SortBy = (sp.sortBy as SortBy) || "recently";
  const sortOrder: SortOrder = (sp.sortOrder as SortOrder) || "desc";
  const page = sp.page ? parseInt(sp.page) : 1;
  const pageSize = (sp.pageSize ? parseInt(sp.pageSize) : 30) as PageSize;

  const tagIds = sp.tagIds ? sp.tagIds.split(",").filter(Boolean) : sp.tagId ? [sp.tagId] : [];
  const nations = sp.nations ? sp.nations.split(",").filter(Boolean) : sp.nation ? [sp.nation] : [];
  const tagMode = (sp.tagMode === "or" ? "or" : "and") as "or" | "and";
  const userMode = (sp.userMode === "and" ? "and" : "or") as "or" | "and";

  // Expand artistId with solo/group inclusion
  let artistIds: string[] | undefined;
  if (sp.artistId) {
    const expandIds = new Set([sp.artistId]);
    if (sp.includeSolo === "1" || sp.includeGroup === "1") {
      const artist = await prisma.artist.findUnique({
        where: { id: sp.artistId },
        select: {
          memberEntries: { select: { memberId: true } },
          groupEntries: { select: { groupId: true } },
        },
      });
      if (artist) {
        if (sp.includeSolo === "1") artist.memberEntries.forEach((m) => expandIds.add(m.memberId));
        if (sp.includeGroup === "1") artist.groupEntries.forEach((g) => expandIds.add(g.groupId));
      }
    }
    artistIds = [...expandIds];
  }

  const filter: ChartFilter = {
    q: sp.q,
    targetType,
    artistIds,
    albumId: sp.albumId,
    tagIds,
    tagMode,
    publishedFrom: sp.publishedFrom || undefined,
    publishedTo: sp.publishedTo || undefined,
    nations: nations.length ? nations : undefined,
    userMode,
    ratedBy: sp.ratedBy,
    starredBy: sp.starredBy,
    sortBy,
    sortOrder,
    page,
    pageSize,
  };

  // Fetch display info for nav pre-population
  const userId = sp.ratedBy ?? sp.starredBy;
  const [artistDisplay, tagDisplays, userDisplay, nationRows] = await Promise.all([
    sp.artistId
      ? prisma.artist.findUnique({ where: { id: sp.artistId }, select: { id: true, name: true } })
      : null,
    tagIds.length > 0
      ? prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true, name: true } })
      : [],
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } })
      : null,
    prisma.artist.findMany({
      where: { nation: { not: null } },
      select: { nation: true },
      distinct: ["nation"],
      orderBy: { nation: "asc" },
    }),
  ]);

  const availableNations = nationRows.map((r) => r.nation!).filter(Boolean);

  const navInitial: ChartNavInitial = {
    q: sp.q ?? "",
    targetType,
    artistId: sp.artistId ?? "",
    artistName: artistDisplay?.name ?? "",
    includeSolo: sp.includeSolo === "1",
    includeGroup: sp.includeGroup === "1",
    publishedFrom: sp.publishedFrom ?? "",
    publishedTo: sp.publishedTo ?? "",
    tagIds,
    tagLabels: Object.fromEntries(tagDisplays.map((t) => [t.id, t.name])),
    tagMode,
    nations,
    userId: userId ?? "",
    userName: userDisplay?.name ?? "",
    showRated: !!sp.ratedBy,
    showStarred: !!sp.starredBy,
    userMode,
    sortBy,
    sortOrder,
    pageSize: String(pageSize),
  };

  const { items, total } = await getChartItems(filter, viewerId);

  const baseSearchParams = Object.fromEntries(
    Object.entries(sp).filter(([k]) => !["sortBy", "sortOrder", "page"].includes(k))
  );

  return (
    <div className="space-y-4">

      <Suspense>
        <ChartNav initial={navInitial} nations={availableNations} />
      </Suspense>

      {items.length === 0 ? (
        <div className="py-16 text-center text-gray-400">No results found.</div>
      ) : (
        <>
          <ChartTable
            items={items}
            isLoggedIn={!!viewerId}
            sortBy={sortBy}
            sortOrder={sortOrder}
            baseSearchParams={baseSearchParams}
          />
          <Pagination total={total} page={page} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
