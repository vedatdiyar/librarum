import { apiMessage, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { uuidSchema } from "@/lib/server/books-schemas";
import { deleteTag } from "@/lib/server/catalog-service";

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
