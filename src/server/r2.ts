import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { ApiError } from "@/server/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getR2Config() {
  const accountId = process.env.LIBRARUM_R2_ACCOUNT_ID;
  const accessKeyId = process.env.LIBRARUM_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.LIBRARUM_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.LIBRARUM_R2_BUCKET;
  const publicUrl = process.env.LIBRARUM_R2_PUBLIC_URL;

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

function getPublicUrlFromEnv() {
  const publicUrl = process.env.LIBRARUM_R2_PUBLIC_URL;
  return publicUrl ? publicUrl.replace(/\/$/, "") : null;
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

function detectImageContentType(buffer: Buffer) {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isWebp =
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isJpeg) return "image/jpeg";
  if (isPng) return "image/png";
  if (isWebp) return "image/webp";
  return null;
}

async function uploadCoverBufferToR2(buffer: Buffer, contentType: string) {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new ApiError(400, "Only JPG, PNG, and WEBP covers are supported.");
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new ApiError(400, "Cover file must be 5MB or smaller.");
  }

  const { bucket, publicUrl, client } = getR2Config();
  const extension = getFileExtension(contentType);
  const key = `books/covers/${crypto.randomUUID()}.${extension}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable"
      })
    );
  } catch (error) {
    console.error("R2 upload failed", error);

    if (
      error &&
      typeof error === "object" &&
      "$metadata" in error &&
      error.$metadata &&
      typeof error.$metadata === "object" &&
      "httpStatusCode" in error.$metadata &&
      error.$metadata.httpStatusCode === 403
    ) {
      throw new ApiError(
        500,
        "R2 kapak deposuna yazma izni yok. Bucket adı veya access key yetkileri kontrol edilmeli."
      );
    }

    throw new ApiError(500, "Kapak görseli depoya yüklenemedi.");
  }

  return {
    key,
    url: `${publicUrl}/${key}`
  };
}

export async function uploadCoverToR2(file: File) {
  assertCoverFile(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedContentType = detectImageContentType(buffer);

  if (!detectedContentType || detectedContentType !== file.type) {
    throw new ApiError(400, "Invalid image format. Only JPEG, PNG, and WebP are allowed.");
  }

  return uploadCoverBufferToR2(buffer, detectedContentType);
}

export function extractR2KeyFromUrl(url: string) {
  const { publicUrl } = getR2Config();

  if (!url.startsWith(`${publicUrl}/`)) {
    return null;
  }

  return url.slice(publicUrl.length + 1);
}

export function extractR2KeyFromPublicUrl(url: string) {
  const publicUrl = getPublicUrlFromEnv();

  if (!publicUrl) {
    return null;
  }

  if (!url.startsWith(`${publicUrl}/`)) {
    return null;
  }

  return url.slice(publicUrl.length + 1);
}

export function toCoverDeliveryUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  const key = extractR2KeyFromPublicUrl(url);

  if (!key) {
    return url;
  }

  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/api/books/cover/${encodedKey}`;
}

export async function readCoverFromR2(key: string) {
  const { bucket, client } = getR2Config();

  if (!key.startsWith("books/covers/")) {
    throw new ApiError(400, "Invalid cover key.");
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    if (!response.Body) {
      throw new ApiError(404, "Cover not found.");
    }

    const bytes = await response.Body.transformToByteArray();

    return {
      bytes,
      contentType: response.ContentType ?? "application/octet-stream",
      cacheControl: response.CacheControl ?? "public, max-age=31536000, immutable",
      etag: response.ETag ?? null
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "$metadata" in error &&
      error.$metadata &&
      typeof error.$metadata === "object" &&
      "httpStatusCode" in error.$metadata &&
      error.$metadata.httpStatusCode === 404
    ) {
      throw new ApiError(404, "Cover not found.");
    }

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "NoSuchKey"
    ) {
      throw new ApiError(404, "Cover not found.");
    }

    console.error("R2 cover read failed", error);
    throw new ApiError(500, "Kapak görseli depodan okunamadı.");
  }
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
