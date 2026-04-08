import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ApiError } from "@/lib/server/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getR2Config() {
  const accountId = process.env.EXLIBRIS_R2_ACCOUNT_ID;
  const accessKeyId = process.env.EXLIBRIS_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.EXLIBRIS_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.EXLIBRIS_R2_BUCKET;
  const publicUrl = process.env.EXLIBRIS_R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new ApiError(500, "R2 configuration is missing.");
  }

  return {
    bucket,
    publicUrl: publicUrl.replace(/\/$/, ""),
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  };
}

function getFileExtension(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export function assertCoverFile(file: File | null | undefined) {
  if (!file) {
    throw new ApiError(400, "Cover file is required.");
  }

  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw new ApiError(400, "Only JPG, PNG, and WEBP covers are supported.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(400, "Cover file must be 5MB or smaller.");
  }
}

export async function uploadCoverToR2(file: File) {
  assertCoverFile(file);
  const { bucket, publicUrl, client } = getR2Config();
  const extension = getFileExtension(file.type);
  const key = `books/covers/${crypto.randomUUID()}.${extension}`;
  const body = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable"
    })
  );

  return {
    key,
    url: `${publicUrl}/${key}`
  };
}

export function extractR2KeyFromUrl(url: string) {
  const { publicUrl } = getR2Config();

  if (!url.startsWith(`${publicUrl}/`)) {
    return null;
  }

  return url.slice(publicUrl.length + 1);
}

export async function deleteCoverFromR2(key: string) {
  const { bucket, client } = getR2Config();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
}
