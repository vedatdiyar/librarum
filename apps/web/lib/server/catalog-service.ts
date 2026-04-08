import { asc, countDistinct, eq, ilike, sql } from "drizzle-orm";
import {
  authors,
  bookAuthors,
  bookSeries,
  books,
  categories,
  createDb,
  series,
  tags,
  bookTags
} from "@exlibris/db";
import type {
  AuthorDetail,
  AuthorDetailBook,
  AuthorListItem,
  AuthorOption,
  AuthorRelatedSeries,
  CategoryOption,
  CategoryDistributionPoint,
  SeriesDetail,
  SeriesListItem,
  SeriesOwnedVolume,
  SeriesOption,
  TagOption
} from "@exlibris/types";
import { ApiError, assertFound } from "@/lib/server/api";
import { normalizeCount, normalizeFloat } from "@exlibris/lib";

async function assertNameAvailable(
  table: typeof authors | typeof categories | typeof tags | typeof series,
  nameColumn:
    | typeof authors.name
    | typeof categories.name
    | typeof tags.name
    | typeof series.name,
  name: string,
  excludedId?: string
) {
  const db = createDb();
  const normalizedName = name.trim().toLowerCase();

  const existing = await db
    .select({
      id: table.id
    })
    .from(table)
    .where(
      excludedId
        ? sql`lower(${nameColumn}) = ${normalizedName} and ${table.id} <> ${excludedId}`
        : sql`lower(${nameColumn}) = ${normalizedName}`
    )
    .limit(1);

  if (existing[0]) {
    throw new ApiError(409, "Resource already exists.");
  }
}


function toNullableFloat(value: number | string | null | undefined) {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeCompletionPercentage(
  knownOwnedVolumeCount: number,
  totalVolumes: number | null
) {
  if (!totalVolumes || totalVolumes <= 0) {
    return null;
  }

  return Math.round((knownOwnedVolumeCount / totalVolumes) * 100);
}

export async function listAuthors(query: string | null | undefined): Promise<AuthorListItem[]> {
  const db = createDb();
  const normalizedQuery = query?.trim() ?? "";
  const likeClause = normalizedQuery
    ? sql`where ${authors.name} ilike ${`%${normalizedQuery}%`}`
    : sql``;
  const limitClause = normalizedQuery ? sql`limit 20` : sql``;
  const result = await db.execute(sql`
    select
      ${authors.id} as id,
      ${authors.name} as name,
      count(distinct ${bookAuthors.bookId}) as book_count,
      round((avg(${books.rating}) filter (where ${books.rating} is not null))::numeric, 2) as average_rating
    from ${authors}
    left join ${bookAuthors} on ${bookAuthors.authorId} = ${authors.id}
    left join ${books} on ${books.id} = ${bookAuthors.bookId}
    ${likeClause}
    group by ${authors.id}, ${authors.name}
    order by ${authors.name} asc
    ${limitClause}
  `);

  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    bookCount: normalizeCount(row.book_count as number | string),
    averageRating: toNullableFloat(row.average_rating as number | string | null)
  }));
}

export async function createAuthor(name: string): Promise<AuthorOption> {
  await assertNameAvailable(authors, authors.name, name);

  const db = createDb();
  const created = await db
    .insert(authors)
    .values({
      name
    })
    .returning({
      id: authors.id,
      name: authors.name
    });

  return created[0];
}

export async function updateAuthor(authorId: string, name: string): Promise<AuthorOption> {
  const db = createDb();
  const existing = await db
    .select({
      id: authors.id
    })
    .from(authors)
    .where(eq(authors.id, authorId))
    .limit(1);

  assertFound(existing[0], "Author not found.");
  await assertNameAvailable(authors, authors.name, name, authorId);

  const updated = await db
    .update(authors)
    .set({
      name
    })
    .where(eq(authors.id, authorId))
    .returning({
      id: authors.id,
      name: authors.name
    });

  return updated[0];
}

