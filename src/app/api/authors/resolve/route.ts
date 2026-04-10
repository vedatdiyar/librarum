import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { resolveAuthorSchema } from "@/server/books-schemas";
import { resolveAuthorName } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, resolveAuthorSchema);
  const resolution = await resolveAuthorName(payload.name, {
    decision: payload.decision,
    suggestedAuthorId: payload.suggestedAuthorId
  });

  return apiSuccess(resolution, resolution.status === "created" ? 201 : 200);
});
