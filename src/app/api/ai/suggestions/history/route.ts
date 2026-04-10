import { apiSuccess, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { listReports } from "@/server/report-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ai/suggestions/history
 * Returns a list of all historical curator reports
 */
export const GET = withApiHandler(async () => {
  await requireSession();
  const reports = await listReports(50, 0); // Get last 50 reports

  return apiSuccess({ reports });
});
