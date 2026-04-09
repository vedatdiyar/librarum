import { apiSuccess, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getStatsSnapshot } from "@/server/stats-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const stats = await getStatsSnapshot();

  return apiSuccess(stats);
});
