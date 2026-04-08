import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  inArray,
  sql,
  type InferSelectModel
} from "drizzle-orm";
import {
  authors,
  bookAuthors,
  bookSeries,
  bookTags,
  books,
  categories,
  createDb,
  series,
  tags
} from "@librarum/db";
import type {
  ApiBookListItem,
  AuthorOption,
  BookDetail,
  BookListResponse,
  BookLocation,
  BookSeriesReference,
  BulkBooksPatchInput,
  CategoryOption,
  CreateBookResponse,
  EntityReferenceInput,
  SeriesReferenceInput,
  TagOption
} from "@librarum/types";
import { ApiError, assertFound } from "@/lib/server/api";
import {
  checkDuplicateBook,
  normalizeCreateBookResult,
  normalizeIsbn
} from "@/lib/server/books-intelligence";
import type {
  BulkBooksPatchInputSchema,
  CreateBookInput,
  ListBooksQuery,
  UpdateBookInput
} from "@/lib/server/books-schemas";

const DEFAULT_BOOKS_PAGE_SIZE = 25;

type DbClient = ReturnType<typeof createDb>;
type TransactionClient = Parameters<DbClient["transaction"]>[0] extends (
  tx: infer T
) => Promise<unknown>
  ? T
  : never;
type DbExecutor = DbClient | TransactionClient;

type BookRow = InferSelectModel<typeof books>;
type CategoryRow = InferSelectModel<typeof categories>;

type BookRelations = {
  authorsByBookId: Map<string, AuthorOption[]>;
  tagsByBookId: Map<string, TagOption[]>;
  seriesByBookId: Map<string, BookSeriesReference>;
  categoriesById: Map<string, CategoryRow>;
};

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function buildLocationDisplay(
  locationName: string | null,
  shelfRow: string | null,
  shelfColumn: number | null
) {
  const parts = [locationName, shelfRow, shelfColumn?.toString() ?? null].filter(
    (value): value is string => Boolean(value)
  );

  return parts.length > 0 ? parts.join(" / ") : null;
}

function buildLocation(
  book: Pick<BookRow, "locationName" | "shelfRow" | "shelfColumn">
): BookLocation | null {
  const display = buildLocationDisplay(
    book.locationName,
    book.shelfRow,
    book.shelfColumn
  );

  if (!display && !book.locationName && !book.shelfRow && book.shelfColumn == null) {
    return null;
  }

  return {
    locationName: book.locationName,
    shelfRow: book.shelfRow,
    shelfColumn: book.shelfColumn,
    display
  };
}

function mapBookListItem(book: BookRow, relations: BookRelations): ApiBookListItem {
  const category = book.categoryId
    ? relations.categoriesById.get(book.categoryId) ?? null
    : null;
  const seriesReference = relations.seriesByBookId.get(book.id) ?? null;

  return {
    id: book.id,
    title: book.title,
    isbn: book.isbn,
    status: book.status,
    rating: book.rating,
    coverUrl: book.coverCustomUrl ?? book.coverMetadataUrl,
    copyCount: book.copyCount,
    donatable: book.donatable,
    authors: relations.authorsByBookId.get(book.id) ?? [],
    category: category
      ? {
          id: category.id,
          name: category.name
        }
      : null,
    tags: relations.tagsByBookId.get(book.id) ?? [],
    series: seriesReference,
    location: buildLocation(book),
    isSeries: Boolean(seriesReference),
    loanedTo: book.loanedTo,
    loanedAt: toIsoString(book.loanedAt),
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString()
  };
}

function mapBookDetail(book: BookRow, relations: BookRelations): BookDetail {
  const listItem = mapBookListItem(book, relations);

  return {
    ...listItem,
    publisher: book.publisher,
    publicationYear: book.publicationYear,
    pageCount: book.pageCount,
    personalNote: book.personalNote,
    readMonth: book.readMonth,
    readYear: book.readYear,
    loanedTo: book.loanedTo,
    loanedAt: toIsoString(book.loanedAt),
    coverCustomUrl: book.coverCustomUrl,
    coverMetadataUrl: book.coverMetadataUrl
  };
}

