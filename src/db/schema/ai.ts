import { sql } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const recommendationPreferenceTypeEnum = pgEnum(
  "recommendation_preference_type",
  ["author", "category", "tag"]
);

export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  generatedAt: timestamp("generated_at", {
    withTimezone: true,
    mode: "date"
  })
    .notNull()
    .defaultNow(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull()
});

export const recommendationPreferences = pgTable(
  "recommendation_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: recommendationPreferenceTypeEnum("type").notNull(),
    value: text("value").notNull()
  },
  (table) => [
    uniqueIndex("recommendation_preferences_type_value_ci_unique").on(
      table.type,
      sql`lower(${table.value})`
    )
  ]
);

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type NewAiSuggestion = typeof aiSuggestions.$inferInsert;
export type RecommendationPreference = typeof recommendationPreferences.$inferSelect;
export type NewRecommendationPreference = typeof recommendationPreferences.$inferInsert;
