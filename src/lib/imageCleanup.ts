import { prisma } from "./prisma";
import { deleteFromR2 } from "./r2";

function isStorageUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const r2Base = process.env.R2_PUBLIC_URL;
  const gcsBase = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/`;
  return (!!r2Base && url.startsWith(r2Base + "/")) || url.startsWith(gcsBase);
}

async function deleteStorageFile(url: string): Promise<void> {
  const r2Base = process.env.R2_PUBLIC_URL;
  if (r2Base && url.startsWith(r2Base + "/")) {
    await deleteFromR2(url);
  } else {
    const { deleteFromGCS } = await import("./gcs");
    await deleteFromGCS(url);
  }
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
  if (!isStorageUrl(url)) return;
  if (await isOrphaned(url)) await deleteStorageFile(url);
}

/** @deprecated use maybeDeleteR2 */
export const maybeDeleteGCS = maybeDeleteR2;
