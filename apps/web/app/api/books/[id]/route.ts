import { apiMessage, apiSuccess, parseJsonBody, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { updateBookSchema, uuidSchema } from "@/lib/server/books-schemas";
import { deleteBook, getBookDetail, updateBook } from "@/lib/server/books-service";

export const dynamic = "force-dynamic";

type BookRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = withApiHandler(async (_request: Request, context: BookRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const bookId = uuidSchema.parse(id);
  const book = await getBookDetail(bookId);

  return apiSuccess(book);
});

export const PATCH = withApiHandler(async (request: Request, context: BookRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const bookId = uuidSchema.parse(id);
  const payload = await parseJsonBody(request, updateBookSchema);
  const book = await updateBook(bookId, payload);

  return apiSuccess(book);
});

export const DELETE = withApiHandler(async (_request: Request, context: BookRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const bookId = uuidSchema.parse(id);
  await deleteBook(bookId);

  return apiMessage("Book deleted.");
});
