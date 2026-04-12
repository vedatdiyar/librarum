/**
 * Curator Factory - Dependency Injection Entry Point
 * Initializes and orchestrates all curator services
 */

import "server-only";

import {
  getLibraryDNA,
  getStructuralGaps,
  getScoringSignals,
} from "@/server/ai/library-analyzer";
import {
  getLatestReport,
  orchestrateMonthlyReportGeneration,
} from "@/server/ai/report-service";
import type {
  LibraryDNA,
  StructuralGaps,
  ScoredBook,
} from "@/types/curator";
// Curator services orchestration

// ============================================================
// Curator Instance Type
// ============================================================

export type CuratorInstance = {
  // Analysis
  analyzeLibraryDNA: () => Promise<LibraryDNA>;
  analyzeStructuralGaps: () => Promise<StructuralGaps>;
  scoredUnreadBooks: () => Promise<ScoredBook[]>;

  // Report Generation
  generateMonthlyReport: (userId?: string) => Promise<{
    success: boolean;
    reportId?: string;
    error?: string;
  }>;
  getLatestMonthlyReport: () => Promise<any>;
};

// ============================================================
// Factory Function
// ============================================================

/**
 * Initializes curator with all services pre-configured
 * Call once at application startup or per-request based on your needs
 */
export function initializeCurator(): CuratorInstance {
  return {
    // ============================================================
    // Analysis Methods
    // ============================================================

    /**
     * Extracts compressed library DNA
     */
    analyzeLibraryDNA: async () => {
      try {
        return await getLibraryDNA();
      } catch (error) {
        throw new Error(
          `Library DNA analysis failed: ${error instanceof Error ? error.message : error}`
        );
      }
    },

    /**
     * Identifies structural gaps (missing volumes, abandoned authors)
     */
    analyzeStructuralGaps: async () => {
      try {
        return await getStructuralGaps();
      } catch (error) {
        throw new Error(
          `Structural gaps analysis failed: ${error instanceof Error ? error.message : error}`
        );
      }
    },

    /**
     * Generates scored recommendations for unread books
     */
    scoredUnreadBooks: async () => {
      try {
        return await getScoringSignals();
      } catch (error) {
        throw new Error(
          `Scoring signals generation failed: ${error instanceof Error ? error.message : error}`
        );
      }
    },

    // ============================================================
    // Report Generation Methods
    // ============================================================

    /**
     * Full orchestration: DNA → Gemini → Storage
     * Returns result with report ID or error
     */
    generateMonthlyReport: async (userId?: string) => {
      try {
        const dna = await getLibraryDNA();
        return await orchestrateMonthlyReportGeneration(dna, userId);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },

    /**
     * Retrieves latest stored monthly report
     */
    getLatestMonthlyReport: async () => {
      try {
        return await getLatestReport();
      } catch (error) {
        throw new Error(
          `Failed to retrieve latest report: ${error instanceof Error ? error.message : error}`
        );
      }
    },
  };
}

// ============================================================
// Pre-configured Singleton (Optional)
// ============================================================

let curatorInstance: CuratorInstance | null = null;

/**
 * Gets or creates singleton curator instance
 * Use this if you want one curator per app lifetime
 */
export function getCuratorInstance(): CuratorInstance {
  if (!curatorInstance) {
    curatorInstance = initializeCurator();
  }
  return curatorInstance;
}

/**
 * Resets singleton instance (for testing)
 */
export function resetCuratorInstance(): void {
  curatorInstance = null;
}
