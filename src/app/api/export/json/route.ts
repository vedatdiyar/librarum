import { withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { exportAllBooks } from "@/server/books-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const allBooks = await exportAllBooks();

  return new Response(JSON.stringify(allBooks, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="librarum_export.json"'
    }
  });
});
