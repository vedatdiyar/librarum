import { apiSuccess, parseJsonBody, parseSearchParams, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { authorListQuerySchema, createAuthorSchema } from "@/server/books-schemas";
import { createAuthor, listAuthors } from "@/server/catalog-service";

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
