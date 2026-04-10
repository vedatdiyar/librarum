import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  authors,
  bookAuthors,
  bookSeries,
  books,
  categories,
  createDb,
  series
} from "@/db";
import type { BookStatus, SearchResultItem } from "@/types";
import { normalizeText } from "@/lib/shared";

type ParsedSearchQuery = {
  status?: BookStatus;
  shelfRow?: string;
  categoryId?: string;
  tokens: string[];
};

type BookRow = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  updatedAt: string;
  authors: string[];
  score: number;
};


function uniqueTokens(tokens: string[]) {
  return Array.from(new Set(tokens.filter(Boolean)));
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

  return {
    status,
    shelfRow,
    categoryId,
    tokens
  };
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

async function searchStructuredResults(parsed: ParsedSearchQuery): Promise<BookRow[]> {
  const db = createDb();
  const conditions = [];

  if (parsed.status) {
    conditions.push(eq(books.status, parsed.status));
  }

  if (parsed.shelfRow) {
    conditions.push(eq(books.shelfRow, parsed.shelfRow));
  }

  if (parsed.categoryId) {
    conditions.push(eq(books.categoryId, parsed.categoryId));
  }

  if (conditions.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: books.id,
      slug: books.slug,
      title: books.title,
      coverUrl: sql<string | null>`coalesce(${books.coverCustomUrl}, ${books.coverMetadataUrl})`,
      updatedAt: books.updatedAt
    })
    .from(books)
    .where(and(...conditions))
    .orderBy(desc(books.updatedAt), asc(books.title))
    .limit(16);

  const authorsByBookId = await loadAuthorsByBookIds(rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    coverUrl: row.coverUrl,
    updatedAt: row.updatedAt.toISOString(),
    authors: authorsByBookId.get(row.id) ?? [],
    score: 100
  }));
}

async function searchTokenResults(tokens: string[]): Promise<BookRow[]> {
  const db = createDb();

  if (tokens.length === 0) {
    return [];
  }

  const tokenConditions = tokens.map((token) => {
    const pattern = `%${token}%`;

    return sql`(
      lower(${books.title}) like ${pattern}
      or exists (
        select 1
        from ${bookAuthors}
        inner join ${authors} on ${authors.id} = ${bookAuthors.authorId}
        where ${bookAuthors.bookId} = ${books.id}
          and lower(${authors.name}) like ${pattern}
      )
      or exists (
        select 1
        from ${bookSeries}
        inner join ${series} on ${series.id} = ${bookSeries.seriesId}
        where ${bookSeries.bookId} = ${books.id}
          and lower(${series.name}) like ${pattern}
      )
    )`;
  });

  const rows = await db
    .select({
      id: books.id,
      slug: books.slug,
      title: books.title,
      coverUrl: sql<string | null>`coalesce(${books.coverCustomUrl}, ${books.coverMetadataUrl})`,
      updatedAt: books.updatedAt
    })
    .from(books)
    .where(and(...tokenConditions))
    .orderBy(desc(books.updatedAt), asc(books.title))
    .limit(24);

  const authorsByBookId = await loadAuthorsByBookIds(rows.map((row) => row.id));

  return rows.map((row) => {
    const haystack = normalizeText(
      [row.title, ...(authorsByBookId.get(row.id) ?? [])].join(" ")
    );
    const score = tokens.reduce(
      (total, token) => total + (haystack.includes(token) ? 1 : 0),
      0
    );

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      coverUrl: row.coverUrl,
      updatedAt: row.updatedAt.toISOString(),
      authors: authorsByBookId.get(row.id) ?? [],
      score
    };
  });
}

export async function searchBooks(query: string, limit = 8): Promise<SearchResultItem[]> {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  const parsed = await parseSearchQuery(normalizedQuery);
  const [structuredResults, tokenResults] = await Promise.all([
    searchStructuredResults(parsed),
    searchTokenResults(parsed.tokens)
  ]);

  const merged = new Map<string, BookRow>();

  [...structuredResults, ...tokenResults].forEach((result) => {
    const existing = merged.get(result.id);

    if (!existing) {
      merged.set(result.id, result);
      return;
    }

    merged.set(result.id, {
      ...existing,
      score: Math.max(existing.score, result.score),
      updatedAt: existing.updatedAt > result.updatedAt ? existing.updatedAt : result.updatedAt
    });
  });

  return Array.from(merged.values())
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
