import { eq, sql } from "drizzle-orm";
import { createDb, recommendationPreferences } from "@librarum/db";

export async function listPreferences() {
  const db = createDb();
  return db.select().from(recommendationPreferences);
}

export async function addPreference(type: "author" | "category" | "tag", value: string) {
  const db = createDb();
  const existing = await db
    .select({ id: recommendationPreferences.id })
    .from(recommendationPreferences)
    .where(
      sql`${recommendationPreferences.type} = ${type} AND lower(${recommendationPreferences.value}) = lower(${value})`
    )
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const inserted = await db
    .insert(recommendationPreferences)
    .values({ type, value })
    .returning();

  return inserted[0];
}

export async function deletePreference(id: string) {
  const db = createDb();
  await db.delete(recommendationPreferences).where(eq(recommendationPreferences.id, id));
}
