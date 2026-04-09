import { apiSuccess, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getCategoryDistribution } from "@/server/stats-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const distribution = await getCategoryDistribution();

  return apiSuccess(distribution);
});
