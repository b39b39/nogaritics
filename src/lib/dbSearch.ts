import { prisma } from "@/lib/prisma";

type SearchableTable = "Artist" | "Album" | "Track";

export interface RankedId {
  id: string;
  rank: number;
}

// Returns IDs sorted by match priority:
//   0 = name starts with q
//   1 = alias starts with q
//   2 = name contains q (middle)
//   3 = alias contains q (middle)
//
// Uses $queryRawUnsafe so the table name and LIMIT can be injected as
// literals (both are server-controlled, not user input). User input
// goes through $1/$2 parameterized placeholders only.
export async function searchIdsByQuery(
  table: SearchableTable,
  q: string,
  limit: number,
): Promise<RankedId[]> {
  const safeTable = { Artist: "Artist", Album: "Album", Track: "Track" }[table];
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const prefix = q + "%";
  const any = "%" + q + "%";

  const rows = await prisma.$queryRawUnsafe<{ id: string; match_rank: number | bigint }[]>(
    `SELECT id,
       CASE
         WHEN name ILIKE $1 THEN 0
         WHEN EXISTS (SELECT 1 FROM unnest(aliases) a WHERE a ILIKE $1) THEN 1
         WHEN name ILIKE $2 THEN 2
         ELSE 3
       END AS match_rank
     FROM "${safeTable}"
     WHERE name ILIKE $2
        OR EXISTS (SELECT 1 FROM unnest(aliases) a WHERE a ILIKE $2)
     ORDER BY match_rank, name
     LIMIT ${safeLimit}`,
    prefix, // $1 — starts-with pattern
    any,    // $2 — contains pattern
  );

  return rows.map((r) => ({ id: r.id, rank: Number(r.match_rank) }));
}

// Sort items by their position in `ranked` (preserves exact SQL order: rank → name).
export function applyRankSort<T extends { id: string }>(
  items: T[],
  ranked: RankedId[],
): T[] {
  const posMap = new Map(ranked.map((r, i) => [r.id, i]));
  return [...items].sort((a, b) => (posMap.get(a.id) ?? ranked.length) - (posMap.get(b.id) ?? ranked.length));
}
