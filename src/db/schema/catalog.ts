import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const authors = pgTable(
  "authors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull()
  },
  (table) => [
    uniqueIndex("authors_name_ci_unique").on(sql`lower(${table.name})`),
    uniqueIndex("authors_slug_unique").on(table.slug)
  ]
);

export const authorAliases = pgTable(
  "author_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, {
        onDelete: "cascade"
      }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull()
  },
  (table) => [
    uniqueIndex("author_aliases_normalized_name_unique").on(table.normalizedName)
  ]
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull()
  },
  (table) => [
    uniqueIndex("categories_name_ci_unique").on(sql`lower(${table.name})`)
  ]
);

export const series = pgTable(
  "series",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    totalVolumes: integer("total_volumes")
  },
  (table) => [
    uniqueIndex("series_name_ci_unique").on(sql`lower(${table.name})`),
    uniqueIndex("series_slug_unique").on(table.slug),
    check(
      "series_total_volumes_positive_check",
      sql`${table.totalVolumes} is null or ${table.totalVolumes} >= 1`
    )
  ]
);

export const publishers = pgTable(
  "publishers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull()
  },
  (table) => [
    uniqueIndex("publishers_name_ci_unique").on(sql`lower(${table.name})`),
    uniqueIndex("publishers_slug_unique").on(table.slug)
  ]
);

export const publisherAliases = pgTable(
  "publisher_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => publishers.id, {
        onDelete: "cascade"
      }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull()
  },
  (table) => [
    uniqueIndex("publisher_aliases_normalized_name_unique").on(table.normalizedName)
  ]
);

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;
export type AuthorAlias = typeof authorAliases.$inferSelect;
export type NewAuthorAlias = typeof authorAliases.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
export type Publisher = typeof publishers.$inferSelect;
export type NewPublisher = typeof publishers.$inferInsert;
export type PublisherAlias = typeof publisherAliases.$inferSelect;
export type NewPublisherAlias = typeof publisherAliases.$inferInsert;
