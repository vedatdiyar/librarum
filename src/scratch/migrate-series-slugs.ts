import { createDb, series } from "@/db";
import { eq } from "drizzle-orm";
import { buildUniqueSlug } from "@/lib/shared";

async function migrate() {
  const db = createDb();
  console.log("Starting series slug migration...");
  const allSeries = await db.select().from(series);
  console.log(`Found ${allSeries.length} series.`);
  const usedSlugs = new Set<string>();
  let updatedCount = 0;

  for (const s of allSeries) {
    const slug = buildUniqueSlug(s.name, s.id, "series", (candidate) => {
      return usedSlugs.has(candidate);
    });

    usedSlugs.add(slug);

    if (s.slug === slug) {
      continue;
    }
    
    console.log(`Updating ${s.name} -> ${slug}`);
    await db.update(series)
      .set({ slug } as any)
      .where(eq(series.id, s.id));

    updatedCount += 1;
  }

  console.log(`Migration complete. Updated ${updatedCount} rows.`);
}

migrate().catch(console.error);
