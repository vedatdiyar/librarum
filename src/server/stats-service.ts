import { asc, countDistinct, eq, sql } from "drizzle-orm";
import { authors, bookAuthors, books, categories, createDb } from "@/db";
import type {
  AuthorDistributionPoint,
  CategoryDistributionPoint,
  FavoriteAuthor,
  StatsSnapshot,
  StatusBreakdownPoint,
  TimeSeriesPoint
} from "@/types";
import { listRecentBooks } from "@/server/books-service";
import { normalizeCount, normalizeFloat } from "@/lib/helpers";

const STATUS_ORDER: StatusBreakdownPoint["status"][] = [
  "owned",
  "completed",
  "abandoned",
  "loaned",
  "lost"
];


export async function getCategoryDistribution(): Promise<CategoryDistributionPoint[]> {
  const db = createDb();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      count: countDistinct(books.id)
    })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(sql`count(distinct ${books.id}) desc`, asc(categories.name));

  return rows.map((row) => ({
    id: row.id ?? null,
    name: row.name ?? "Uncategorized",
    count: normalizeCount(row.count)
  }));
}

export async function getFavoriteAuthors(): Promise<FavoriteAuthor[]> {
  const db = createDb();
  const favoriteRows = await db.execute(sql`
    with author_ratings as (
      select
        ${authors.id} as id,
        ${authors.name} as name,
        ${authors.slug} as slug,
        round(avg(${books.rating})::numeric, 2) as average_rating,
        count(distinct ${books.id}) as rated_books
      from ${authors}
      inner join ${bookAuthors} on ${bookAuthors.authorId} = ${authors.id}
      inner join ${books} on ${books.id} = ${bookAuthors.bookId}
      where ${books.rating} is not null
      group by ${authors.id}, ${authors.name}, ${authors.slug}
    ),
    top_rating as (
      select max(average_rating) as average_rating from author_ratings
    )
    select
      author_ratings.id,
      author_ratings.name,
      author_ratings.slug,
      author_ratings.average_rating,
      author_ratings.rated_books
    from author_ratings
    cross join top_rating
    where author_ratings.average_rating = top_rating.average_rating
    order by author_ratings.name asc
  `);

  return favoriteRows.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    averageRating: normalizeFloat(row.average_rating as number | string),
    ratedBooks: normalizeCount(row.rated_books as number | string)
  }));
}

async function getStatusBreakdown(): Promise<StatusBreakdownPoint[]> {
  const db = createDb();
  const rows = await db
    .select({
      status: books.status,
      count: countDistinct(books.id)
    })
    .from(books)
    .groupBy(books.status);

  const countsByStatus = new Map(
    rows.map((row) => [row.status, normalizeCount(row.count)])
  );

  return STATUS_ORDER.map((status) => ({
    status,
    count: countsByStatus.get(status) ?? 0
  }));
}

async function getCompletedByYear(): Promise<TimeSeriesPoint[]> {
  const db = createDb();
  const rows = await db
    .select({
      period: sql<string>`${books.readYear}::text`,
      count: countDistinct(books.id)
    })
    .from(books)
    .where(sql`${books.status} = 'completed' and ${books.readYear} is not null`)
    .groupBy(books.readYear)
    .orderBy(books.readYear);

  return rows.map((row) => ({
    period: row.period,
    count: normalizeCount(row.count)
  }));
}

async function getCompletedByMonth(): Promise<TimeSeriesPoint[]> {
  const db = createDb();
  const rows = await db.execute(sql`
    select
      concat(${books.readYear}, '-', lpad(${books.readMonth}::text, 2, '0')) as period,
      count(distinct ${books.id}) as count
    from ${books}
    where ${books.status} = 'completed'
      and ${books.readYear} is not null
      and ${books.readMonth} is not null
    group by ${books.readYear}, ${books.readMonth}
    order by ${books.readYear} asc, ${books.readMonth} asc
  `);

  return rows.rows.map((row) => ({
    period: String(row.period),
    count: normalizeCount(row.count as number | string)
  }));
}

async function getAuthorDistribution(): Promise<AuthorDistributionPoint[]> {
  const db = createDb();
  const rows = await db
    .select({
      id: authors.id,
      name: authors.name,
      slug: authors.slug,
      count: countDistinct(bookAuthors.bookId)
    })
    .from(authors)
    .innerJoin(bookAuthors, eq(bookAuthors.authorId, authors.id))
    .groupBy(authors.id)
    .orderBy(sql`count(distinct ${bookAuthors.bookId}) desc`, asc(authors.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    count: normalizeCount(row.count)
  }));
}

async function getCollectionGrowth(): Promise<TimeSeriesPoint[]> {
  const db = createDb();
  const rows = await db.execute(sql`
    select
      to_char(date_trunc('month', ${books.createdAt}), 'YYYY-MM') as period,
      count(distinct ${books.id}) as count
    from ${books}
    group by date_trunc('month', ${books.createdAt})
    order by date_trunc('month', ${books.createdAt}) asc
  `);

  return rows.rows.map((row) => ({
    period: String(row.period),
    count: normalizeCount(row.count as number | string)
  }));
}

async function getTotals() {
  const db = createDb();
  const [totalsRow, favoriteAuthors] = await Promise.all([
    db.execute(sql`
      select
        count(distinct ${books.id}) as total_books,
        coalesce(sum(${books.copyCount}), 0) as total_copies,
        count(distinct case when ${books.status} = 'completed' then ${books.id} end) as completed_books,
        count(distinct case when ${books.status} = 'owned' then ${books.id} end) as unread_books,
        count(distinct case when ${books.status} = 'loaned' then ${books.id} end) as loaned_books,
        count(distinct case when ${books.status} = 'abandoned' then ${books.id} end) as abandoned_books,
        count(distinct case when ${books.status} = 'lost' then ${books.id} end) as lost_books
      from ${books}
    `),
    getFavoriteAuthors()
  ]);

  const row = totalsRow.rows[0] ?? {};

  return {
    totalBooks: normalizeCount(row.total_books as number | string),
    totalCopies: normalizeCount(row.total_copies as number | string),
    completedBooks: normalizeCount(row.completed_books as number | string),
    unreadBooks: normalizeCount(row.unread_books as number | string),
    loanedBooks: normalizeCount(row.loaned_books as number | string),
    abandonedBooks: normalizeCount(row.abandoned_books as number | string),
    lostBooks: normalizeCount(row.lost_books as number | string),
    favoriteAuthorsCount: favoriteAuthors.length
  };
}

export async function getStatsSnapshot(): Promise<StatsSnapshot> {
  const [
    totals,
    statusBreakdown,
    recentAdditions,
    completedByYear,
    completedByMonth,
    categoryDistribution,
    authorDistribution,
    collectionGrowth
  ] = await Promise.all([
    getTotals(),
    getStatusBreakdown(),
    listRecentBooks(5),
    getCompletedByYear(),
    getCompletedByMonth(),
    getCategoryDistribution(),
    getAuthorDistribution(),
    getCollectionGrowth()
  ]);

  return {
    totals,
    statusBreakdown,
    recentAdditions,
    completedByYear,
    completedByMonth,
    categoryDistribution,
    authorDistribution,
    collectionGrowth
  };
}
