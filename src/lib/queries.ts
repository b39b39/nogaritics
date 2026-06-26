import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { ChartFilter, SortBy, SortOrder, TrackSummary, AlbumSummary } from "@/types";

export type ChartRow =
  | (TrackSummary & { type: "track" })
  | (AlbumSummary & { type: "album" });

export const artistInclude = {
  artists: {
    include: {
      artist: {
        select: { id: true, name: true, image: true, nation: true, isGroup: true },
      },
    },
    orderBy: { role: "asc" as const },
  },
} as const;

export const tagInclude = {
  tags: { include: { tag: { select: { id: true, name: true } } } },
} as const;

export function computeStats(rates: { score: number | null; starred: boolean }[]) {
  const scored = rates.filter((r) => r.score != null);
  const avgScore =
    scored.length > 0
      ? scored.reduce((sum, r) => sum + r.score!, 0) / scored.length
      : null;
  return {
    avgScore: avgScore != null ? Math.round(avgScore * 100) / 100 : null,
    rateCount: scored.length,
    starCount: rates.filter((r) => r.starred).length,
  };
}

export async function getTracks(filter: ChartFilter, viewerId?: string) {
  const {
    q, artistId, albumId, tagId, ratedBy, starredBy,
    sortBy = "recently", sortOrder = "desc", page = 1, pageSize = 30,
  } = filter;

  const where: Prisma.TrackWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { aliases: { has: q } },
      ],
    }),
    ...(albumId && { albumId }),
    ...(artistId && { artists: { some: { artistId } } }),
    ...(tagId && { tags: { some: { tagId } } }),
    ...(ratedBy && { rates: { some: { userId: ratedBy, score: { not: null } } } }),
    ...(starredBy && { rates: { some: { userId: starredBy, starred: true } } }),
  };

  const orderBy: Prisma.TrackOrderByWithRelationInput[] =
    sortBy === "recently"
      ? [
          { publishedYear: sortOrder },
          { publishedMonth: sortOrder },
          { publishedDay: sortOrder },
          { createdAt: sortOrder },
        ]
      : [{ createdAt: sortOrder }];

  const [tracks, total] = await Promise.all([
    prisma.track.findMany({
      where,
      include: {
        ...artistInclude,
        ...tagInclude,
        album: { select: { id: true, name: true, image: true } },
        rates: { select: { userId: true, score: true, starred: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.track.count({ where }),
  ]);

  const items = tracks.map((t) => {
    const { avgScore, rateCount, starCount } = computeStats(t.rates);
    const myRate = viewerId ? t.rates.find((r) => r.userId === viewerId) : undefined;
    return {
      id: t.id,
      name: t.name,
      aliases: t.aliases,
      image: t.image,
      publishedYear: t.publishedYear,
      publishedMonth: t.publishedMonth,
      publishedDay: t.publishedDay,
      createdAt: t.createdAt,
      artists: t.artists.map((a) => ({ artist: a.artist, role: a.role, showInOverview: a.showInOverview })),
      album: t.album,
      tags: t.tags.map((tt) => tt.tag),
      avgScore,
      rateCount,
      starCount,
      myScore: myRate?.score ?? null,
      myStarred: myRate?.starred ?? false,
    };
  });

  return { items, total };
}

export async function getAlbums(filter: ChartFilter, viewerId?: string) {
  const {
    q, artistId, tagId, ratedBy, starredBy,
    sortBy = "recently", sortOrder = "desc", page = 1, pageSize = 30,
  } = filter;

  const where: Prisma.AlbumWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { aliases: { has: q } },
      ],
    }),
    ...(artistId && { artists: { some: { artistId } } }),
    ...(tagId && { tags: { some: { tagId } } }),
    ...(ratedBy && { rates: { some: { userId: ratedBy, score: { not: null } } } }),
    ...(starredBy && { rates: { some: { userId: starredBy, starred: true } } }),
  };

  const orderBy: Prisma.AlbumOrderByWithRelationInput[] =
    sortBy === "recently"
      ? [
          { publishedYear: sortOrder },
          { publishedMonth: sortOrder },
          { publishedDay: sortOrder },
          { createdAt: sortOrder },
        ]
      : [{ createdAt: sortOrder }];

  const [albums, total] = await Promise.all([
    prisma.album.findMany({
      where,
      include: {
        ...artistInclude,
        ...tagInclude,
        _count: { select: { tracks: true } },
        rates: { select: { userId: true, score: true, starred: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.album.count({ where }),
  ]);

  const items = albums.map((a) => {
    const { avgScore, rateCount, starCount } = computeStats(a.rates);
    const myRate = viewerId ? a.rates.find((r) => r.userId === viewerId) : undefined;
    return {
      id: a.id,
      name: a.name,
      aliases: a.aliases,
      image: a.image,
      publishedYear: a.publishedYear,
      publishedMonth: a.publishedMonth,
      publishedDay: a.publishedDay,
      createdAt: a.createdAt,
      artists: a.artists.map((ar) => ({ artist: ar.artist, role: ar.role, showInOverview: ar.showInOverview })),
      tags: a.tags.map((tt) => tt.tag),
      trackCount: a._count.tracks,
      avgScore,
      rateCount,
      starCount,
      myScore: myRate?.score ?? null,
      myStarred: myRate?.starred ?? false,
    };
  });

  return { items, total };
}

const CHART_MAX_ITEMS = 2000;

function parseDateStr(s: string): { year: number; month?: number; day?: number } | null {
  const parts = s.split("-").map(Number);
  if (!parts[0] || isNaN(parts[0])) return null;
  return {
    year: parts[0],
    month: parts[1] && !isNaN(parts[1]) ? parts[1] : undefined,
    day: parts[2] && !isNaN(parts[2]) ? parts[2] : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dateFromCond(dateStr: string): any | null {
  const p = parseDateStr(dateStr);
  if (!p) return null;
  const { year, month, day } = p;
  if (month == null) return { publishedYear: { gte: year } };
  if (day == null) return { OR: [{ publishedYear: { gt: year } }, { publishedYear: year, publishedMonth: { gte: month } }] };
  return { OR: [{ publishedYear: { gt: year } }, { publishedYear: year, publishedMonth: { gt: month } }, { publishedYear: year, publishedMonth: month, publishedDay: { gte: day } }] };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dateToCond(dateStr: string): any | null {
  const p = parseDateStr(dateStr);
  if (!p) return null;
  const { year, month, day } = p;
  if (month == null) return { publishedYear: { lte: year } };
  if (day == null) return { OR: [{ publishedYear: { lt: year } }, { publishedYear: year, publishedMonth: { lte: month } }] };
  return { OR: [{ publishedYear: { lt: year } }, { publishedYear: year, publishedMonth: { lt: month } }, { publishedYear: year, publishedMonth: month, publishedDay: { lte: day } }] };
}

function buildCommonConds(filter: ChartFilter) {
  const { q, artistId, artistIds, tagId, tagIds, tagMode = "and", publishedFrom, publishedTo, nations, userMode = "or", ratedBy, starredBy } = filter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conds: any[] = [];

  if (q) conds.push({ OR: [{ name: { contains: q, mode: "insensitive" } }, { aliases: { has: q } }] });
  if (artistIds?.length) conds.push({ artists: { some: { artistId: { in: artistIds } } } });
  else if (artistId) conds.push({ artists: { some: { artistId } } });

  const tIds = tagIds?.length ? tagIds : tagId ? [tagId] : [];
  if (tIds.length > 0) {
    if (tagMode === "or") {
      conds.push({ tags: { some: { tagId: { in: tIds } } } });
    } else {
      for (const tid of tIds) conds.push({ tags: { some: { tagId: tid } } });
    }
  }

  const fromC = publishedFrom ? dateFromCond(publishedFrom) : null;
  const toC = publishedTo ? dateToCond(publishedTo) : null;
  if (fromC) conds.push(fromC);
  if (toC) conds.push(toC);

  if (nations?.length) {
    conds.push({ artists: { some: { artist: { nation: { in: nations } } } } });
  }

  if (ratedBy && starredBy && ratedBy === starredBy) {
    if (userMode === "and") {
      conds.push({ rates: { some: { userId: ratedBy, score: { not: null } } } });
      conds.push({ rates: { some: { userId: ratedBy, starred: true } } });
    } else {
      conds.push({ OR: [{ rates: { some: { userId: ratedBy, score: { not: null } } } }, { rates: { some: { userId: starredBy, starred: true } } }] });
    }
  } else {
    if (ratedBy) conds.push({ rates: { some: { userId: ratedBy, score: { not: null } } } });
    if (starredBy) conds.push({ rates: { some: { userId: starredBy, starred: true } } });
  }
  return conds;
}

function buildTrackWhere(filter: ChartFilter): Prisma.TrackWhereInput {
  const conds = buildCommonConds(filter);
  if (filter.albumId) conds.push({ albumId: filter.albumId });
  return conds.length > 0 ? { AND: conds } : {};
}

function buildAlbumWhere(filter: ChartFilter): Prisma.AlbumWhereInput {
  const conds = buildCommonConds(filter);

  return conds.length > 0 ? { AND: conds } : {};
}

type SortStep = { key: SortBy; order: SortOrder };

function compareByStep(a: ChartRow, b: ChartRow, { key, order }: SortStep, isLoggedIn: boolean): number {
  const dir = order === "asc" ? 1 : -1;
  switch (key) {
    case "recently":
      return dir * (a.createdAt.getTime() - b.createdAt.getTime());
    case "name":
      return dir * a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    case "type":
      return dir * a.type.localeCompare(b.type);
    case "published": {
      const ts = (r: ChartRow) => (r.publishedYear ?? 0) * 10000 + (r.publishedMonth ?? 0) * 100 + (r.publishedDay ?? 0);
      return dir * (ts(a) - ts(b));
    }
    case "score":
      return dir * ((a.avgScore ?? -1) - (b.avgScore ?? -1));
    case "starred":
      return isLoggedIn
        ? dir * ((a.myStarred ? 1 : 0) - (b.myStarred ? 1 : 0))
        : dir * (a.starCount - b.starCount);
    case "artists": {
      const first = (r: ChartRow) => r.artists.find((ar) => ar.showInOverview !== false)?.artist.name ?? "";
      return dir * first(a).localeCompare(first(b), undefined, { sensitivity: "base" });
    }
    default:
      return 0;
  }
}

// Default sort chain (applied when no user-chosen primary, or as tiebreakers):
//   logged in  → starred↓  score↓  name↑  published↑  artists↑
//   logged out →            name↑  published↑  artists↑
function sortChartRows(rows: ChartRow[], sortBy: SortBy, sortOrder: SortOrder, isLoggedIn: boolean): ChartRow[] {
  const defaultChain: SortStep[] = [
    ...(isLoggedIn
      ? [{ key: "starred" as SortBy, order: "desc" as SortOrder }, { key: "score" as SortBy, order: "desc" as SortOrder }]
      : []),
    { key: "name" as SortBy, order: "asc" as SortOrder },
    { key: "published" as SortBy, order: "asc" as SortOrder },
    { key: "artists" as SortBy, order: "asc" as SortOrder },
  ];

  // "recently" means no explicit primary → use default chain
  const chain: SortStep[] =
    sortBy === "recently"
      ? defaultChain
      : [{ key: sortBy, order: sortOrder }, ...defaultChain.filter((s) => s.key !== sortBy)];

  return [...rows].sort((a, b) => {
    for (const step of chain) {
      const cmp = compareByStep(a, b, step, isLoggedIn);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

const trackChartInclude = {
  ...artistInclude,
  ...tagInclude,
  album: { select: { id: true, name: true, image: true } },
  rates: { select: { userId: true, score: true, starred: true } },
} as const;

const albumChartInclude = {
  ...artistInclude,
  ...tagInclude,
  _count: { select: { tracks: true } },
  rates: { select: { userId: true, score: true, starred: true } },
} as const;

type RawTrack = Awaited<ReturnType<typeof prisma.track.findMany<{ include: typeof trackChartInclude }>>>[number];
type RawAlbum = Awaited<ReturnType<typeof prisma.album.findMany<{ include: typeof albumChartInclude }>>>[number];

export async function getChartItems(filter: ChartFilter, viewerId?: string): Promise<{ items: ChartRow[]; total: number }> {
  const { targetType, sortBy = "recently", sortOrder = "desc", page = 1, pageSize = 30 } = filter;

  const trackWhere = buildTrackWhere(filter);
  const albumWhere = buildAlbumWhere(filter);

  const [rawTracks, rawAlbums] = await Promise.all([
    targetType !== "album"
      ? prisma.track.findMany({ where: trackWhere, include: trackChartInclude, take: CHART_MAX_ITEMS })
      : Promise.resolve([] as RawTrack[]),
    targetType !== "track"
      ? prisma.album.findMany({ where: albumWhere, include: albumChartInclude, take: CHART_MAX_ITEMS })
      : Promise.resolve([] as RawAlbum[]),
  ]);

  const tracks: ChartRow[] = rawTracks.map((t) => {
    const { avgScore, rateCount, starCount } = computeStats(t.rates);
    const myRate = viewerId ? t.rates.find((r) => r.userId === viewerId) : undefined;
    return {
      type: "track" as const,
      id: t.id, name: t.name, aliases: t.aliases, image: t.image,
      publishedYear: t.publishedYear, publishedMonth: t.publishedMonth, publishedDay: t.publishedDay,
      createdAt: t.createdAt,
      artists: t.artists.map((a) => ({ artist: a.artist, role: a.role, showInOverview: a.showInOverview })),
      album: t.album,
      tags: t.tags.map((tt) => tt.tag),
      avgScore, rateCount, starCount,
      myScore: myRate?.score ?? null,
      myStarred: myRate?.starred ?? false,
    };
  });

  const albums: ChartRow[] = rawAlbums.map((a) => {
    const { avgScore, rateCount, starCount } = computeStats(a.rates);
    const myRate = viewerId ? a.rates.find((r) => r.userId === viewerId) : undefined;
    return {
      type: "album" as const,
      id: a.id, name: a.name, aliases: a.aliases, image: a.image,
      publishedYear: a.publishedYear, publishedMonth: a.publishedMonth, publishedDay: a.publishedDay,
      createdAt: a.createdAt,
      artists: a.artists.map((ar) => ({ artist: ar.artist, role: ar.role, showInOverview: ar.showInOverview })),
      tags: a.tags.map((tt) => tt.tag),
      trackCount: a._count.tracks,
      avgScore, rateCount, starCount,
      myScore: myRate?.score ?? null,
      myStarred: myRate?.starred ?? false,
    };
  });

  const merged = sortChartRows([...tracks, ...albums], sortBy, sortOrder, !!viewerId);
  const total = merged.length;
  const items = merged.slice((page - 1) * pageSize, page * pageSize);

  return { items, total };
}
