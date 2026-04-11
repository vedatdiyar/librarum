import { apiSuccess, parseJsonBody, parseSearchParams, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { entityListQuerySchema, createEntitySchema } from "@/server/books-schemas";
import { createPublisher, listPublishers } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request: Request) => {
  await requireSession();
  const query = parseSearchParams(request, entityListQuerySchema);
  const publishers = await listPublishers(query.q);

  return apiSuccess(publishers);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, createEntitySchema);
  const publisher = await createPublisher(payload.name);

  return apiSuccess(publisher, 201);
});
