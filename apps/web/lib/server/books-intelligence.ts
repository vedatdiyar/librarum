import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { authors, bookAuthors, books, createDb } from "@exlibris/db";
import { normalizeIsbn } from "@exlibris/lib";
export { normalizeIsbn };
import type {
  CreateBookResponse,
  DuplicateBookSummary,
  DuplicateCheckInput,
  DuplicateCheckResponse,
  DuplicateReason,
  DuplicateSuggestion,
  IsbnMetadata,
  IsbnMetadataResponse
} from "@exlibris/types";
import { ApiError } from "@/lib/server/api";

const DUPLICATE_SUGGESTIONS: DuplicateSuggestion[] = [
  "increase_copy",
  "new_edition",
  "ignore"
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function assertValidNormalizedIsbn(value: string | null | undefined) {
  const normalizedIsbn = normalizeIsbn(value);

  if (!normalizedIsbn) {
    throw new ApiError(400, "ISBN must be a valid ISBN-10 or ISBN-13.");
  }

  return normalizedIsbn;
}

function normalizeTitleForComparison(value: string) {
  return normalizeWhitespace(
    value
      .toLocaleLowerCase("tr-TR")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/gi, " ")
  );
}

function levenshteinDistance(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1;

      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + substitutionCost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function calculateTitleSimilarity(left: string, right: string) {
  const normalizedLeft = normalizeTitleForComparison(left);
  const normalizedRight = normalizeTitleForComparison(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const maxLength = Math.max(normalizedLeft.length, normalizedRight.length);

  if (maxLength === 0) {
    return 0;
  }

  const distance = levenshteinDistance(normalizedLeft, normalizedRight);
  return Number(((maxLength - distance) / maxLength).toFixed(2));
}

function normalizeDescription(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    return normalized.length > 0 ? normalized : null;
  }

  if (value && typeof value === "object") {
    if ("value" in value && typeof value.value === "string") {
      return normalizeDescription(value.value);
    }

    if ("text" in value && typeof value.text === "string") {
      return normalizeDescription(value.text);
    }
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((part) => normalizeDescription(part))
      .filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join("\n\n") : null;
  }

  return null;
}

function extractPublicationYear(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/(18|19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function hasEnrichment(metadata: IsbnMetadata) {
  return Boolean(
    metadata.publisher ||
      metadata.publicationYear ||
      metadata.pageCount ||
      metadata.coverMetadataUrl ||
      metadata.description
  );
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`External fetch failed with status ${response.status}`);
  }

  return response.json();
}

async function fetchOpenLibraryMetadata(normalizedIsbn: string) {
  const payload = (await fetchJson(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=data`
  )) as Record<string, unknown>;
  const result = payload[`ISBN:${normalizedIsbn}`] as Record<string, unknown> | undefined;

  if (!result) {
    return null;
  }

  const publisher =
    Array.isArray(result.publishers) && result.publishers[0]
      ? normalizeDescription(result.publishers[0])
      : null;
  const coverRecord =
    result.cover && typeof result.cover === "object"
      ? (result.cover as Record<string, string>)
      : null;

  const metadata: IsbnMetadata = {
    title: typeof result.title === "string" ? normalizeWhitespace(result.title) : null,
    publisher,
    publicationYear: extractPublicationYear(
      typeof result.publish_date === "string" ? result.publish_date : null
    ),
    pageCount:
      typeof result.number_of_pages === "number" ? result.number_of_pages : null,
    coverMetadataUrl: coverRecord?.large ?? coverRecord?.medium ?? coverRecord?.small ?? null,
    description: normalizeDescription(result.description)
  };

  return metadata.title && hasEnrichment(metadata) ? metadata : null;
}

async function fetchGoogleBooksMetadata(normalizedIsbn: string) {
  const payload = (await fetchJson(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${normalizedIsbn}`
  )) as {
    items?: Array<{
      volumeInfo?: {
        title?: string;
        publisher?: string;
        publishedDate?: string;
        pageCount?: number;
        description?: string;
        imageLinks?: {
          thumbnail?: string;
          smallThumbnail?: string;
        };
      };
    }>;
  };

  const volume = payload.items?.[0]?.volumeInfo;

  if (!volume?.title) {
    return null;
  }

  const metadata: IsbnMetadata = {
    title: normalizeWhitespace(volume.title),
    publisher: volume.publisher ? normalizeWhitespace(volume.publisher) : null,
    publicationYear: extractPublicationYear(volume.publishedDate),
    pageCount: typeof volume.pageCount === "number" ? volume.pageCount : null,
    coverMetadataUrl:
      volume.imageLinks?.thumbnail?.replace(/^http:/, "https:") ??
      volume.imageLinks?.smallThumbnail?.replace(/^http:/, "https:") ??
      null,
    description: normalizeDescription(volume.description)
  };

  return metadata;
}

export async function fetchMetadataByIsbn(isbn: string): Promise<IsbnMetadataResponse> {
  const normalizedIsbn = assertValidNormalizedIsbn(isbn);

  try {
    const openLibraryMetadata = await fetchOpenLibraryMetadata(normalizedIsbn);

    if (openLibraryMetadata) {
      return {
        found: true,
        source: "open_library",
        metadata: openLibraryMetadata
      };
    }
  } catch (error) {
    console.error("Open Library fetch failed", error);
  }

  try {
    const googleMetadata = await fetchGoogleBooksMetadata(normalizedIsbn);

    if (googleMetadata) {
      return {
        found: true,
        source: "google_books",
        metadata: googleMetadata
      };
    }
  } catch (error) {
    console.error("Google Books fetch failed", error);
  }

  return {
    found: false
  };
}

async function loadDuplicateSummary(bookId: string): Promise<DuplicateBookSummary> {
  const db = createDb();
  const [bookRows, authorRows] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        isbn: books.isbn,
        copyCount: books.copyCount,
        status: books.status,
        coverUrl: sql<string | null>`coalesce(${books.coverCustomUrl}, ${books.coverMetadataUrl})`
      })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1),
    db
      .select({
        id: authors.id,
        name: authors.name
      })
      .from(bookAuthors)
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(eq(bookAuthors.bookId, bookId))
      .orderBy(asc(authors.name))
  ]);

  const existingBook = bookRows[0];

  if (!existingBook) {
    throw new ApiError(404, "Book not found.");
  }

  return {
    id: existingBook.id,
    title: existingBook.title,
    authors: authorRows,
    isbn: existingBook.isbn,
    copyCount: existingBook.copyCount,
    status: existingBook.status,
    coverUrl: existingBook.coverUrl
  };
}

