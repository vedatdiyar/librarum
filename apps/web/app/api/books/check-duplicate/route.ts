import { apiSuccess, parseJsonBody, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { duplicateCheckSchema } from "@/lib/server/books-schemas";
import { checkDuplicateBook } from "@/lib/server/books-intelligence";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, duplicateCheckSchema);
  const result = await checkDuplicateBook(payload);

  return apiSuccess(result);
});