async function loadBookRelations(
  db: DbExecutor,
  bookRows: BookRow[]
): Promise<BookRelations> {
  const bookIds = bookRows.map((book) => book.id);
  const categoryIds = Array.from(
    new Set(
      bookRows
        .map((book) => book.categoryId)
        .filter((categoryId): categoryId is string => Boolean(categoryId))
    )
  );

  if (bookIds.length === 0) {
    return {
      authorsByBookId: new Map(),
      tagsByBookId: new Map(),
      seriesByBookId: new Map(),
      categoriesById: new Map()
    };
  }

  const [authorRows, tagRows, seriesRows, categoryRows] = await Promise.all([
    db
      .select({
        bookId: bookAuthors.bookId,
        id: authors.id,
        name: authors.name
      })
      .from(bookAuthors)
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(inArray(bookAuthors.bookId, bookIds))
      .orderBy(asc(authors.name)),
    db
      .select({
        bookId: bookTags.bookId,
        id: tags.id,
        name: tags.name
      })
      .from(bookTags)
      .innerJoin(tags, eq(bookTags.tagId, tags.id))
      .where(inArray(bookTags.bookId, bookIds))
      .orderBy(asc(tags.name)),
    db
      .select({
        bookId: bookSeries.bookId,
        id: series.id,
        name: series.name,
        totalVolumes: series.totalVolumes,
        seriesOrder: bookSeries.seriesOrder
      })
      .from(bookSeries)
      .innerJoin(series, eq(bookSeries.seriesId, series.id))
      .where(inArray(bookSeries.bookId, bookIds)),
    categoryIds.length > 0
      ? db.select().from(categories).where(inArray(categories.id, categoryIds))
      : Promise.resolve([])
  ]);

  const authorsByBookId = new Map<string, AuthorOption[]>();
  const tagsByBookId = new Map<string, TagOption[]>();
  const seriesByBookId = new Map<string, BookSeriesReference>();
  const categoriesById = new Map(categoryRows.map((category) => [category.id, category]));

  authorRows.forEach((authorRow) => {
    const existingAuthors = authorsByBookId.get(authorRow.bookId) ?? [];

    existingAuthors.push({
      id: authorRow.id,
      name: authorRow.name
    });

    authorsByBookId.set(authorRow.bookId, existingAuthors);
  });

  tagRows.forEach((tagRow) => {
    const existingTags = tagsByBookId.get(tagRow.bookId) ?? [];

    existingTags.push({
      id: tagRow.id,
      name: tagRow.name
    });

    tagsByBookId.set(tagRow.bookId, existingTags);
  });

  seriesRows.forEach((seriesRow) => {
    seriesByBookId.set(seriesRow.bookId, {
      id: seriesRow.id,
      name: seriesRow.name,
      totalVolumes: seriesRow.totalVolumes,
      seriesOrder: seriesRow.seriesOrder
    });
  });

  return {
    authorsByBookId,
    tagsByBookId,
    seriesByBookId,
    categoriesById
  };
}

async function getAuthorId(db: DbExecutor, reference: EntityReferenceInput) {
  if ("id" in reference) {
    const existingAuthor = await db
      .select({
        id: authors.id
      })
      .from(authors)
      .where(eq(authors.id, reference.id))
      .limit(1);

    if (!existingAuthor[0]) {
      throw new ApiError(400, "Author does not exist.");
    }

    return existingAuthor[0].id;
  }

  const normalizedName = reference.name.trim();
  const existingAuthor = await db
    .select({
      id: authors.id
    })
    .from(authors)
    .where(sql`lower(${authors.name}) = ${normalizedName.toLowerCase()}`)
    .limit(1);

  if (existingAuthor[0]) {
    return existingAuthor[0].id;
  }

  const createdAuthor = await db
    .insert(authors)
    .values({
      name: normalizedName
    })
    .returning({
      id: authors.id
    });

  return createdAuthor[0].id;
}

