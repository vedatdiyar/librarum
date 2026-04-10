/**
 * Library Analyzer - DNA Extraction & Structural Analysis
 * Analyzes library data to create compressed semantic summaries
 */

import {
  and,
  avg,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  lt,
  max,
  sql,
} from "drizzle-orm";
import {
  authors,
  bookAuthors,
  bookSeries,
  books,
  categories,
  createDb,
  series,
} from "@/db";
import { z } from "zod";
import type {
  LibraryDNA,
  CategoryBreakdown,
  AuthorCluster,
  StructuralGaps,
  MissingVolumeGap,
  AbandonedAuthor,
  ScoredBook,
  ScoringFactors,
} from "@/types/curator";

const db = createDb();

// ============================================================
// Zod Schemas for Validation
// ============================================================

const CategoryBreakdownSchema = z.object({
  category: z.string(),
  count: z.number().int().positive(),
  percentage: z.number().min(0).max(100),
  avgRating: z.number().min(0.5).max(5).nullable(),
});

const AuthorClusterSchema = z.object({
  author: z.string(),
  bookCount: z.number().int().positive(),
  avgRating: z.number().min(0.5).max(5).nullable(),
  completionRate: z.number().min(0).max(1),
});

const LibraryDNASchema = z.object({
  totalBooks: z.number().int(),
  unreadCount: z.number().int(),
  unreadPercentage: z.number().min(0).max(100),
  topCategories: z.array(CategoryBreakdownSchema),
  topAuthors: z.array(AuthorClusterSchema),
  seriesCompletion: z.object({
    completedSeriesCount: z.number().int(),
    incompleteSeriesCount: z.number().int(),
    completionRate: z.number().min(0).max(1),
  }),
  growthVelocity: z.object({
    last30Days: z.number().int(),
    last90Days: z.number().int(),
    avgPerMonth: z.number(),
  }),
  readingTrend: z.enum(["accelerating", "stable", "slowing"]),
});

// ============================================================
// Core DNA Extraction
// ============================================================

/**
 * Extracts compressed library DNA - semantic summary of library state
 * Returns top 3 categories/authors (not exhaustive lists) for token efficiency
 */
export async function getLibraryDNA(): Promise<LibraryDNA> {
  // Get total book count and unread count
  const bookStats = await db
    .select({
      total: count(),
      unread: count(sql`CASE WHEN ${books.status} = 'owned' THEN 1 END`),
    })
    .from(books);

  const totalBooks = bookStats[0]?.total ?? 0;
  const unreadCount = bookStats[0]?.unread ?? 0;
  const unreadPercentage = totalBooks > 0 ? (unreadCount / totalBooks) * 100 : 0;

  // Get category breakdown (top 3)
  const categoryData = await db
    .select({
      categoryId: books.categoryId,
      categoryName: categories.name,
      count: count().as("count"),
      avgRating: avg(books.rating).as("avg_rating"),
    })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .groupBy(books.categoryId, categories.name)
    .orderBy(desc(count()))
    .limit(3);

  const topCategories: CategoryBreakdown[] = categoryData
    .map((cat) => ({
      category: cat.categoryName || "Uncategorized",
      count: cat.count,
      percentage: totalBooks > 0 ? (cat.count / totalBooks) * 100 : 0,
      avgRating:
        cat.avgRating !== null ? parseFloat(cat.avgRating.toString()) : null,
    }));

  // Get author data (top 3 by book count, with completion rate)
  const authorData = await db
    .select({
      authorId: authors.id,
      authorName: authors.name,
      bookCount: count(bookAuthors.bookId).as("book_count"),
      avgRating: avg(books.rating).as("avg_rating"),
      completedCount: count(
        sql`CASE WHEN ${books.status} = 'completed' THEN 1 END`
      ).as("completed"),
    })
    .from(authors)
    .innerJoin(bookAuthors, eq(authors.id, bookAuthors.authorId))
    .innerJoin(books, eq(bookAuthors.bookId, books.id))
    .groupBy(authors.id, authors.name)
    .orderBy(desc(count(bookAuthors.bookId)))
    .limit(3);

  const topAuthors: AuthorCluster[] = authorData.map((auth) => ({
    author: auth.authorName,
    bookCount: auth.bookCount,
    avgRating:
      auth.avgRating !== null ? parseFloat(auth.avgRating.toString()) : null,
    completionRate: auth.bookCount > 0 ? auth.completedCount / auth.bookCount : 0,
  }));

  // Get series completion rates
  const seriesStats = await db
    .select({
      seriesId: series.id,
      totalVolumes: series.totalVolumes,
      ownedVolumes: count(books.id).as("owned"),
    })
    .from(series)
    .leftJoin(bookSeries, eq(series.id, bookSeries.seriesId))
    .leftJoin(books, eq(bookSeries.bookId, books.id))
    .groupBy(series.id, series.totalVolumes);

  const completedSeriesCount = seriesStats.filter(
    (s) => s.ownedVolumes === s.totalVolumes
  ).length;
  const incompleteSeriesCount = seriesStats.length - completedSeriesCount;
  const overallSeriesCompletion =
    seriesStats.length > 0
      ? completedSeriesCount / seriesStats.length
      : 0;

  // Get growth velocity (last 30 days, 90 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const growthStats = await db
    .select({
      last30: count(sql`CASE WHEN ${books.createdAt} >= ${thirtyDaysAgo} THEN 1 END`).as("last_30"),
      last90: count(sql`CASE WHEN ${books.createdAt} >= ${ninetyDaysAgo} THEN 1 END`).as("last_90"),
    })
    .from(books);

  const last30Days = growthStats[0]?.last30 ?? 0;
  const last90Days = growthStats[0]?.last90 ?? 0;
  const avgPerMonth = last90Days > 0 ? last90Days / 3 : 0;

  // Determine reading trend
  let readingTrend: "accelerating" | "stable" | "slowing" = "stable";
  if (last30Days > 0 && last90Days > 0) {
    const rate30 = last30Days;
    const rate60_90 = last90Days - last30Days;
    if (rate30 > rate60_90 * 1.2) {
      readingTrend = "accelerating";
    } else if (rate30 < rate60_90 * 0.8) {
      readingTrend = "slowing";
    }
  }

  const dna: LibraryDNA = {
    totalBooks,
    unreadCount,
    unreadPercentage: Math.round(unreadPercentage * 100) / 100,
    topCategories,
    topAuthors,
    seriesCompletion: {
      completedSeriesCount,
      incompleteSeriesCount,
      completionRate: Math.round(overallSeriesCompletion * 100) / 100,
    },
    growthVelocity: {
      last30Days,
      last90Days,
      avgPerMonth: Math.round(avgPerMonth * 100) / 100,
    },
    readingTrend,
  };

  return LibraryDNASchema.parse(dna);
}