export async function getAuthorDetail(authorId: string): Promise<AuthorDetail> {
  const db = createDb();
  const authorSummaryResult = await db.execute(sql`
    select
      ${authors.id} as id,
      ${authors.name} as name,
      count(distinct ${bookAuthors.bookId}) as book_count,
      round((avg(${books.rating}) filter (where ${books.rating} is not null))::numeric, 2) as average_rating
    from ${authors}
    left join ${bookAuthors} on ${bookAuthors.authorId} = ${authors.id}
    left join ${books} on ${books.id} = ${bookAuthors.bookId}
    where ${authors.id} = ${authorId}
    group by ${authors.id}, ${authors.name}
    limit 1
  `);
  const authorRow = assertFound(authorSummaryResult.rows[0], "Author not found.");

  const [bookRows, categoryRows, relatedSeriesRows] = await Promise.all([
    db.execute(sql`
      select
        ${books.id} as id,
        ${books.title} as title,
        ${books.status} as status,
        ${books.rating} as rating,
        coalesce(${books.coverCustomUrl}, ${books.coverMetadataUrl}) as cover_url,
        ${series.id} as series_id,
        ${series.name} as series_name,
        ${series.totalVolumes} as series_total_volumes,
        ${bookSeries.seriesOrder} as series_order
      from ${books}
      inner join ${bookAuthors} on ${bookAuthors.bookId} = ${books.id}
      left join ${bookSeries} on ${bookSeries.bookId} = ${books.id}
      left join ${series} on ${series.id} = ${bookSeries.seriesId}
      where ${bookAuthors.authorId} = ${authorId}
      order by lower(${books.title}) asc
    `),
    db.execute(sql`
      select
        ${categories.id} as id,
        coalesce(${categories.name}, 'Uncategorized') as name,
        count(distinct ${books.id}) as count
      from ${books}
      inner join ${bookAuthors} on ${bookAuthors.bookId} = ${books.id}
      left join ${categories} on ${categories.id} = ${books.categoryId}
      where ${bookAuthors.authorId} = ${authorId}
      group by ${categories.id}, ${categories.name}
      order by count(distinct ${books.id}) desc, coalesce(${categories.name}, 'Uncategorized') asc
    `),
    db.execute(sql`
      select
        ${series.id} as id,
        ${series.name} as name,
        ${series.totalVolumes} as total_volumes,
        count(distinct ${bookSeries.bookId}) as owned_count
      from ${series}
      inner join ${bookSeries} on ${bookSeries.seriesId} = ${series.id}
      inner join ${bookAuthors} on ${bookAuthors.bookId} = ${bookSeries.bookId}
      where ${bookAuthors.authorId} = ${authorId}
      group by ${series.id}, ${series.name}, ${series.totalVolumes}
      order by ${series.name} asc
    `)
  ]);

  const booksByAuthor: AuthorDetailBook[] = bookRows.rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    coverUrl: row.cover_url ? String(row.cover_url) : null,
    status: String(row.status) as AuthorDetailBook["status"],
    rating: row.rating == null ? null : normalizeFloat(row.rating as number | string),
    series: row.series_id
      ? {
          id: String(row.series_id),
          name: String(row.series_name),
          totalVolumes: row.series_total_volumes == null
            ? null
            : normalizeCount(row.series_total_volumes as number | string),
          seriesOrder: row.series_order == null
            ? null
            : normalizeCount(row.series_order as number | string)
        }
      : null
  }));

  const categoryDistribution: CategoryDistributionPoint[] = categoryRows.rows.map((row) => ({
    id: row.id ? String(row.id) : null,
    name: String(row.name),
    count: normalizeCount(row.count as number | string)
  }));

  const relatedSeries: AuthorRelatedSeries[] = relatedSeriesRows.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    totalVolumes:
      row.total_volumes == null
        ? null
        : normalizeCount(row.total_volumes as number | string),
    ownedCount: normalizeCount(row.owned_count as number | string)
  }));

  return {
    id: String(authorRow.id),
    name: String(authorRow.name),
    bookCount: normalizeCount(authorRow.book_count as number | string),
    averageRating: toNullableFloat(authorRow.average_rating as number | string | null),
    books: booksByAuthor,
    categoryDistribution,
    relatedSeries
  };
}