async function getCategoryId(
  db: DbExecutor,
  reference: EntityReferenceInput | null | undefined
) {
  if (reference === undefined) {
    return undefined;
  }

  if (reference === null) {
    return null;
  }

  if ("id" in reference) {
    const existingCategory = await db
      .select({
        id: categories.id
      })
      .from(categories)
      .where(eq(categories.id, reference.id))
      .limit(1);

    if (!existingCategory[0]) {
      throw new ApiError(400, "Category does not exist.");
    }

    return existingCategory[0].id;
  }

  const normalizedName = reference.name.trim();
  const existingCategory = await db
    .select({
      id: categories.id
    })
    .from(categories)
    .where(sql`lower(${categories.name}) = ${normalizedName.toLowerCase()}`)
    .limit(1);

  if (existingCategory[0]) {
    return existingCategory[0].id;
  }

  const createdCategory = await db
    .insert(categories)
    .values({
      name: normalizedName
    })
    .returning({
      id: categories.id
    });

  return createdCategory[0].id;
}

async function getTagIds(db: DbExecutor, references: EntityReferenceInput[]) {
  const resolvedTagIds: string[] = [];
  const seenKeys = new Set<string>();

  for (const reference of references) {
    const lookupKey =
      "id" in reference
        ? `id:${reference.id}`
        : `name:${reference.name.trim().toLowerCase()}`;

    if (seenKeys.has(lookupKey)) {
      continue;
    }

    seenKeys.add(lookupKey);

    if ("id" in reference) {
      const existingTag = await db
        .select({
          id: tags.id
        })
        .from(tags)
        .where(eq(tags.id, reference.id))
        .limit(1);

      if (!existingTag[0]) {
        throw new ApiError(400, "Tag does not exist.");
      }

      resolvedTagIds.push(existingTag[0].id);
      continue;
    }

    const normalizedName = reference.name.trim();
    const existingTag = await db
      .select({
        id: tags.id
      })
      .from(tags)
      .where(sql`lower(${tags.name}) = ${normalizedName.toLowerCase()}`)
      .limit(1);

    if (existingTag[0]) {
      resolvedTagIds.push(existingTag[0].id);
      continue;
    }

    const createdTag = await db
      .insert(tags)
      .values({
        name: normalizedName
      })
      .returning({
        id: tags.id
      });

    resolvedTagIds.push(createdTag[0].id);
  }

  return resolvedTagIds;
}

async function getSeriesRecord(
  db: DbExecutor,
  reference: SeriesReferenceInput | null | undefined
) {
  if (reference === undefined) {
    return undefined;
  }

  if (reference === null) {
    return null;
  }

  if ("id" in reference) {
    const existingSeries = await db
      .select({
        id: series.id,
        totalVolumes: series.totalVolumes
      })
      .from(series)
      .where(eq(series.id, reference.id))
      .limit(1);

    if (!existingSeries[0]) {
      throw new ApiError(400, "Series does not exist.");
    }

    return existingSeries[0];
  }

  const normalizedName = reference.name.trim();
  const existingSeries = await db
    .select({
      id: series.id,
      totalVolumes: series.totalVolumes
    })
    .from(series)
    .where(sql`lower(${series.name}) = ${normalizedName.toLowerCase()}`)
    .limit(1);

  if (existingSeries[0]) {
    if (
      reference.totalVolumes !== undefined &&
      reference.totalVolumes !== existingSeries[0].totalVolumes
    ) {
      await db
        .update(series)
        .set({
          totalVolumes: reference.totalVolumes ?? null
        })
        .where(eq(series.id, existingSeries[0].id));
    }

    return {
      id: existingSeries[0].id,
      totalVolumes:
        reference.totalVolumes !== undefined
          ? reference.totalVolumes ?? null
          : existingSeries[0].totalVolumes
    };
  }

  const createdSeries = await db
    .insert(series)
    .values({
      name: normalizedName,
      totalVolumes: reference.totalVolumes ?? null
    })
    .returning({
      id: series.id,
      totalVolumes: series.totalVolumes
    });

  return createdSeries[0];
}

