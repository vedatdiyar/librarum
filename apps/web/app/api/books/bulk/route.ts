import { apiSuccess, parseJsonBody, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { bulkBooksPatchSchema } from "@/lib/server/books-schemas";
import { bulkUpdateBooks } from "@/lib/server/books-service";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, bulkBooksPatchSchema);
  const result = await bulkUpdateBooks(payload);

  return apiSuccess(result);
});
