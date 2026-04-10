import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { authors, categories, series } from "./catalog.ts";

export const bookStatusEnum = pgEnum("book_status", [
  "owned",
  "completed",
  "abandoned",
  "loaned",
  "lost"
]);

export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    subtitle: text("subtitle"),
    isbn: text("isbn"),
    publisher: text("publisher"),
    publicationYear: integer("publication_year"),
    pageCount: integer("page_count"),
    status: bookStatusEnum("status").notNull(),
    locationName: text("location_name"),
    shelfRow: text("shelf_row"),
    copyCount: integer("copy_count").notNull().default(1),
    donatable: boolean("donatable").notNull().default(false),
    rating: numeric("rating", {
      precision: 2,
      scale: 1,
      mode: "number"
    }),
    personalNote: text("personal_note"),
    readMonth: integer("read_month"),
    readYear: integer("read_year"),
    loanedTo: text("loaned_to"),
    loanedAt: timestamp("loaned_at", {
      withTimezone: true,
      mode: "date"
    }),
    coverCustomUrl: text("cover_custom_url"),
    coverMetadataUrl: text("cover_metadata_url"),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date"
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date"
    })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date())
  },
  (table) => [
    index("books_status_idx").on(table.status),
    uniqueIndex("books_slug_unique").on(table.slug),
    index("books_category_id_idx").on(table.categoryId),
    index("books_read_year_idx").on(table.readYear),
    index("books_read_month_idx").on(table.readMonth),
    check("books_copy_count_positive_check", sql`${table.copyCount} >= 1`),
    check(
      "books_publication_year_positive_check",
      sql`${table.publicationYear} is null or ${table.publicationYear} > 0`
    ),
    check(
      "books_page_count_positive_check",
      sql`${table.pageCount} is null or ${table.pageCount} > 0`
    ),
    check(
      "books_read_month_range_check",
      sql`${table.readMonth} is null or (${table.readMonth} >= 1 and ${table.readMonth} <= 12)`
    ),
    check(
      "books_read_month_requires_year_check",
      sql`${table.readMonth} is null or ${table.readYear} is not null`
    ),
    check(
      "books_rating_half_step_check",
      sql`${table.rating} is null or (${table.rating} >= 0.5 and ${table.rating} <= 5.0 and mod(((${table.rating} * 10)::int), 5) = 0)`
    )
  ]
);

export const bookAuthors = pgTable(
  "book_authors",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, {
        onDelete: "cascade",
        onUpdate: "cascade"
      }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, {
        onDelete: "cascade",
        onUpdate: "cascade"
      })
  },
  (table) => [
    primaryKey({
      name: "book_authors_pk",
      columns: [table.bookId, table.authorId]
    }),
    index("book_authors_author_id_idx").on(table.authorId)
  ]
);



export const bookSeries = pgTable(
  "book_series",
  {
    bookId: uuid("book_id")
      .notNull()
      .primaryKey()
      .references(() => books.id, {
        onDelete: "cascade",
        onUpdate: "cascade"
      }),
    seriesId: uuid("series_id")
      .notNull()
      .references(() => series.id, {
        onDelete: "cascade",
        onUpdate: "cascade"
      }),
    seriesOrder: integer("series_order")
  },
  (table) => [
    index("book_series_series_id_idx").on(table.seriesId),
    check(
      "book_series_series_order_positive_check",
      sql`${table.seriesOrder} is null or ${table.seriesOrder} >= 1`
    )
  ]
);

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type BookAuthor = typeof bookAuthors.$inferSelect;
export type NewBookAuthor = typeof bookAuthors.$inferInsert;
export type BookSeries = typeof bookSeries.$inferSelect;
export type NewBookSeries = typeof bookSeries.$inferInsert;
