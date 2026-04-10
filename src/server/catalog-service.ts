import { asc, countDistinct, eq, sql } from "drizzle-orm";
import {
  authorAliases,
  authors,
  bookAuthors,
  bookSeries,
  books,
  categories,
  createDb,
  series
} from "@/db";
import type {
  AuthorDetail,
  AuthorDetailBook,
  AuthorListItem,
  AuthorOption,
  AuthorResolutionDecision,
  AuthorResolutionResponse,
  AuthorRelatedSeries,
  CategoryOption,
  CategoryDistributionPoint,
  SeriesDetail,
  SeriesListItem,
  SeriesOwnedVolume,
  SeriesOption
} from "@/types";
import { ApiError, assertFound } from "@/server/api";
import {
  buildUniqueSlug,
  isUuid,
  normalizeCount,
  normalizeFloat
} from "@/lib/shared";
import {
  isAuthorNameAvailable,
  resolveAuthorIdentity,
  resolveOrCreateAuthor,
  syncAuthorAliases
} from "@/server/author-identity";

async function assertNameAvailable(
  table: typeof categories | typeof series,
  nameColumn:
    | typeof categories.name
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

async function assertAuthorNameAvailable(name: string, excludedId?: string) {
  const db = createDb();
  const isAvailable = await isAuthorNameAvailable(db, name, excludedId);

  if (!isAvailable) {
    throw new ApiError(409, "Resource already exists.");
  }
}

async function authorSlugExists(slug: string, excludedId?: string) {
  const db = createDb();
  const rows = await db
    .select({
      id: authors.id
    })
    .from(authors)
    .where(
      excludedId
        ? sql`${authors.slug} = ${slug} and ${authors.id} <> ${excludedId}`
        : eq(authors.slug, slug)
    )
    .limit(1);

  return Boolean(rows[0]);
}

async function computeAuthorSlug(name: string, authorId: string) {
  const baseSlug = buildUniqueSlug(name, authorId, "author", () => false);

  if (!(await authorSlugExists(baseSlug, authorId))) {
    return baseSlug;
  }

  return buildUniqueSlug(name, authorId, "author", () => true);
}

export async function resolveAuthorIdentifier(identifier: string) {
  const db = createDb();
  const rows = await db
    .select({
      id: authors.id,
      slug: authors.slug
    })
    .from(authors)
    .where(
      isUuid(identifier)
        ? sql`${authors.id} = ${identifier} or ${authors.slug} = ${identifier}`
        : eq(authors.slug, identifier)
    )
    .limit(1);

  return assertFound(rows[0], "Author not found.");
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
  const likePattern = `%${normalizedQuery}%`;
  const likeClause = normalizedQuery
    ? sql`where (
        ${authors.name} ilike ${likePattern}
        or exists (
          select 1
          from ${authorAliases}
          where ${authorAliases.authorId} = ${authors.id}
            and ${authorAliases.name} ilike ${likePattern}
        )
      )`
    : sql``;
  const limitClause = normalizedQuery ? sql`limit 20` : sql``;
  const result = await db.execute(sql`
    select
      ${authors.id} as id,
      ${authors.name} as name,
      ${authors.slug} as slug,
      count(distinct ${bookAuthors.bookId}) as book_count,
      round((avg(${books.rating}) filter (where ${books.rating} is not null))::numeric, 2) as average_rating
    from ${authors}
    left join ${bookAuthors} on ${bookAuthors.authorId} = ${authors.id}
    left join ${books} on ${books.id} = ${bookAuthors.bookId}
    ${likeClause}
    group by ${authors.id}, ${authors.name}, ${authors.slug}
    order by ${authors.name} asc
    ${limitClause}
  `);

  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    bookCount: normalizeCount(row.book_count as number | string),
    averageRating: toNullableFloat(row.average_rating as number | string | null)
  }));
}

export async function createAuthor(name: string): Promise<AuthorOption> {
  await assertAuthorNameAvailable(name);

  const db = createDb();
  const authorId = crypto.randomUUID();
  const slug = await computeAuthorSlug(name, authorId);
  const created = await db
    .insert(authors)
    .values({
      id: authorId,
      name,
      slug
    })
    .returning({
      id: authors.id,
      name: authors.name,
      slug: authors.slug
    });

  await syncAuthorAliases(db, created[0].id, created[0].name);
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
  await assertAuthorNameAvailable(name, authorId);

  const resolution = await resolveAuthorIdentity(db, name);

  if (
    resolution &&
    resolution.status === "auto-merge" &&
    resolution.author.id !== authorId
  ) {
    throw new ApiError(409, "Resource already exists.");
  }

  const previousAliases = await db
    .select({
      name: authorAliases.name
    })
    .from(authorAliases)
    .where(eq(authorAliases.authorId, authorId));

  const updated = await db
    .update(authors)
    .set({
      name,
      slug: await computeAuthorSlug(name, authorId)
    })
    .where(eq(authors.id, authorId))
    .returning({
      id: authors.id,
      name: authors.name,
      slug: authors.slug
    });

  await syncAuthorAliases(
    db,
    updated[0].id,
    updated[0].name,
    previousAliases.map((alias) => alias.name)
  );
  return updated[0];
}

export async function resolveAuthorName(
  name: string,
  input?: {
    decision?: AuthorResolutionDecision;
    suggestedAuthorId?: string;
  }
): Promise<AuthorResolutionResponse> {
  const db = createDb();
  return resolveOrCreateAuthor(db, name, input);
}

export async function getAuthorDetail(authorId: string): Promise<AuthorDetail> {
  const db = createDb();
  const authorSummaryResult = await db.execute(sql`
    select
      ${authors.id} as id,
      ${authors.name} as name,
      ${authors.slug} as slug,
      count(distinct ${bookAuthors.bookId}) as book_count,
      round((avg(${books.rating}) filter (where ${books.rating} is not null))::numeric, 2) as average_rating
    from ${authors}
    left join ${bookAuthors} on ${bookAuthors.authorId} = ${authors.id}
    left join ${books} on ${books.id} = ${bookAuthors.bookId}
    where ${authors.id} = ${authorId}
    group by ${authors.id}, ${authors.name}, ${authors.slug}
    limit 1
  `);
  const authorRow = assertFound(authorSummaryResult.rows[0], "Author not found.");

  const [bookRows, categoryRows, relatedSeriesRows] = await Promise.all([
    db.execute(sql`
      select
        ${books.id} as id,
        ${books.title} as title,
        ${books.slug} as slug,
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
    slug: String(row.slug),
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
    slug: String(authorRow.slug),
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
      ${books.slug} as slug,
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
    slug: String(row.slug),
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
