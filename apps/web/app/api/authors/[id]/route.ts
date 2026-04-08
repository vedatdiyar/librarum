import { apiSuccess, parseJsonBody, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { updateAuthorSchema, uuidSchema } from "@/lib/server/books-schemas";
import { getAuthorDetail, updateAuthor } from "@/lib/server/catalog-service";

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
