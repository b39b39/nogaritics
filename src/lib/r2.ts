import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g. https://pub-xxx.r2.dev or custom domain

export type ImageCategory = "tracks" | "albums" | "artists" | "banners";

export async function uploadToR2(
  file: Buffer,
  filename: string,
  category: ImageCategory,
  contentType: string
): Promise<string> {
  const key = `${category}/${filename}`;
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
  }));
  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(url: string): Promise<void> {
  const prefix = `${PUBLIC_URL}/`;
  if (!url.startsWith(prefix)) return;
  const key = url.slice(prefix.length);
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