async function replaceBookAuthors(
  db: DbExecutor,
  bookId: string,
  authorIds: string[]
) {
  await db.delete(bookAuthors).where(eq(bookAuthors.bookId, bookId));

  if (authorIds.length === 0) {
    return;
  }

  await db.insert(bookAuthors).values(
    authorIds.map((authorId) => ({
      bookId,
      authorId
    }))
  );
}

async function replaceBookTags(db: DbExecutor, bookId: string, tagIds: string[]) {
  await db.delete(bookTags).where(eq(bookTags.bookId, bookId));

  if (tagIds.length === 0) {
    return;
  }

  await db.insert(bookTags).values(
    tagIds.map((tagId) => ({
      bookId,
      tagId
    }))
  );
}

async function upsertBookSeries(
  db: DbExecutor,
  bookId: string,
  seriesId: string | null,
  seriesOrder: number | null
) {
  await db.delete(bookSeries).where(eq(bookSeries.bookId, bookId));

  if (!seriesId) {
    return;
  }

  await db.insert(bookSeries).values({
    bookId,
    seriesId,
    seriesOrder
  });
}

async function getExistingBookOrThrow(db: DbExecutor, bookId: string) {
  const existingBook = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
  return assertFound(existingBook[0], "Book not found.");
}

function parseLoanedAt(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "loanedAt must be a valid ISO datetime.");
  }

  return parsedDate;
}

function computeBookValues(
  input: CreateBookInput | UpdateBookInput,
  existingBook?: BookRow,
  categoryId?: string | null
) {
  const normalizedIsbn = input.isbn !== undefined ? normalizeIsbn(input.isbn ?? null) : undefined;

  if (input.isbn !== undefined && input.isbn !== null && !normalizedIsbn) {
    throw new ApiError(400, "ISBN must be a valid ISBN-10 or ISBN-13.");
  }

  const nextStatus = input.status ?? existingBook?.status;
  const nextReadMonth =
    input.readMonth !== undefined ? input.readMonth ?? null : existingBook?.readMonth ?? null;
  const nextReadYear =
    input.readYear !== undefined ? input.readYear ?? null : existingBook?.readYear ?? null;

  if (!nextStatus) {
    throw new ApiError(400, "status is required.");
  }

  if (nextReadMonth != null && nextReadYear == null) {
    throw new ApiError(400, "readYear is required when readMonth is provided.");
  }

  let loanedTo =
    input.loanedTo !== undefined ? input.loanedTo ?? null : existingBook?.loanedTo ?? null;
  let loanedAt =
    input.loanedAt !== undefined
      ? parseLoanedAt(input.loanedAt ?? null)
      : existingBook?.loanedAt ?? null;

  if (nextStatus === "loaned") {
    if (!loanedTo) {
      throw new ApiError(400, "loanedTo is required when status is loaned.");
    }

    loanedAt ??= new Date();
  } else if (input.status !== undefined || existingBook?.status === "loaned") {
    loanedTo = null;
    loanedAt = null;
  }

  const resolvedLocation =
    input.location !== undefined
      ? input.location
      : existingBook
        ? {
            locationName: existingBook.locationName,
            shelfRow: existingBook.shelfRow,
            shelfColumn: existingBook.shelfColumn
          }
        : null;

  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.isbn !== undefined ? { isbn: normalizedIsbn ?? null } : {}),
    ...(input.publisher !== undefined ? { publisher: input.publisher ?? null } : {}),
    ...(input.publicationYear !== undefined
      ? { publicationYear: input.publicationYear ?? null }
      : {}),
    ...(input.pageCount !== undefined ? { pageCount: input.pageCount ?? null } : {}),
    status: nextStatus,
    ...(resolvedLocation !== undefined
      ? {
          locationName: resolvedLocation?.locationName ?? null,
          shelfRow: resolvedLocation?.shelfRow ?? null,
          shelfColumn: resolvedLocation?.shelfColumn ?? null
        }
      : {}),
    ...(input.copyCount !== undefined ? { copyCount: input.copyCount } : {}),
    ...(input.donatable !== undefined ? { donatable: input.donatable } : {}),
    ...(input.rating !== undefined ? { rating: input.rating ?? null } : {}),
    ...(input.personalNote !== undefined
      ? { personalNote: input.personalNote ?? null }
      : {}),
    readMonth: nextReadMonth,
    readYear: nextReadYear,
    loanedTo,
    loanedAt,
    ...(input.coverCustomUrl !== undefined
      ? { coverCustomUrl: input.coverCustomUrl ?? null }
      : {}),
    ...(input.coverMetadataUrl !== undefined
      ? { coverMetadataUrl: input.coverMetadataUrl ?? null }
      : {}),
    ...(categoryId !== undefined ? { categoryId } : {})
  };
}