function buildDuplicateResponse(
  reason: DuplicateReason,
  confidence: number,
  existingBook: DuplicateBookSummary
): DuplicateCheckResponse {
  return {
    isDuplicate: true,
    reason,
    confidence,
    existingBook,
    suggestions: DUPLICATE_SUGGESTIONS
  };
}

export async function checkDuplicateBook(
  input: DuplicateCheckInput
): Promise<DuplicateCheckResponse> {
  const db = createDb();
  const normalizedIsbn = normalizeIsbn(input.isbn);

  if (normalizedIsbn) {
    const isbnMatches = await db
      .select({
        id: books.id
      })
      .from(books)
      .where(
        and(
          sql`regexp_replace(upper(coalesce(${books.isbn}, '')), '[^0-9X]', '', 'g') = ${normalizedIsbn}`,
          input.excludeBookId ? ne(books.id, input.excludeBookId) : undefined
        )
      )
      .orderBy(desc(books.createdAt))
      .limit(1);

    if (isbnMatches[0]) {
      return buildDuplicateResponse(
        "isbn_exact",
        1,
        await loadDuplicateSummary(isbnMatches[0].id)
      );
    }
  }

  const candidateIds = await db
    .selectDistinct({
      id: books.id,
      createdAt: books.createdAt
    })
    .from(books)
    .innerJoin(bookAuthors, eq(bookAuthors.bookId, books.id))
    .where(
      and(
        inArray(bookAuthors.authorId, input.authorIds),
        input.excludeBookId ? ne(books.id, input.excludeBookId) : undefined
      )
    )
    .orderBy(desc(books.createdAt));

  if (candidateIds.length === 0) {
    return {
      isDuplicate: false
    };
  }

  const candidateBooks = await db
    .select({
      id: books.id,
      title: books.title
    })
    .from(books)
    .where(
      inArray(
        books.id,
        candidateIds.map((candidate) => candidate.id)
      )
    );

  let bestCandidate: { id: string; confidence: number } | null = null;

  for (const candidateBook of candidateBooks) {
    const confidence = calculateTitleSimilarity(input.title, candidateBook.title);

    if (confidence < 0.85) {
      continue;
    }

    if (!bestCandidate || confidence > bestCandidate.confidence) {
      bestCandidate = {
        id: candidateBook.id,
        confidence
      };
    }
  }

  if (!bestCandidate) {
    return {
      isDuplicate: false
    };
  }

  return buildDuplicateResponse(
    "title_author_match",
    bestCandidate.confidence,
    await loadDuplicateSummary(bestCandidate.id)
  );
}

export function normalizeCreateBookResult(
  action: CreateBookResponse["action"],
  book: CreateBookResponse["book"]
): CreateBookResponse {
  return {
    action,
    book
  };
}
