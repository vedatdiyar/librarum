/**
 * Curator Engine Type Definitions (v2)
 * Comprehensive types for the new Library Curator system
 */

// ============================================================
// Library DNA (Compressed Summary)
// ============================================================

export type CategoryBreakdown = {
  category: string;
  count: number;
  percentage: number;
  avgRating: number | null;
};

export type AuthorCluster = {
  author: string;
  bookCount: number;
  avgRating: number | null;
  completionRate: number; // 0-1
};

export type SeriesSnapshot = {
  series: string;
  totalVolumes: number;
  ownedVolumes: number;
  completionRate: number; // 0-1
  avgRating: number | null;
};

export type LibraryDNA = {
  totalBooks: number;
  unreadCount: number;
  unreadPercentage: number;
  topCategories: CategoryBreakdown[]; // Top 3
  topAuthors: AuthorCluster[]; // Top 3
  seriesCompletion: {
    completedSeriesCount: number;
    incompleteSeriesCount: number;
    completionRate: number; // 0-1
  };
  growthVelocity: {
    last30Days: number;
    last90Days: number;
    avgPerMonth: number;
  };
  readingTrend: "accelerating" | "stable" | "slowing";
};

// ============================================================
// Structural Analysis
// ============================================================

export type MissingVolumeGap = {
  series: string;
  totalVolumes: number;
  ownedVolumes: number[];
  missingVolumes: number[];
  firstMissing: number;
};

export type AbandonedAuthor = {
  author: string;
  startedSeries: SeriesSnapshot[];
  unfinishedCount: number;
  lastReadDate: Date | null;
};

export type StructuralGaps = {
  missingVolumes: MissingVolumeGap[];
  abandonedAuthors: AbandonedAuthor[];
};

// ============================================================
// Scoring Signals
// ============================================================

export type ScoringFactors = {
  interestRating: number; // 0-5
  completionPriority: number; // 0-100
  isSeriesGap: boolean;
  isAbandonedAuthor: boolean;
  userPreferenceMatch: number; // 0-1
};

export type ScoredBook = {
  id: string;
  title: string;
  author: string;
  rating: number | null;
  series: string | null;
  seriesOrder: number | null;
  factors: ScoringFactors;
  compositeScore: number; // 0-100 (interest*0.6 + completion*0.4)
};

// ============================================================
// Monthly Report (Structured Output)
// ============================================================

export type LibraryPanorama = {
  summary: string; // 2-3 sentence curator overview
  categoryBreakdown: CategoryBreakdown[]; // Detailed breakdown
  authorNetwork: AuthorCluster[]; // Extended author list
  unreadStats: {
    totalUnread: number;
    percentageUnread: number;
    trendDescription: string;
  };
  growthMetrics: {
    booksAddedLastMonth: number;
    booksAddedLastQuarter: number;
    estimatedReadingPace: string; // e.g., "3 books/month"
  };
};

export type CuratedBookRecommendation = {
  bookId: string;
  title: string;
  author: string;
  series?: string;
  seriesPosition?: string; // e.g., "Book 3 of 5"
  reason: string; // Curator's explanation (1-2 sentences)
  scoringExplanation: string; // Why this book scores high
  category: "gap-filling" | "series-completion" | "discovery" | "user-interest";
  score: number; // 0-100
};

export type NextMonthRoute = {
  theme: string; // e.g., "Post-Apocalyptic Classics"
  thematicJustification: string; // Why this theme connects to library DNA
  connectedBooks: Array<{
    bookId: string;
    title: string;
    author: string;
    connectionReason: string;
  }>; // 3-5 books
  suggestedActions: string[]; // e.g., ["Search for..." or "Consider adding..."]
};

export type CuratorMonthlyReport = {
  generatedAt: Date;
  libraryPanorama: LibraryPanorama;
  curatedSelection: CuratedBookRecommendation[]; // 3-5 items
  nextMonthRoute: NextMonthRoute;
};

// ============================================================
// Gemini Response Types
// ============================================================

export type GeminiStructuredResponse = {
  text: string;
};

// ============================================================
// Service Response Types
// ============================================================

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ReportGenerationResult = ApiResponse<{
  report: CuratorMonthlyReport;
  storedId: string;
}>;
