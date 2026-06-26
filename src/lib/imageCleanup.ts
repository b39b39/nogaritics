import { prisma } from "./prisma";
import { deleteFromR2 } from "./r2";

function isR2Url(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const r2Base = process.env.R2_PUBLIC_URL;
  return !!r2Base && url.startsWith(r2Base + "/");
}

async function isOrphaned(url: string): Promise<boolean> {
  const [artists, albums, tracks] = await Promise.all([
    prisma.artist.count({ where: { OR: [{ image: url }, { banner: url }] } }),
    prisma.album.count({ where: { image: url } }),
    prisma.track.count({ where: { image: url } }),
  ]);
  return artists + albums + tracks === 0;
}

export async function maybeDeleteR2(url: string | null | undefined): Promise<void> {
  if (!isR2Url(url)) return;
  if (await isOrphaned(url)) await deleteFromR2(url);
}

/** @deprecated use maybeDeleteR2 */
export const maybeDeleteGCS = maybeDeleteR2;