// ============================================================
// Structural Gaps Analysis
// ============================================================

/**
 * Identifies missing series volumes and abandoned authors
 */
export async function getStructuralGaps(): Promise<StructuralGaps> {
  // Get all series with book counts
  const seriesWithBooks = await db
    .select({
      seriesId: series.id,
      seriesName: series.name,
      totalVolumes: series.totalVolumes,
      bookId: bookSeries.bookId,
      seriesOrder: bookSeries.seriesOrder,
    })
    .from(series)
    .leftJoin(bookSeries, eq(series.id, bookSeries.seriesId))
    .orderBy(series.name, bookSeries.seriesOrder);

  // Group by series and find gaps
  const seriesByName = new Map<
    string,
    { id: string; total: number; owned: number[] }
  >();
  for (const row of seriesWithBooks) {
    if (!seriesByName.has(row.seriesName)) {
      seriesByName.set(row.seriesName, {
        id: row.seriesId,
        total: row.totalVolumes ?? 0,
        owned: [],
      });
    }
    if (row.seriesOrder !== null && row.bookId !== null) {
      seriesByName.get(row.seriesName)!.owned.push(row.seriesOrder);
    }
  }

  const missingVolumes: MissingVolumeGap[] = [];
  for (const [name, data] of seriesByName) {
    if (data.total <= 0) {
      continue;
    }

    if (data.owned.length > 0 && data.owned.length < data.total) {
      const ownedSet = new Set(data.owned);
      const missing: number[] = [];
      for (let i = 1; i <= data.total; i++) {
        if (!ownedSet.has(i)) {
          missing.push(i);
        }
      }
      if (missing.length > 0) {
        missingVolumes.push({
          series: name,
          totalVolumes: data.total,
          ownedVolumes: Array.from(ownedSet).sort((a, b) => a - b),
          missingVolumes: missing,
          firstMissing: Math.min(...missing),
        });
      }
    }
  }

  // Find abandoned authors (started series but incomplete)
  const abandonedAuthors: AbandonedAuthor[] = [];
  const authorSeriesData = await db
    .select({
      authorId: authors.id,
      authorName: authors.name,
      seriesId: series.id,
      seriesName: series.name,
      totalVolumes: series.totalVolumes,
      ownedVolumes: count(books.id).as("owned"),
      lastReadDate: max(books.readYear).as("last_read_year"),
    })
    .from(authors)
    .innerJoin(bookAuthors, eq(authors.id, bookAuthors.authorId))
    .innerJoin(books, eq(bookAuthors.bookId, books.id))
    .leftJoin(bookSeries, eq(books.id, bookSeries.bookId))
    .leftJoin(series, eq(bookSeries.seriesId, series.id))
    .groupBy(authors.id, authors.name, series.id, series.name, series.totalVolumes);

  const authorMap = new Map<string, AbandonedAuthor>();
  for (const row of authorSeriesData) {
    if (
      row.seriesId &&
      row.totalVolumes !== null &&
      row.totalVolumes > 0 &&
      row.ownedVolumes < row.totalVolumes
    ) {
      const authorKey = row.authorId;
      if (!authorMap.has(authorKey)) {
        authorMap.set(authorKey, {
          author: row.authorName,
          startedSeries: [],
          unfinishedCount: 0,
          lastReadDate: null,
        });
      }
      const author = authorMap.get(authorKey)!;
      author.startedSeries.push({
        series: row.seriesName ?? "Unknown Series",
        totalVolumes: row.totalVolumes,
        ownedVolumes: row.ownedVolumes,
        completionRate: row.ownedVolumes / row.totalVolumes,
        avgRating: null,
      });
      author.unfinishedCount++;
    }
  }

  return {
    missingVolumes: missingVolumes.sort(
      (a, b) => a.firstMissing - b.firstMissing
    ),
    abandonedAuthors: Array.from(authorMap.values()),
  };
}

