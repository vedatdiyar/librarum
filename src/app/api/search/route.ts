import { apiSuccess, parseSearchParams, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { searchQuerySchema } from "@/server/books-schemas";
import { searchBooks } from "@/server/search-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request: Request) => {
  await requireSession();
  const query = parseSearchParams(request, searchQuerySchema);
  const results = await searchBooks(query.q ?? "");

  return apiSuccess(results);
});
