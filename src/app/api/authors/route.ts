import { apiSuccess, parseJsonBody, parseSearchParams, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { entityListQuerySchema, createAuthorSchema } from "@/server/books-schemas";
import { createAuthor, listAuthors } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request: Request) => {
  await requireSession();
  const query = parseSearchParams(request, entityListQuerySchema);
  const result = await listAuthors(query.q, query.page, query.limit);

  return apiSuccess(result);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, createAuthorSchema);
  const author = await createAuthor(payload.name);

  return apiSuccess(author, 201);
});
