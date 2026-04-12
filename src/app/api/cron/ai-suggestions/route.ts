import { ApiError, apiSuccess, withApiHandler } from "@/server/api";
import { assertCronAuthorized } from "@/server/cron-auth";
import { getCuratorInstance } from "@/server/ai/curator-factory";
import { createDb } from "@/db";

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
  
  const db = createDb();
  const systemUser = await db.query.users.findFirst();

  if (!systemUser) {
    throw new ApiError(500, "Sistemde kullanıcı bulunamadı. Cron işlemi gerçekleştirilemiyor.");
  }

  const curator = getCuratorInstance();
  const result = await curator.generateMonthlyReport(systemUser.id);

  if (!result.success) {
    // Treat "too recently" errors as 429 Too Many Requests
    if (result.error?.includes("too recently") || result.error?.includes("henüz oluşturuldu")) {
      throw new ApiError(429, result.error);
    }
    
    throw new ApiError(500, result.error || "Report generation failed.");
  }

  return apiSuccess({
    success: true,
    reportId: result.reportId,
    generatedAt: new Date().toISOString(),
  });
});
