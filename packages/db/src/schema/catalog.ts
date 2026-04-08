import { sql } from "drizzle-orm";
import { integer, pgTable, text, uniqueIndex, uuid, check } from "drizzle-orm/pg-core";

export const authors = pgTable(
  "authors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull()
  },
  (table) => [
    uniqueIndex("authors_name_ci_unique").on(sql`lower(${table.name})`)
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

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull()
  },
  (table) => [uniqueIndex("tags_name_ci_unique").on(sql`lower(${table.name})`)]
);

export const series = pgTable(
  "series",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    totalVolumes: integer("total_volumes")
  },
  (table) => [
    uniqueIndex("series_name_ci_unique").on(sql`lower(${table.name})`),
    check(
      "series_total_volumes_positive_check",
      sql`${table.totalVolumes} is null or ${table.totalVolumes} >= 1`
    )
  ]
);

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
