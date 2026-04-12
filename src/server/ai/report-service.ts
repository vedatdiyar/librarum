/**
 * Report Service - Monthly Report Management
 * Handles generation, storage, retrieval, and caching of curator monthly reports
 */

import "server-only";

import { desc, eq } from "drizzle-orm";
import { aiSuggestions, createDb } from "@/db";
import type {
  CuratorMonthlyReport,
  LibraryDNA,
  ApiResponse,
} from "@/types/curator";
import { CuratorMonthlyReportSchema } from "@/server/ai/curator-brain";
import { generateCuratorReport } from "@/server/ai/curator-brain";
import { ApiError } from "@/server/api";

const db = createDb();

// ============================================================
// Report Generation & Storage
// ============================================================

/**
 * Generates a new monthly report if not generated recently
 * Enforces 1-hour cooldown to prevent excessive generation
 */
export async function generateNewReport(
  libraryDNA: LibraryDNA,
  userId?: string
): Promise<ApiResponse<CuratorMonthlyReport>> {
  try {
    // Check if report was recently generated (within 1 hour)
    const lastReport = await db
      .select()
      .from(aiSuggestions)
      .orderBy(desc(aiSuggestions.generatedAt))
      .limit(1);

    if (lastReport.length > 0) {
      const lastGenerated = new Date(lastReport[0].generatedAt);
      const now = new Date();
      const hoursSinceLastGeneration =
        (now.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastGeneration < 1) {
        const minutesUntilNext = Math.ceil(60 - hoursSinceLastGeneration * 60);
        return {
          success: false,
          error: {
            message: `Yeni analiz raporu henüz oluşturuldu. Bir sonraki analiz için ${minutesUntilNext} dakika beklemelisiniz. (Report generated too recently)`,
            details: {
              minutesUntilNext,
              lastGenerated: lastGenerated.toISOString(),
            },
          },
        };
      }

    }

    // Generate new report via Gemini
    const report = await generateCuratorReport(libraryDNA);

    // Validate
    const validated = CuratorMonthlyReportSchema.parse(report);

    // Store in database
    const stored = await db
      .insert(aiSuggestions)
      .values({
        userId: userId ?? null,
        generatedAt: new Date(),
        content: JSON.parse(JSON.stringify(validated)), // Ensure serializable
      })
      .returning();

    if (!stored.length) {
      throw new Error("Failed to store report in database");
    }

    return {
      success: true,
      data: {
        ...validated,
        generatedAt: new Date(stored[0].generatedAt),
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: {
        message: `Report generation failed: ${message}`,
      },
    };
  }
}

/**
 * Retrieves the latest stored report
 */
export async function getLatestReport(): Promise<CuratorMonthlyReport | null> {
  try {
    const latest = await db
      .select()
      .from(aiSuggestions)
      .orderBy(desc(aiSuggestions.generatedAt))
      .limit(20);

    if (latest.length === 0) {
      return null;
    }

    // Skip legacy/invalid rows and return the newest schema-valid report.
    for (const row of latest) {
      const parsed = CuratorMonthlyReportSchema.safeParse(
        row.content as Record<string, unknown>
      );

      if (parsed.success) {
        return {
          ...parsed.data,
          generatedAt: new Date(row.generatedAt),
        };
      }
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to retrieve latest report: ${error}`);
  }
}

/**
 * Stores a report in the database
 */
export async function storeMonthlyReport(
  report: CuratorMonthlyReport,
  userId?: string
): Promise<string> {
  try {
    const validated = CuratorMonthlyReportSchema.parse(report);

    const stored = await db
      .insert(aiSuggestions)
      .values({
        userId: userId ?? null,
        generatedAt: report.generatedAt,
        content: JSON.parse(JSON.stringify(validated)),
      })
      .returning();

    if (!stored.length) {
      throw new Error("Failed to store report");
    }

    return stored[0].id;
  } catch (error) {
    throw new Error(
      `Failed to store monthly report: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Retrieves a report by ID
 */
export async function getReportById(reportId: string): Promise<CuratorMonthlyReport | null> {
  try {
    const result = await db
      .select()
      .from(aiSuggestions)
      .where(eq(aiSuggestions.id, reportId));

    if (result.length === 0) {
      return null;
    }

    const report = result[0].content as Record<string, unknown>;
    const validated = CuratorMonthlyReportSchema.safeParse(report);

    // If schema parsing fails, return null (legacy/invalid format)
    if (!validated.success) {
      console.warn(`Report ${reportId} has invalid schema:`, validated.error);
      return null;
    }

    return {
      ...validated.data,
      generatedAt: new Date(result[0].generatedAt),
    };
  } catch (error) {
    throw new Error(`Failed to retrieve report: ${error}`);
  }
}

/**
 * Lists stored reports (paginated)
 */
export async function listReports(
  limit: number = 10,
  offset: number = 0
): Promise<Array<{ id: string; generatedAt: Date }>> {
  try {
    const results = await db
      .select()
      .from(aiSuggestions)
      .orderBy(desc(aiSuggestions.generatedAt))
      .limit(limit)
      .offset(offset);

    return results.map((r) => ({
      id: r.id,
      generatedAt: new Date(r.generatedAt),
    }));
  } catch (error) {
    throw new Error(`Failed to list reports: ${error}`);
  }
}

// ============================================================
// Orchestration
// ============================================================

/**
 * Full report generation pipeline:
 * 1. Analyze library DNA
 * 2. Generate report via Gemini
 * 3. Validate schema
 * 4. Store in database
 * 5. Return result
 */
export async function orchestrateMonthlyReportGeneration(
  libraryDNA: LibraryDNA,
  userId?: string
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    const result = await generateNewReport(libraryDNA, userId);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || "Unknown error",
      };
    }

    return {
      success: true,
      reportId: (await listReports(1, 0))[0]?.id, // Get just-created report ID
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
