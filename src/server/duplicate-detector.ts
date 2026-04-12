import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { authors, bookAuthors, books, createDb } from "@/db";
import { normalizeIsbn } from "@/lib/helpers";
import type {
  CreateBookResponse,
  DuplicateBookSummary,
  DuplicateCheckInput,
  DuplicateCheckResponse,
  DuplicateReason,
  DuplicateSuggestion
} from "@/types";
import { ApiError } from "@/server/api";
import { toCoverDeliveryUrl } from "@/server/r2";
import { calculateTitleSimilarity } from "./isbn-normalizers";

const DUPLICATE_SUGGESTIONS: DuplicateSuggestion[] = [
  "increase_copy",
  "new_edition",
  "ignore"
];

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
        name: authors.name,
        slug: authors.slug
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
    coverUrl: toCoverDeliveryUrl(existingBook.coverUrl)
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
      title: books.title,
      subtitle: books.subtitle
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
    const inputDisplayTitle = `${input.title} ${input.subtitle ?? ""}`.trim();
    const candidateDisplayTitle = `${candidateBook.title} ${candidateBook.subtitle ?? ""}`.trim();
    const confidence = calculateTitleSimilarity(inputDisplayTitle, candidateDisplayTitle);

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
