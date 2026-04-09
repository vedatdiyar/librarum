import { apiSuccess, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { isbnRouteParamSchema } from "@/server/books-schemas";
import { fetchMetadataByIsbn } from "@/server/books-intelligence";

export const dynamic = "force-dynamic";

type IsbnRouteContext = {
  params: Promise<{
    isbn: string;
  }>;
};

export const GET = withApiHandler(async (_request: Request, context: IsbnRouteContext) => {
  await requireSession();
  const { isbn: rawIsbn } = await context.params;
  const isbn = isbnRouteParamSchema.parse(rawIsbn);
  const result = await fetchMetadataByIsbn(isbn);

  return apiSuccess(result);
});
