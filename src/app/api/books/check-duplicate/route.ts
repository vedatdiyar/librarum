import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { duplicateCheckSchema } from "@/server/books-schemas";
import { checkDuplicateBook } from "@/server/books-intelligence";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, duplicateCheckSchema);
  const result = await checkDuplicateBook(payload);

  return apiSuccess(result);
});
