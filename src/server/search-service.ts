import { and, asc, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import {
  authors,
  bookAuthors,
  bookSeries,
  books,
  categories,
  createDb,
  publishers,
  series
} from "@/db";
import type { BookStatus, SearchResultItem } from "@/types";
import { normalizeText } from "@/lib/shared";
import { toCoverDeliveryUrl } from "@/server/r2";

type ParsedSearchQuery = {
  status?: BookStatus;
  shelfRow?: string;
  categoryId?: string;
  tokens: string[];
  normalizedQuery: string;
  isbnQuery?: string;
};

type BookRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  isbn: string | null;
  publisher: string | null;
  publisherName: string | null;
  locationName: string | null;
  shelfRow: string | null;
  categoryName: string | null;
  seriesName: string | null;
  coverUrl: string | null;
  updatedAt: string;
  authors: string[];
  score: number;
};

type SearchCandidateRow = Omit<BookRow, "authors" | "score" | "updatedAt"> & {
  updatedAt: Date;
};


function uniqueTokens(tokens: string[]) {
  return Array.from(new Set(tokens.filter(Boolean)));
}

function normalizeSqlText(value: any): SQL<string> {
  return sql<string>`regexp_replace(
    translate(
      lower(coalesce(${value}, '')),
      'çğıöşüÇĞİÖŞÜ',
      'cgiosuCGIOSU'
    ),
    '[^a-z0-9]+',
    ' ',
    'g'
  )`;
}

function normalizeSqlIsbn(value: any): SQL<string> {
  return sql<string>`regexp_replace(upper(coalesce(${value}, '')), '[^0-9X]+', '', 'g')`;
}

function normalizeIsbnQuery(query: string) {
  const normalized = query.toUpperCase().replace(/[^0-9X]/g, "");

  if (normalized.length !== 10 && normalized.length !== 13) {
    return undefined;
  }

  return normalized;
}

function parseShelfRow(query: string) {
  const match = query.match(/\b([a-z])\s+raf(i|indaki|ındaki)?\b/i);
  return match ? match[1].toUpperCase() : undefined;
}

function removeMatchedPhrases(normalizedQuery: string, phrases: string[]) {
  return phrases.reduce((current, phrase) => current.replaceAll(phrase, " "), normalizedQuery);
}

async function resolveCategoryId(normalizedQuery: string) {
  const db = createDb();
  const categoryRows = await db.select().from(categories).orderBy(asc(categories.name));

  for (const category of categoryRows) {
    const normalizedCategory = normalizeText(category.name);
    const variants = new Set([
      normalizedCategory,
      `${normalizedCategory}lar`,
      `${normalizedCategory}ler`
    ]);

    for (const variant of variants) {
      if (normalizedQuery.includes(variant)) {
        return {
          categoryId: category.id,
          matchedPhrase: variant
        };
      }
    }
  }

  return {
    categoryId: undefined,
    matchedPhrase: undefined
  };
}

async function parseSearchQuery(query: string): Promise<ParsedSearchQuery> {
  const normalizedQuery = normalizeText(query);
  const statusMatches: Array<{ phrases: string[]; status: BookStatus }> = [
    { phrases: ["okunmamis", "arsivde", "arsiv"], status: "owned" },
    { phrases: ["okudum", "okunanlar", "tamamlandi"], status: "completed" },
    { phrases: ["yarim biraktim", "yarim", "birakildi"], status: "abandoned" },
    { phrases: ["odunc verilenler", "odunc", "disarida", "emanet"], status: "loaned" },
    { phrases: ["kayip"], status: "lost" }
  ];

  let status: BookStatus | undefined;
  const matchedStatusPhrases: string[] = [];

  for (const entry of statusMatches) {
    const matchedPhrase = entry.phrases.find((phrase) => normalizedQuery.includes(phrase));

    if (matchedPhrase) {
      status = entry.status;
      matchedStatusPhrases.push(...entry.phrases);
      break;
    }
  }

  const shelfRow = parseShelfRow(normalizedQuery);
  const { categoryId, matchedPhrase } = await resolveCategoryId(normalizedQuery);
  const withoutStatus = removeMatchedPhrases(normalizedQuery, matchedStatusPhrases);
  const withoutCategory = matchedPhrase ? withoutStatus.replaceAll(matchedPhrase, " ") : withoutStatus;
  const withoutShelf = shelfRow
    ? withoutCategory.replace(new RegExp(`\\b${shelfRow.toLowerCase()}\\s+raf(i|indaki|ındaki)?\\b`, "i"), " ")
    : withoutCategory;

  const tokens = uniqueTokens(
    withoutShelf
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
  );

  const isbnQuery = normalizeIsbnQuery(query);

  return {
    status,
    shelfRow,
    categoryId,
    tokens,
    normalizedQuery,
    isbnQuery
  };
}

