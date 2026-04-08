import { relations } from "drizzle-orm";
import { users } from "./users";
import { authors, categories, tags, series } from "./catalog";
import { books, bookAuthors, bookTags, bookSeries } from "./books";

export const booksRelations = relations(books, ({ many, one }) => ({
  category: one(categories, {
    fields: [books.categoryId],
    references: [categories.id]
  }),
  authors: many(bookAuthors),
  tags: many(bookTags),
  series: one(bookSeries)
}));

export const usersRelations = relations(users, () => ({}));

export const authorsRelations = relations(authors, ({ many }) => ({
  books: many(bookAuthors)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books)
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  books: many(bookTags)
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

export const bookTagsRelations = relations(bookTags, ({ one }) => ({
  book: one(books, {
    fields: [bookTags.bookId],
    references: [books.id]
  }),
  tag: one(tags, {
    fields: [bookTags.tagId],
    references: [tags.id]
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
