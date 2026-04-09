import { apiSuccess, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getFavoriteAuthors } from "@/server/stats-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const authors = await getFavoriteAuthors();

  return apiSuccess(authors);
});
