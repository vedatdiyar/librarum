import { apiSuccess, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { getCategoryDistribution } from "@/lib/server/stats-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const distribution = await getCategoryDistribution();

  return apiSuccess(distribution);
});
