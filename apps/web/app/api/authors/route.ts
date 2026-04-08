import { apiSuccess, parseJsonBody, parseSearchParams, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { authorListQuerySchema, createAuthorSchema } from "@/lib/server/books-schemas";
import { createAuthor, listAuthors } from "@/lib/server/catalog-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request: Request) => {
  await requireSession();
  const query = parseSearchParams(request, authorListQuerySchema);
  const authors = await listAuthors(query.q);

  return apiSuccess(authors);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, createAuthorSchema);
  const author = await createAuthor(payload.name);

  return apiSuccess(author, 201);
});