export async function listCategories(): Promise<CategoryOption[]> {
  const db = createDb();

  return db
    .select({
      id: categories.id,
      name: categories.name,
      bookCount: countDistinct(books.id)
    })
    .from(categories)
    .leftJoin(books, eq(books.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
}

export async function createCategory(name: string): Promise<CategoryOption> {
  await assertNameAvailable(categories, categories.name, name);

  const db = createDb();
  const created = await db
    .insert(categories)
    .values({
      name
    })
    .returning({
      id: categories.id,
      name: categories.name
    });

  return created[0];
}

export async function deleteCategory(categoryId: string) {
  const db = createDb();
  const existing = await db
    .select({
      id: categories.id
    })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  assertFound(existing[0], "Category not found.");
  await db.delete(categories).where(eq(categories.id, categoryId));
}

export async function listTags(): Promise<TagOption[]> {
  const db = createDb();

  return db
    .select({
      id: tags.id,
      name: tags.name,
      bookCount: countDistinct(bookTags.bookId)
    })
    .from(tags)
    .leftJoin(bookTags, eq(bookTags.tagId, tags.id))
    .groupBy(tags.id)
    .orderBy(asc(tags.name));
}

export async function createTag(name: string): Promise<TagOption> {
  await assertNameAvailable(tags, tags.name, name);

  const db = createDb();
  const created = await db
    .insert(tags)
    .values({
      name
    })
    .returning({
      id: tags.id,
      name: tags.name
    });

  return created[0];
}

export async function deleteTag(tagId: string) {
  const db = createDb();
  const existing = await db
    .select({
      id: tags.id
    })
    .from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);

  assertFound(existing[0], "Tag not found.");
  await db.delete(tags).where(eq(tags.id, tagId));
}

export async function listSeries(): Promise<SeriesOption[]> {
  const db = createDb();
  const result = await db.execute(sql`
    select
      ${series.id} as id,
      ${series.name} as name,
      ${series.totalVolumes} as total_volumes,
      count(distinct ${bookSeries.bookId}) as book_count,
      count(distinct case when ${bookSeries.seriesOrder} is not null then ${bookSeries.seriesOrder} end) as known_owned_count
    from ${series}
    left join ${bookSeries} on ${bookSeries.seriesId} = ${series.id}
    group by ${series.id}, ${series.name}, ${series.totalVolumes}
    order by ${series.name} asc
  `);

  return result.rows.map((row) => {
    const totalVolumes =
      row.total_volumes == null
        ? null
        : normalizeCount(row.total_volumes as number | string);
    const bookCount = normalizeCount(row.book_count as number | string);
    const knownOwnedCount = normalizeCount(row.known_owned_count as number | string);

    return {
      id: String(row.id),
      name: String(row.name),
      totalVolumes,
      bookCount,
      ownedCount: bookCount,
      completionPercentage: computeCompletionPercentage(knownOwnedCount, totalVolumes)
    };
  });
}

export async function createSeries(
  name: string,
  totalVolumes: number | null | undefined
): Promise<SeriesOption> {
  await assertNameAvailable(series, series.name, name);

  const db = createDb();
  const created = await db
    .insert(series)
    .values({
      name,
      totalVolumes: totalVolumes ?? null
    })
    .returning({
      id: series.id,
      name: series.name,
      totalVolumes: series.totalVolumes
    });

  return {
    ...created[0],
    bookCount: 0
  };
}

export async function updateSeries(
  seriesId: string,
  name: string,
  totalVolumes: number | null | undefined
): Promise<SeriesOption> {
  const db = createDb();
  const existing = await db
    .select({
      id: series.id
    })
    .from(series)
    .where(eq(series.id, seriesId))
    .limit(1);

  assertFound(existing[0], "Series not found.");
  await assertNameAvailable(series, series.name, name, seriesId);

  const updated = await db
    .update(series)
    .set({
      name,
      totalVolumes: totalVolumes ?? null
    })
    .where(eq(series.id, seriesId))
    .returning({
      id: series.id,
      name: series.name,
      totalVolumes: series.totalVolumes
    });

  const bookCountResult = await db
    .select({
      count: countDistinct(bookSeries.bookId)
    })
    .from(bookSeries)
    .where(eq(bookSeries.seriesId, seriesId));

  return {
    ...updated[0],
    bookCount: bookCountResult[0]?.count ?? 0
  };
}

export async function deleteSeries(seriesId: string) {
  const db = createDb();
  const existing = await db
    .select({
      id: series.id
    })
    .from(series)
    .where(eq(series.id, seriesId))
    .limit(1);

  assertFound(existing[0], "Series not found.");
  await db.delete(series).where(eq(series.id, seriesId));
}

export async function getSeriesDetail(seriesId: string): Promise<SeriesDetail> {
  const db = createDb();
  const summaryResult = await db.execute(sql`
    select
      ${series.id} as id,
      ${series.name} as name,
      ${series.totalVolumes} as total_volumes
    from ${series}
    where ${series.id} = ${seriesId}
    limit 1
  `);
  const seriesRow = assertFound(summaryResult.rows[0], "Series not found.");

  const ownedResult = await db.execute(sql`
    select
      ${books.id} as book_id,
      ${books.title} as title,
      ${books.status} as status,
      coalesce(${books.coverCustomUrl}, ${books.coverMetadataUrl}) as cover_url,
      ${bookSeries.seriesOrder} as series_order
    from ${bookSeries}
    inner join ${books} on ${books.id} = ${bookSeries.bookId}
    where ${bookSeries.seriesId} = ${seriesId}
    order by
      case when ${bookSeries.seriesOrder} is null then 1 else 0 end asc,
      ${bookSeries.seriesOrder} asc,
      lower(${books.title}) asc
  `);

  const ownedVolumes: SeriesOwnedVolume[] = ownedResult.rows.map((row) => ({
    bookId: String(row.book_id),
    title: String(row.title),
    coverUrl: row.cover_url ? String(row.cover_url) : null,
    seriesOrder:
      row.series_order == null
        ? null
        : normalizeCount(row.series_order as number | string),
    status: String(row.status) as SeriesOwnedVolume["status"]
  }));

  const totalVolumes =
    seriesRow.total_volumes == null
      ? null
      : normalizeCount(seriesRow.total_volumes as number | string);
  const knownOwnedNumbers = Array.from(
    new Set(
      ownedVolumes
        .map((volume) => volume.seriesOrder)
        .filter((value): value is number => value != null)
    )
  ).sort((left, right) => left - right);
  const missingVolumes = totalVolumes
    ? Array.from({ length: totalVolumes }, (_, index) => index + 1).filter(
        (volumeNumber) => !knownOwnedNumbers.includes(volumeNumber)
      )
    : [];

  return {
    id: String(seriesRow.id),
    name: String(seriesRow.name),
    totalVolumes,
    ownedVolumes,
    missingVolumes,
    completionPercentage: computeCompletionPercentage(knownOwnedNumbers.length, totalVolumes)
  };
}