function buildSearchTerms(parsed: ParsedSearchQuery) {
  return uniqueTokens([parsed.normalizedQuery, ...parsed.tokens]);
}

function buildTermConditions(term: string): SQL[] {
  const normalizedTerm = normalizeText(term);

  if (normalizedTerm.length < 2) {
    return [];
  }

  const pattern = `%${normalizedTerm}%`;

  return [
    sql`${normalizeSqlText(books.title)} like ${pattern}`,
    sql`${normalizeSqlText(books.subtitle)} like ${pattern}`,
    sql`${normalizeSqlText(books.publisher)} like ${pattern}`,
    sql`${normalizeSqlText(books.locationName)} like ${pattern}`,
    sql`${normalizeSqlText(books.shelfRow)} like ${pattern}`,
    sql`${normalizeSqlText(categories.name)} like ${pattern}`,
    sql`${normalizeSqlText(series.name)} like ${pattern}`,
    sql`${normalizeSqlText(publishers.name)} like ${pattern}`,
    sql`exists (
      select 1
      from ${bookAuthors}
      inner join ${authors} on ${authors.id} = ${bookAuthors.authorId}
      where ${bookAuthors.bookId} = ${books.id}
        and ${normalizeSqlText(authors.name)} like ${pattern}
    )`,
    sql`exists (
      select 1
      from ${bookSeries}
      inner join ${series} on ${series.id} = ${bookSeries.seriesId}
      where ${bookSeries.bookId} = ${books.id}
        and ${normalizeSqlText(series.name)} like ${pattern}
    )`
  ];
}

function buildSearchPredicate(parsed: ParsedSearchQuery): SQL | undefined {
  const structuredConditions: SQL[] = [];

  if (parsed.status) {
    structuredConditions.push(eq(books.status, parsed.status));
  }

  if (parsed.shelfRow) {
    structuredConditions.push(eq(books.shelfRow, parsed.shelfRow));
  }

  if (parsed.categoryId) {
    structuredConditions.push(eq(books.categoryId, parsed.categoryId));
  }

  const freeTextTerms = buildSearchTerms(parsed);
  const freeTextConditions = freeTextTerms.flatMap((term) => buildTermConditions(term));

  if (parsed.isbnQuery) {
    freeTextConditions.push(sql`${normalizeSqlIsbn(books.isbn)} like ${`%${parsed.isbnQuery}%`}`);
  }

  if (structuredConditions.length === 0 && freeTextConditions.length === 0) {
    return undefined;
  }

  if (freeTextConditions.length === 0) {
    return and(...structuredConditions);
  }

  return and(...structuredConditions, or(...freeTextConditions));
}

async function loadAuthorsByBookIds(bookIds: string[]) {
  const db = createDb();

  if (bookIds.length === 0) {
    return new Map<string, string[]>();
  }

  const rows = await db
    .select({
      bookId: bookAuthors.bookId,
      name: authors.name
    })
    .from(bookAuthors)
    .innerJoin(authors, eq(authors.id, bookAuthors.authorId))
    .where(inArray(bookAuthors.bookId, bookIds))
    .orderBy(asc(authors.name));

  const map = new Map<string, string[]>();

  rows.forEach((row) => {
    const current = map.get(row.bookId) ?? [];
    current.push(row.name);
    map.set(row.bookId, current);
  });

  return map;
}

