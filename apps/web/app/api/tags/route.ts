import { apiSuccess, parseJsonBody, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { createTagSchema } from "@/lib/server/books-schemas";
import { createTag, listTags } from "@/lib/server/catalog-service";

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
