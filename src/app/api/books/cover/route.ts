import { z } from "zod";
import { apiSuccess, parseJsonBody, withApiHandler, ApiError } from "@/server/api";
import { requireSession } from "@/server/auth";
import {
  assertCoverFile,
  deleteCoverFromR2,
  extractR2KeyFromUrl,
  uploadCoverToR2
} from "@/server/r2";

export const dynamic = "force-dynamic";

const deleteCoverSchema = z.object({
  key: z.string().trim().min(1).optional(),
  url: z.string().trim().url().optional()
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new ApiError(400, "Cover file is required.");
  }

  assertCoverFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isWebp = buffer.length >= 4 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // RIFF header

  if (!isJpeg && !isPng && !isWebp) {
    throw new ApiError(400, "Invalid image format. Only JPEG, PNG, and WebP are allowed.");
  }

  return apiSuccess(await uploadCoverToR2(file), 201);
});

export const DELETE = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, deleteCoverSchema);
  const key = payload.key ?? (payload.url ? extractR2KeyFromUrl(payload.url) : null);

  if (!key) {
    throw new ApiError(400, "A valid cover key or R2 URL is required.");
  }

  await deleteCoverFromR2(key);

  return apiSuccess({ deleted: true });
});