function buildListBooksWhere(db: DbClient, filters: ListBooksQuery) {
  const conditions = [];

  if (filters.status) {
    conditions.push(eq(books.status, filters.status));
  }

  if (filters.category) {
    conditions.push(eq(books.categoryId, filters.category));
  }

  if (filters.author) {
    conditions.push(
      inArray(
        books.id,
        db
          .select({
            bookId: bookAuthors.bookId
          })
          .from(bookAuthors)
          .where(eq(bookAuthors.authorId, filters.author))
      )
    );
  }

  if (filters.tag) {
    conditions.push(
      inArray(
        books.id,
        db
          .select({
            bookId: bookTags.bookId
          })
          .from(bookTags)
          .where(eq(bookTags.tagId, filters.tag))
      )
    );
  }

  if (filters.series) {
    conditions.push(
      inArray(
        books.id,
        db
          .select({
            bookId: bookSeries.bookId
          })
          .from(bookSeries)
          .where(eq(bookSeries.seriesId, filters.series))
      )
    );
  }

  if (filters.location) {
    const searchValue = `%${filters.location.toLowerCase()}%`;

    conditions.push(sql`
      lower(
        concat_ws(
          ' / ',
          coalesce(${books.locationName}, ''),
          coalesce(${books.shelfRow}, ''),
          coalesce(${books.shelfColumn}::text, '')
        )
      ) like ${searchValue}
    `);
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}

export async function listBooks(filters: ListBooksQuery): Promise<BookListResponse> {
  const db = createDb();
  const whereClause = buildListBooksWhere(db, filters);
  const pageSize = filters.limit ?? DEFAULT_BOOKS_PAGE_SIZE;
  const totalItemsResult = await db
    .select({
      count: countDistinct(books.id)
    })
    .from(books)
    .where(whereClause);

  const totalItems = totalItemsResult[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(filters.page, totalPages);

  const bookRows = await db
    .select()
    .from(books)
    .where(whereClause)
    .orderBy(desc(books.createdAt), asc(books.title))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const relations = await loadBookRelations(db, bookRows);

  return {
    items: bookRows.map((book) => mapBookListItem(book, relations)),
    page,
    pageSize,
    totalItems,
    totalPages,
    filters: {
      status: filters.status ?? null,
      category: filters.category ?? null,
      tag: filters.tag ?? null,
      author: filters.author ?? null,
      series: filters.series ?? null,
      location: filters.location ?? null
    }
  };
}

export async function listRecentBooks(limit = 5) {
  const db = createDb();
  const bookRows = await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt), asc(books.title))
    .limit(limit);
  const relations = await loadBookRelations(db, bookRows);

  return bookRows.map((book) => mapBookListItem(book, relations));
}

export async function getBookDetail(bookId: string) {
  const db = createDb();
  const book = await getExistingBookOrThrow(db, bookId);
  const relations = await loadBookRelations(db, [book]);

  return mapBookDetail(book, relations);
}

