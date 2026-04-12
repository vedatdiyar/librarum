import { eq, sql } from "drizzle-orm";
import { createDb, recommendationPreferences } from "@/db";

export async function listPreferences(userId: string) {
  const db = createDb();
  return db
    .select()
    .from(recommendationPreferences)
    .where(eq(recommendationPreferences.userId, userId));
}

export async function addPreference(
  userId: string,
  type: "author" | "category",
  value: string
) {
  const db = createDb();
  const existing = await db
    .select({ id: recommendationPreferences.id })
    .from(recommendationPreferences)
    .where(
      sql`${recommendationPreferences.userId} = ${userId} AND ${recommendationPreferences.type} = ${type} AND lower(${recommendationPreferences.value}) = lower(${value})`
    )
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const inserted = await db
    .insert(recommendationPreferences)
    .values({ userId, type, value })
    .returning();

  return inserted[0];
}

export async function deletePreference(id: string, userId: string) {
  const db = createDb();
  await db
    .delete(recommendationPreferences)
    .where(
      sql`${recommendationPreferences.id} = ${id} AND ${recommendationPreferences.userId} = ${userId}`
    );
}
