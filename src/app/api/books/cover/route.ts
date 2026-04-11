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
