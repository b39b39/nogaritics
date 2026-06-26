import { Storage } from "@google-cloud/storage";
import type { ImageCategory } from "./r2";

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
});

const BUCKET_NAME = process.env.GCS_BUCKET_NAME!;

export async function uploadToGCS(
  file: Buffer,
  filename: string,
  category: ImageCategory,
  contentType: string
): Promise<string> {
  const bucket = storage.bucket(BUCKET_NAME);
  const destination = `${category}/${filename}`;
  await bucket.file(destination).save(file, { metadata: { contentType } });
  return `https://storage.googleapis.com/${BUCKET_NAME}/${destination}`;
}

export async function deleteFromGCS(url: string): Promise<void> {
  const prefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;
  if (!url.startsWith(prefix)) return;
  await storage.bucket(BUCKET_NAME).file(url.slice(prefix.length)).delete({ ignoreNotFound: true });
}
