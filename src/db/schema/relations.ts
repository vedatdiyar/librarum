import { relations } from "drizzle-orm";
import { users } from "./users.ts";
import { authorAliases, authors, categories, series } from "./catalog.ts";
import { books, bookAuthors, bookSeries } from "./books.ts";

export const booksRelations = relations(books, ({ many, one }) => ({
  category: one(categories, {
    fields: [books.categoryId],
    references: [categories.id]
  }),
  authors: many(bookAuthors),
  series: one(bookSeries)
}));

export const usersRelations = relations(users, () => ({}));

export const authorsRelations = relations(authors, ({ many }) => ({
  books: many(bookAuthors),
  aliases: many(authorAliases)
}));

export const authorAliasesRelations = relations(authorAliases, ({ one }) => ({
  author: one(authors, {
    fields: [authorAliases.authorId],
    references: [authors.id]
  })
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books)
}));

export const seriesRelations = relations(series, ({ many }) => ({
  books: many(bookSeries)
}));

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
  book: one(books, {
    fields: [bookAuthors.bookId],
    references: [books.id]
  }),
  author: one(authors, {
    fields: [bookAuthors.authorId],
    references: [authors.id]
  })
}));

export const bookSeriesRelations = relations(bookSeries, ({ one }) => ({
  book: one(books, {
    fields: [bookSeries.bookId],
    references: [books.id]
  }),
  series: one(series, {
    fields: [bookSeries.seriesId],
    references: [series.id]
  })
}));