function scoreBookRow(row: SearchCandidateRow, authorsForBook: string[], parsed: ParsedSearchQuery) {
  const normalizedQuery = parsed.normalizedQuery;
  const normalizedTitle = normalizeText(row.title);
  const normalizedSubtitle = normalizeText(row.subtitle ?? "");
  const normalizedPublisher = normalizeText(row.publisherName ?? row.publisher ?? "");
  const normalizedLocation = normalizeText([row.locationName, row.shelfRow].filter(Boolean).join(" "));
  const normalizedCategory = normalizeText(row.categoryName ?? "");
  const normalizedSeries = normalizeText(row.seriesName ?? "");
  const normalizedAuthors = normalizeText(authorsForBook.join(" "));
  const normalizedCorpus = normalizeText(
    [
      row.title,
      row.subtitle,
      row.isbn,
      row.publisher,
      row.publisherName,
      row.locationName,
      row.shelfRow,
      row.categoryName,
      row.seriesName,
      ...authorsForBook
    ]
      .filter(Boolean)
      .join(" ")
  );

  let score = 0;

  if (parsed.isbnQuery) {
    const normalizedIsbn = normalizeIsbnQuery(row.isbn ?? "");

    if (normalizedIsbn && normalizedIsbn === parsed.isbnQuery) {
      score += 250;
    } else if (normalizedIsbn && normalizedIsbn.includes(parsed.isbnQuery)) {
      score += 160;
    }
  }

  if (normalizedQuery.length > 0) {
    if (normalizedTitle === normalizedQuery) {
      score += 180;
    } else if (normalizedTitle.startsWith(normalizedQuery)) {
      score += 130;
    } else if (normalizedTitle.includes(normalizedQuery)) {
      score += 90;
    }

    if (normalizedAuthors === normalizedQuery) {
      score += 120;
    } else if (normalizedAuthors.includes(normalizedQuery)) {
      score += 80;
    }

    if (normalizedSeries === normalizedQuery) {
      score += 100;
    } else if (normalizedSeries.includes(normalizedQuery)) {
      score += 60;
    }

    if (normalizedCategory === normalizedQuery) {
      score += 80;
    } else if (normalizedCategory.includes(normalizedQuery)) {
      score += 45;
    }

    if (normalizedSubtitle.includes(normalizedQuery)) {
      score += 35;
    }

    if (normalizedPublisher.includes(normalizedQuery)) {
      score += 30;
    }

    if (normalizedLocation.includes(normalizedQuery)) {
      score += 20;
    }
  }

  const tokenScore = parsed.tokens.reduce((total, token) => {
    const corpusHit = normalizedCorpus.includes(token) ? 1 : 0;
    const titleHit = normalizedTitle.includes(token) ? 1 : 0;
    const authorHit = normalizedAuthors.includes(token) ? 1 : 0;
    const seriesHit = normalizedSeries.includes(token) ? 1 : 0;
    const categoryHit = normalizedCategory.includes(token) ? 1 : 0;
    const subtitleHit = normalizedSubtitle.includes(token) ? 1 : 0;
    const publisherHit = normalizedPublisher.includes(token) ? 1 : 0;

    return (
      total +
      corpusHit * 8 +
      titleHit * 4 +
      authorHit * 4 +
      seriesHit * 3 +
      categoryHit * 2 +
      subtitleHit * 2 +
      publisherHit * 2
    );
  }, 0);

  return score + tokenScore;
}

async function searchCandidateResults(parsed: ParsedSearchQuery): Promise<SearchCandidateRow[]> {
  const db = createDb();

  const predicate = buildSearchPredicate(parsed);

  if (!predicate) {
    return [];
  }

  return db
    .select({
      id: books.id,
      slug: books.slug,
      title: books.title,
      subtitle: books.subtitle,
      isbn: books.isbn,
      publisher: books.publisher,
      publisherName: publishers.name,
      locationName: books.locationName,
      shelfRow: books.shelfRow,
      categoryName: categories.name,
      seriesName: series.name,
      coverUrl: sql<string | null>`coalesce(${books.coverCustomUrl}, ${books.coverMetadataUrl})`,
      updatedAt: books.updatedAt
    })
    .from(books)
    .leftJoin(categories, eq(categories.id, books.categoryId))
    .leftJoin(bookSeries, eq(bookSeries.bookId, books.id))
    .leftJoin(series, eq(series.id, bookSeries.seriesId))
    .leftJoin(publishers, eq(publishers.id, books.publisherId))
    .where(predicate)
    .orderBy(desc(books.updatedAt), asc(books.title))
    .limit(64);
}

async function searchBooksWithCandidates(parsed: ParsedSearchQuery): Promise<BookRow[]> {
  const rows = await searchCandidateResults(parsed);

  const authorsByBookId = await loadAuthorsByBookIds(rows.map((row) => row.id));

  return rows.map((row) => {
    const authorsForBook = authorsByBookId.get(row.id) ?? [];

    return {
      ...row,
      coverUrl: toCoverDeliveryUrl(row.coverUrl),
      updatedAt: row.updatedAt.toISOString(),
      authors: authorsForBook,
      score: scoreBookRow(row, authorsForBook, parsed)
    };
  });
}

export async function searchBooks(query: string, limit = 8): Promise<SearchResultItem[]> {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  const parsed = await parseSearchQuery(normalizedQuery);
  const results = await searchBooksWithCandidates(parsed);

  return results
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.updatedAt !== left.updatedAt) {
        return right.updatedAt.localeCompare(left.updatedAt);
      }

      return left.title.localeCompare(right.title, "tr");
    })
    .slice(0, limit)
    .map((result) => ({
      id: result.id,
      slug: result.slug,
      title: result.title,
      coverUrl: result.coverUrl,
      authors: result.authors
    }));
}
