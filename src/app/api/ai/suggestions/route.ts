import { NextRequest } from "next/server";
import { apiSuccess, withApiHandler, ApiError } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getCuratorInstance } from "@/server/curator-factory";
import { getLatestReport, getReportById } from "@/server/report-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for POST (report generation)

/**
 * GET /api/ai/suggestions
 * Returns the latest monthly curator report
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  await requireSession();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const report = id 
    ? await getReportById(id)
    : await getLatestReport();

  if (id && !report) {
    // Return error if specific report was requested but not found or invalid
    return apiSuccess({ 
      report: null,
      error: {
        message: "Arşiv kaydı bulunamadı veya geçersiz format. Lütfen başka bir rapor seçin.",
        reportId: id
      }
    });
  }

  return apiSuccess({ report });
});

/**
 * POST /api/ai/suggestions
 * Triggers manual monthly report regeneration (with 1-hour cooldown)
 */
export const POST = withApiHandler(async () => {
  await requireSession();
  const curator = getCuratorInstance();
  const result = await curator.generateMonthlyReport();

  if (result.success) {
    const report = await getLatestReport();
    return apiSuccess({ report, regenerated: true });
  } else {
    // If it's a cooldown error (contains 'recently'), return 429
    const errorLower = result.error?.toLowerCase() || "";
    const isCooldown = errorLower.includes("recently");
    const isQuota = errorLower.includes("quota") || errorLower.includes("429") || errorLower.includes("exhausted");
    
    const status = (isCooldown || isQuota) ? 429 : 500;
    
    throw new ApiError(status, result.error || "Analiz raporu oluşturulamadı.");

  }
});

