import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
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
  (table) => [uniqueIndex("users_email_ci_unique").on(sql`lower(${table.email})`)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