export async function createBook(input: CreateBookInput): Promise<CreateBookResponse> {
  const db = createDb();

  return db.transaction(async (tx) => {
    const authorIds = await Promise.all(input.authors.map((author) => getAuthorId(tx, author)));
    const uniqueAuthorIds = Array.from(new Set(authorIds));

    if (uniqueAuthorIds.length === 0) {
      throw new ApiError(400, "At least one author is required.");
    }

    const categoryId = await getCategoryId(tx, input.category);
    const tagIds = await getTagIds(tx, input.tags ?? []);
    const seriesRecord = await getSeriesRecord(tx, input.series);

    const duplicateCheck = await checkDuplicateBook({
      isbn: input.isbn ?? null,
      title: input.title,
      authorIds: uniqueAuthorIds
    });

    if (duplicateCheck.isDuplicate) {
      if (input.duplicateResolution === "increase_copy") {
        const increasedBooks = await tx
          .update(books)
          .set({
            copyCount: sql`${books.copyCount} + 1`
          })
          .where(eq(books.id, duplicateCheck.existingBook.id))
          .returning();
        const increasedBook = increasedBooks[0];
        const relations = await loadBookRelations(tx, [increasedBook]);

        return normalizeCreateBookResult(
          "increase_copy",
          mapBookDetail(increasedBook, relations)
        );
      }

      if (
        input.duplicateResolution !== "new_edition" &&
        input.duplicateResolution !== "ignore"
      ) {
        throw new ApiError(409, "Duplicate book detected.", duplicateCheck);
      }
    }

    const bookValues = {
      ...computeBookValues(input, undefined, categoryId),
      title: input.title
    };

    const insertedBooks = await tx
      .insert(books)
      .values(bookValues)
      .returning();
    const createdBook = insertedBooks[0];

    await replaceBookAuthors(tx, createdBook.id, uniqueAuthorIds);
    await replaceBookTags(tx, createdBook.id, tagIds);
    await upsertBookSeries(
      tx,
      createdBook.id,
      seriesRecord?.id ?? null,
      seriesRecord ? input.seriesOrder ?? null : null
    );

    const relations = await loadBookRelations(tx, [createdBook]);

    return normalizeCreateBookResult("created", mapBookDetail(createdBook, relations));
  });
}

export async function updateBook(bookId: string, input: UpdateBookInput) {
  const db = createDb();

  return db.transaction(async (tx) => {
    const existingBook = await getExistingBookOrThrow(tx, bookId);
    const categoryId =
      input.category !== undefined ? await getCategoryId(tx, input.category) : undefined;
    const seriesRecord =
      input.series !== undefined ? await getSeriesRecord(tx, input.series) : undefined;

    const updatedBooks = await tx
      .update(books)
      .set(computeBookValues(input, existingBook, categoryId))
      .where(eq(books.id, bookId))
      .returning();
    const updatedBook = updatedBooks[0];

    if (input.authors !== undefined) {
      const authorIds = await Promise.all(
        input.authors.map((author) => getAuthorId(tx, author))
      );
      await replaceBookAuthors(tx, bookId, Array.from(new Set(authorIds)));
    }

    if (input.tags !== undefined) {
      const tagIds = await getTagIds(tx, input.tags);
      await replaceBookTags(tx, bookId, tagIds);
    }

    if (input.series !== undefined || input.seriesOrder !== undefined) {
      let nextSeriesId: string | null = null;
      let nextSeriesOrder: number | null = null;

      if (seriesRecord) {
        nextSeriesId = seriesRecord.id;
        nextSeriesOrder = input.seriesOrder ?? null;
      } else if (seriesRecord === undefined && input.seriesOrder !== undefined) {
        const existingSeriesRow = await tx
          .select({
            seriesId: bookSeries.seriesId,
            seriesOrder: bookSeries.seriesOrder
          })
          .from(bookSeries)
          .where(eq(bookSeries.bookId, bookId))
          .limit(1);

        if (!existingSeriesRow[0]) {
          throw new ApiError(
            400,
            "seriesOrder cannot be updated on a book without a series."
          );
        }

        nextSeriesId = existingSeriesRow[0].seriesId;
        nextSeriesOrder = input.seriesOrder ?? existingSeriesRow[0].seriesOrder ?? null;
      }

      await upsertBookSeries(tx, bookId, nextSeriesId, nextSeriesOrder);
    }

    const refreshedBook = await getExistingBookOrThrow(tx, bookId);
    const relations = await loadBookRelations(tx, [refreshedBook]);

    return mapBookDetail(refreshedBook, relations);
  });
}

