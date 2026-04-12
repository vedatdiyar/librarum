import { asc, countDistinct, eq, or, sql } from "drizzle-orm";
import {
  authorAliases,
  authors,
  bookAuthors,
  bookSeries,
  books,
  categories,
  createDb,
  publishers,
  publisherAliases,
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
  SeriesOption,
  PublisherOption,
  PublisherResolutionResponse
} from "@/types";
import { ApiError, assertFound } from "@/server/api";
import {
  buildUniqueSlug,
  isUuid,
  normalizeCount,
  normalizeFloat
} from "@/lib/helpers";
import { toCoverDeliveryUrl } from "@/server/r2";
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

export async function resolveSeriesIdentifier(identifier: string) {
  const db = createDb();
  const rows = await db
    .select({
      id: series.id,
      slug: series.slug
    })
    .from(series)
    .where(
      isUuid(identifier)
        ? or(eq(series.id, identifier), eq(series.slug, identifier))
        : eq(series.slug, identifier)
    )
    .limit(1);

  return assertFound(rows[0], "Series not found.");
}

async function seriesSlugExists(slug: string, excludedId?: string) {
  const db = createDb();
  const rows = await db
    .select({
      id: series.id
    })
    .from(series)
    .where(
      excludedId
        ? sql`${series.slug} = ${slug} and ${series.id} <> ${excludedId}`
        : eq(series.slug, slug)
    )
    .limit(1);

  return Boolean(rows[0]);
}

