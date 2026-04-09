import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { createCategorySchema } from "@/server/books-schemas";
import { createCategory, listCategories } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const categories = await listCategories();

  return apiSuccess(categories);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, createCategorySchema);
  const category = await createCategory(payload.name);

  return apiSuccess(category, 201);
});
