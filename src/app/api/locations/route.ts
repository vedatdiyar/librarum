import { apiSuccess, withApiHandler } from "@/server/api";
import { createDb } from "@/db";
import { books } from "@/db/schema/books";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  const db = createDb();
  
  const result = await db
    .select({
      name: books.locationName,
    })
    .from(books)
    .where(sql`${books.locationName} is not null and ${books.locationName} != ''`)
    .groupBy(books.locationName)
    .orderBy(books.locationName);

  // Filter out any potential nulls (though the WHERE clause should handle it)
  const locations = result
    .map((r) => r.name)
    .filter((name): name is string => Boolean(name));

  return apiSuccess(locations);
});
