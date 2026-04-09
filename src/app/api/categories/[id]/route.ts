import { apiMessage, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { uuidSchema } from "@/server/books-schemas";
import { deleteCategory } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

type CategoryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const DELETE = withApiHandler(
  async (_request: Request, context: CategoryRouteContext) => {
    await requireSession();
    const { id } = await context.params;
    const categoryId = uuidSchema.parse(id);
    await deleteCategory(categoryId);

    return apiMessage("Category deleted.");
  }
);
