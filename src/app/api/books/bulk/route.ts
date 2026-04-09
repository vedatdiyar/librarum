import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { bulkBooksPatchSchema } from "@/server/books-schemas";
import { bulkUpdateBooks } from "@/server/books-service";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, bulkBooksPatchSchema);
  const result = await bulkUpdateBooks(payload);

  return apiSuccess(result);
});