// ============================================================
// Scoring Signals
// ============================================================

/**
 * Generates composite scores for all unread books based on:
 * - User interest (rating of books by same author/category)
 * - Series completion priority
 * - Abandoned author recovery
 */
export async function getScoringSignals(): Promise<ScoredBook[]> {
  // Get all unread books with their authors and series info
  const unreadBooks = await db
    .select({
      bookId: books.id,
      title: books.title,
      rating: books.rating,
      categoryId: books.categoryId,
      seriesId: bookSeries.seriesId,
      seriesOrder: bookSeries.seriesOrder,
      authorId: bookAuthors.authorId,
      authorName: authors.name,
    })
    .from(books)
    .leftJoin(bookAuthors, eq(books.id, bookAuthors.bookId))
    .leftJoin(authors, eq(bookAuthors.authorId, authors.id))
    .leftJoin(bookSeries, eq(books.id, bookSeries.bookId))
    .where(eq(books.status, "owned"));

  if (unreadBooks.length === 0) {
    return [];
  }

  // Get average ratings by author/category for scoring
  const authorRatings = await db
    .select({
      authorId: authors.id,
      avgRating: avg(books.rating).as("avg_rating"),
    })
    .from(authors)
    .innerJoin(bookAuthors, eq(authors.id, bookAuthors.authorId))
    .innerJoin(
      books,
      and(
        eq(bookAuthors.bookId, books.id),
        eq(books.status, "completed")
      )
    )
    .groupBy(authors.id);

  const authorRatingMap = new Map(
    authorRatings.map((r) => [
      r.authorId,
      r.avgRating ? parseFloat(r.avgRating.toString()) : 0,
    ])
  );

  const categoryRatings = await db
    .select({
      categoryId: categories.id,
      avgRating: avg(books.rating).as("avg_rating"),
    })
    .from(categories)
    .innerJoin(
      books,
      and(
        eq(categories.id, books.categoryId),
        eq(books.status, "completed")
      )
    )
    .groupBy(categories.id);

  const categoryRatingMap = new Map(
    categoryRatings.map((r) => [
      r.categoryId,
      r.avgRating ? parseFloat(r.avgRating.toString()) : 0,
    ])
  );

  // Group by book and calculate scores
  const bookGroups = new Map<string, (typeof unreadBooks)[0][]>();
  for (const book of unreadBooks) {
    if (!bookGroups.has(book.bookId)) {
      bookGroups.set(book.bookId, []);
    }
    bookGroups.get(book.bookId)!.push(book);
  }

  const scoredBooks: ScoredBook[] = [];
  for (const [bookId, bookRows] of bookGroups) {
    const firstRow = bookRows[0];

    // Calculate interest rating (avg of author/category interest)
    const authorInterest = authorRatingMap.get(firstRow.authorId ?? "") ?? 0;
    const categoryInterest = categoryRatingMap.get(firstRow.categoryId ?? "") ?? 0;
    const interestRating = (authorInterest + categoryInterest) / 2;

    // Determine completion priority factors
    const isSeriesGap = firstRow.seriesId !== undefined && firstRow.seriesOrder !== null;
    const gaps = await getStructuralGaps();
    const isAbandonedAuthor = gaps.abandonedAuthors.some(
      (a) => bookRows.some((br) => br.authorName === a.author)
    );

    const completionPriority = (
      (isSeriesGap ? 30 : 0) +
      (isAbandonedAuthor ? 20 : 0) +
      (interestRating > 3.5 ? 20 : 10)
    );

    const compositeScore =
      interestRating * 0.6 * 20 + // Convert to 0-100 scale
      completionPriority * 0.4;

    scoredBooks.push({
      id: bookId,
      title: firstRow.title,
      author: firstRow.authorName || "Unknown",
      rating: firstRow.rating ? parseFloat(firstRow.rating.toString()) : null,
      series: null, // To be populated if needed
      seriesOrder: firstRow.seriesOrder,
      factors: {
        interestRating,
        completionPriority,
        isSeriesGap,
        isAbandonedAuthor,
        userPreferenceMatch:
          authorInterest > 0 ? Math.min(authorInterest / 5, 1) : 0.5,
      },
      compositeScore: Math.round(Math.min(compositeScore, 100)),
    });
  }

  return scoredBooks.sort((a, b) => b.compositeScore - a.compositeScore);
}
