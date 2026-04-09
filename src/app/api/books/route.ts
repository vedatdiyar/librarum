import { apiSuccess, parseJsonBody, parseSearchParams, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { createBookSchema, listBooksQuerySchema } from "@/server/books-schemas";
import { createBook, listBooks } from "@/server/books-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request: Request) => {
  await requireSession();
  const query = parseSearchParams(request, listBooksQuerySchema);
  const response = await listBooks(query);

  return apiSuccess(response);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, createBookSchema);
  const result = await createBook(payload);

  return apiSuccess(result, result.action === "created" ? 201 : 200);
});
