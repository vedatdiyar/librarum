import { apiSuccess, withApiHandler } from "@/server/api";
import { assertCronAuthorized } from "@/server/cron-auth";
import { getCuratorInstance } from "@/server/ai/curator-factory";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for report generation
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/ai-suggestions
 * Vercel Cron endpoint: Regenerates monthly curator report
 * Requires CRON_SECRET in Authorization header
 */
export const GET = withApiHandler(async (request: Request) => {
  assertCronAuthorized(request);
  
  const curator = getCuratorInstance();
  const result = await curator.generateMonthlyReport();

  return apiSuccess({
    success: result.success,
    reportId: result.reportId,
    error: result.error,
    generatedAt: new Date().toISOString(),
  });
});
