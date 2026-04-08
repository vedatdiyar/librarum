import { apiSuccess, parseSearchParams, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { searchQuerySchema } from "@/lib/server/books-schemas";
import { searchBooks } from "@/lib/server/search-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request: Request) => {
  await requireSession();
  const query = parseSearchParams(request, searchQuerySchema);
  const results = await searchBooks(query.q ?? "");

  return apiSuccess(results);
});
