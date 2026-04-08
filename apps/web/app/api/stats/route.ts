import { apiSuccess, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { getStatsSnapshot } from "@/lib/server/stats-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const stats = await getStatsSnapshot();

  return apiSuccess(stats);
});
