import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { createTagSchema } from "@/server/books-schemas";
import { createTag, listTags } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const tags = await listTags();

  return apiSuccess(tags);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, createTagSchema);
  const tag = await createTag(payload.name);

  return apiSuccess(tag, 201);
});