export async function deleteBook(bookId: string) {
  const db = createDb();
  await getExistingBookOrThrow(db, bookId);
  await db.delete(books).where(eq(books.id, bookId));
}

export async function bulkUpdateBooks(input: BulkBooksPatchInput | BulkBooksPatchInputSchema) {
  const db = createDb();

  return db.transaction(async (tx) => {
    const existingBooks = await tx
      .select({
        id: books.id
      })
      .from(books)
      .where(inArray(books.id, input.bookIds));

    if (existingBooks.length !== input.bookIds.length) {
      throw new ApiError(404, "One or more books were not found.");
    }

    const categoryId =
      input.category !== undefined ? await getCategoryId(tx, input.category) : undefined;
    const nextTagIds = input.tags !== undefined ? await getTagIds(tx, input.tags) : undefined;
    const nextSeriesRecord =
      input.series !== undefined ? await getSeriesRecord(tx, input.series) : undefined;

    const updateValues: Partial<typeof books.$inferInsert> = {};

    if (categoryId !== undefined) {
      updateValues.categoryId = categoryId;
    }

    if (input.location !== undefined) {
      updateValues.locationName = input.location?.locationName ?? null;
      updateValues.shelfRow = input.location?.shelfRow ?? null;
      updateValues.shelfColumn = input.location?.shelfColumn ?? null;
    }

    if (input.status !== undefined) {
      updateValues.status = input.status;
      updateValues.loanedTo = null;
      updateValues.loanedAt = null;
    }

    if (input.donatable !== undefined) {
      updateValues.donatable = input.donatable;
    }

    if (Object.keys(updateValues).length > 0) {
      await tx.update(books).set(updateValues).where(inArray(books.id, input.bookIds));
    }

    if (nextTagIds !== undefined) {
      await tx.delete(bookTags).where(inArray(bookTags.bookId, input.bookIds));

      if (nextTagIds.length > 0) {
        await tx.insert(bookTags).values(
          input.bookIds.flatMap((bookId) =>
            nextTagIds.map((tagId) => ({
              bookId,
              tagId
            }))
          )
        );
      }
    }

    if (input.series !== undefined || input.seriesOrder !== undefined) {
      if (nextSeriesRecord === null) {
        await tx.delete(bookSeries).where(inArray(bookSeries.bookId, input.bookIds));
      } else if (nextSeriesRecord) {
        await tx.delete(bookSeries).where(inArray(bookSeries.bookId, input.bookIds));
        await tx.insert(bookSeries).values(
          input.bookIds.map((bookId) => ({
            bookId,
            seriesId: nextSeriesRecord.id,
            seriesOrder: input.seriesOrder ?? null
          }))
        );
      } else if (input.seriesOrder !== undefined) {
        const existingSeriesRows = await tx
          .select({
            bookId: bookSeries.bookId
          })
          .from(bookSeries)
          .where(inArray(bookSeries.bookId, input.bookIds));

        if (existingSeriesRows.length !== input.bookIds.length) {
          throw new ApiError(
            400,
            "seriesOrder cannot be updated for books without an existing series."
          );
        }

        await tx
          .update(bookSeries)
          .set({
            seriesOrder: input.seriesOrder ?? null
          })
          .where(inArray(bookSeries.bookId, input.bookIds));
      }
    }

    return {
      updatedCount: input.bookIds.length
    };
  });
}

export async function exportAllBooks(): Promise<BookDetail[]> {
  const db = createDb();
  const bookRows = await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt), asc(books.title));

  const relations = await loadBookRelations(db, bookRows);

  return bookRows.map((book) => mapBookDetail(book, relations));
}
