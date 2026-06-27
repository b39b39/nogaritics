import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Lazy-initialize so missing secrets surface as a clear error at call time,
// not silently at module load (which would create a client with undefined credentials).
let _r2: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_r2) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY as Cloudflare Workers secrets (wrangler secret put)."
      );
    }
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _r2;
}

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
  await getR2Client().send(new PutObjectCommand({
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
  await getR2Client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