async function computeSeriesSlug(name: string, seriesId: string) {
  const baseSlug = buildUniqueSlug(name, seriesId, "series", () => false);

  if (!(await seriesSlugExists(baseSlug, seriesId))) {
    return baseSlug;
  }

  return buildUniqueSlug(name, seriesId, "series", () => true);
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
        ? or(eq(authors.id, identifier), eq(authors.slug, identifier))
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
  
  // Tokenize the query to search for individual parts (e.g. "Fyodor" and "Dostoyevski")
  const queryTokens = normalizedQuery
    .split(/[\s.]+/)
    .filter(token => token.length >= 2);

  let likeClause = sql``;
  if (queryTokens.length > 0) {
    // Search for authors that match at least two tokens if available, or just one if only one exists
    const conditions = queryTokens.map(token => {
      const p = `%${token}%`;
      return sql`(${authors.name} ilike ${p} or exists (select 1 from ${authorAliases} where ${authorAliases.authorId} = ${authors.id} and ${authorAliases.name} ilike ${p}))`;
    });
    
    // Join with AND to narrow down results (e.g. must have both Fyodor and Dostoyevski)
    likeClause = sql`where ${sql.join(conditions, sql` and `)}`;
  } else if (normalizedQuery) {
    // Fallback for short queries
    const p = `%${normalizedQuery}%`;
    likeClause = sql`where (${authors.name} ilike ${p} or exists (select 1 from ${authorAliases} where ${authorAliases.authorId} = ${authors.id} and ${authorAliases.name} ilike ${p}))`;
  }

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
    limit 40
  `);

  const items = result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    bookCount: normalizeCount(row.book_count as number | string),
    averageRating: toNullableFloat(row.average_rating as number | string | null)
  }));

  // If we have a query, use our smart matching to rank the best results at the top
  if (normalizedQuery && items.length > 0) {
    const { isAutoMergeMatch, normalizeAuthorNameKey } = await import("./author-identity");
    
    // Sort items by similarity to the query
    // This is optional but helps when there are many similar authors
    return items.sort((a, b) => {
      const aMatch = isAutoMergeMatch(normalizeAuthorNameKey(a.name), normalizeAuthorNameKey(normalizedQuery));
      const bMatch = isAutoMergeMatch(normalizeAuthorNameKey(b.name), normalizeAuthorNameKey(normalizedQuery));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  return items;
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
        ${series.slug} as series_slug,
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
        ${series.slug} as slug,
        ${series.totalVolumes} as total_volumes,
        count(distinct ${bookSeries.bookId}) as owned_count
      from ${series}
      inner join ${bookSeries} on ${bookSeries.seriesId} = ${series.id}
      inner join ${bookAuthors} on ${bookAuthors.bookId} = ${bookSeries.bookId}
      where ${bookAuthors.authorId} = ${authorId}
      group by ${series.id}, ${series.name}, ${series.slug}, ${series.totalVolumes}
      order by ${series.name} asc
    `)
  ]);

  const booksByAuthor: AuthorDetailBook[] = bookRows.rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    coverUrl: toCoverDeliveryUrl(row.cover_url ? String(row.cover_url) : null),
    status: String(row.status) as AuthorDetailBook["status"],
    rating: row.rating == null ? null : normalizeFloat(row.rating as number | string),
    series: row.series_id
      ? {
          id: String(row.series_id),
          name: String(row.series_name),
          slug: row.series_slug ? String(row.series_slug) : "",
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
    slug: String(row.slug),
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

export async function listPublishers(query: string | null | undefined): Promise<PublisherOption[]> {
  const db = createDb();
  const normalizedQuery = query?.trim() ?? "";
  
  const queryTokens = normalizedQuery
    .split(/[\s.]+/)
    .filter(token => token.length >= 2);

  let likeClause = sql``;
  if (queryTokens.length > 0) {
    const conditions = queryTokens.map(token => {
      const p = `%${token}%`;
      return sql`(${publishers.name} ilike ${p} or exists (select 1 from ${publisherAliases} where ${publisherAliases.publisherId} = ${publishers.id} and ${publisherAliases.name} ilike ${p}))`;
    });
    likeClause = sql`where ${sql.join(conditions, sql` and `)}`;
  } else if (normalizedQuery) {
    const p = `%${normalizedQuery}%`;
    likeClause = sql`where (${publishers.name} ilike ${p} or exists (select 1 from ${publisherAliases} where ${publisherAliases.publisherId} = ${publishers.id} and ${publisherAliases.name} ilike ${p}))`;
  }

  const result = await db.execute(sql`
    select
      ${publishers.id} as id,
      ${publishers.name} as name,
      ${publishers.slug} as slug
    from ${publishers}
    ${likeClause}
    order by ${publishers.name} asc
    limit 40
  `);

  const items = result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug)
  }));

  if (normalizedQuery && items.length > 0) {
    const { isAutoMergeMatch, normalizePublisherNameKey } = await import("./publisher-identity");
    return items.sort((a, b) => {
      const aMatch = isAutoMergeMatch(normalizePublisherNameKey(a.name), normalizePublisherNameKey(normalizedQuery));
      const bMatch = isAutoMergeMatch(normalizePublisherNameKey(b.name), normalizePublisherNameKey(normalizedQuery));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  return items;
}

export async function createPublisher(name: string): Promise<PublisherOption> {
  const db = createDb();
  const { resolveOrCreatePublisher } = await import("./publisher-identity");
  const resolution = await resolveOrCreatePublisher(db, name);
  return resolution.status === "suggested-merge" ? resolution.suggestedPublisher : resolution.publisher;
}

export async function resolvePublisherName(name: string): Promise<PublisherResolutionResponse> {
  const db = createDb();
  const { resolveOrCreatePublisher } = await import("./publisher-identity");
  return resolveOrCreatePublisher(db, name);
}



export async function listSeries(): Promise<SeriesOption[]> {
  const db = createDb();
  const result = await db.execute(sql`
    select
      ${series.id} as id,
      ${series.name} as name,
      ${series.slug} as slug,
      ${series.totalVolumes} as total_volumes,
      count(distinct ${bookSeries.bookId}) as book_count,
      count(distinct case when ${bookSeries.seriesOrder} is not null then ${bookSeries.seriesOrder} end) as known_owned_count
    from ${series}
    left join ${bookSeries} on ${bookSeries.seriesId} = ${series.id}
    group by ${series.id}, ${series.name}, ${series.slug}, ${series.totalVolumes}
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
      slug: String(row.slug),
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
  const db = createDb();
  await assertNameAvailable(series, series.name, name);

  const seriesId = crypto.randomUUID();
  const slug = await computeSeriesSlug(name, seriesId);
  const created = await db
    .insert(series)
    .values({
      id: seriesId,
      name,
      slug,
      totalVolumes: totalVolumes ?? null
    })
    .returning({
      id: series.id,
      name: series.name,
      slug: series.slug,
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
  const seriesRecord = await resolveSeriesIdentifier(seriesId);
  const internalId = seriesRecord.id;

  await assertNameAvailable(series, series.name, name, internalId);

  const updated = await db
    .update(series)
    .set({
      name,
      slug: await computeSeriesSlug(name, internalId),
      totalVolumes: totalVolumes ?? null
    })
    .where(eq(series.id, internalId))
    .returning({
      id: series.id,
      name: series.name,
      slug: series.slug,
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
  const seriesRecord = await resolveSeriesIdentifier(seriesId);
  await db.delete(series).where(eq(series.id, seriesRecord.id));
}

export async function getSeriesDetail(seriesId: string): Promise<SeriesDetail> {
  const db = createDb();
  const summaryRows = await db
    .select({
      id: series.id,
      name: series.name,
      slug: series.slug,
      totalVolumes: series.totalVolumes
    })
    .from(series)
    .where(
      isUuid(seriesId)
        ? or(eq(series.id, seriesId), eq(series.slug, seriesId))
        : eq(series.slug, seriesId)
    )
    .limit(1);
  const seriesRow = assertFound(summaryRows[0], "Series not found.");

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
    where ${bookSeries.seriesId} = ${seriesRow.id}
    order by
      case when ${bookSeries.seriesOrder} is null then 1 else 0 end asc,
      ${bookSeries.seriesOrder} asc,
      lower(${books.title}) asc
  `);

  const ownedVolumes: SeriesOwnedVolume[] = ownedResult.rows.map((row) => ({
    bookId: String(row.book_id),
    slug: String(row.slug),
    title: String(row.title),
    coverUrl: toCoverDeliveryUrl(row.cover_url ? String(row.cover_url) : null),
    seriesOrder:
      row.series_order == null
        ? null
        : normalizeCount(row.series_order as number | string),
    status: String(row.status) as SeriesOwnedVolume["status"]
  }));

  const totalVolumes =
    seriesRow.totalVolumes == null
      ? null
      : normalizeCount(seriesRow.totalVolumes as number | string);
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
    slug: String(seriesRow.slug),
    totalVolumes,
    ownedVolumes,
    missingVolumes,
    completionPercentage: computeCompletionPercentage(knownOwnedNumbers.length, totalVolumes)
  };
}
