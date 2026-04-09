import { apiMessage, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { uuidSchema } from "@/server/books-schemas";
import { deleteTag } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

type TagRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const DELETE = withApiHandler(async (_request: Request, context: TagRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const tagId = uuidSchema.parse(id);
  await deleteTag(tagId);

  return apiMessage("Tag deleted.");
});
