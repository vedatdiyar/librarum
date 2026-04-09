import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { updateAuthorSchema, uuidSchema } from "@/server/books-schemas";
import { getAuthorDetail, updateAuthor } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

type AuthorRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = withApiHandler(async (_request: Request, context: AuthorRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const authorId = uuidSchema.parse(id);
  const author = await getAuthorDetail(authorId);

  return apiSuccess(author);
});

export const PATCH = withApiHandler(async (request: Request, context: AuthorRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const authorId = uuidSchema.parse(id);
  const payload = await parseJsonBody(request, updateAuthorSchema);
  const author = await updateAuthor(authorId, payload.name);

  return apiSuccess(author);
});
