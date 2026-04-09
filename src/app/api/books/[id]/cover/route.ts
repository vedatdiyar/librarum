import { z } from "zod";
import { eq } from "drizzle-orm";
import { books, createDb } from "@/db";
import { apiSuccess, parseJsonBody, withApiHandler, ApiError } from "@/server/api";
import { requireSession } from "@/server/auth";
import { uuidSchema } from "@/server/books-schemas";
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

export const POST = withApiHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireSession();
    const { id: rawId } = await params;
    const id = uuidSchema.parse(rawId);
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

    const { key, url } = await uploadCoverToR2(file);

    const db = createDb();
    await db
      .update(books)
      .set({ coverCustomUrl: url })
      .where(eq(books.id, id));

    return apiSuccess({ key, url }, 201);
  }
);

export const DELETE = withApiHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireSession();
    const { id: rawId } = await params;
    const id = uuidSchema.parse(rawId);
    
    let key: string | null = null;

    try {
      const payload = await parseJsonBody(request, deleteCoverSchema);
      key = payload.key ?? (payload.url ? extractR2KeyFromUrl(payload.url) : null);
    } catch {
      // If parsing fails or the body is not JSON, we can try to find the current key from DB
      const db = createDb();
      const existingBook = await db.select({ coverCustomUrl: books.coverCustomUrl }).from(books).where(eq(books.id, id)).limit(1);
      if (existingBook[0]?.coverCustomUrl) {
         key = extractR2KeyFromUrl(existingBook[0].coverCustomUrl);
      }
    }

    if (!key) {
      // We didn't get a key from payload and DB didn't have one, or payload failed.
      throw new ApiError(400, "A valid cover key or R2 URL is required to delete.");
    }

    await deleteCoverFromR2(key);

    const db = createDb();
    await db
      .update(books)
      .set({ coverCustomUrl: null })
      .where(eq(books.id, id));

    return apiSuccess({ deleted: true });
  }
);
