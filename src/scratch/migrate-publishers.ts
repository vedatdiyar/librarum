import { createDb, publishers, publisherAliases, books } from "@/db";
import { eq, isNotNull, sql } from "drizzle-orm";
import { resolveOrCreatePublisher } from "@/server/publisher-identity";

async function migrate() {
  const db = createDb();
  console.log("Starting publisher migration...");

  // 1. Get all unique publisher strings from books
  const bookRows = await db
    .select({
      id: books.id,
      publisherName: books.publisher,
    })
    .from(books)
    .where(isNotNull(books.publisher));

  console.log(`Found ${bookRows.length} books with publisher strings.`);

  const uniqueNames = Array.from(new Set(bookRows.map(b => b.publisherName?.trim()).filter(Boolean) as string[]));
  console.log(`Unique publisher names to resolve: ${uniqueNames.length}`);

  // 2. Resolve each name to a centralized publisher record
  const nameToIdMap = new Map<string, string>();

  for (const name of uniqueNames) {
    process.stdout.write(`Resolving: ${name}... `);
    const resolution = await resolveOrCreatePublisher(db, name);
    const publisher = resolution.status === "suggested-merge" ? resolution.suggestedPublisher : resolution.publisher;
    nameToIdMap.set(name, publisher.id);
    console.log(`-> ${publisher.name} (${resolution.status})`);
  }

  // 3. Update books with the new publisherId
  console.log("Updating books with publisher IDs...");
  let updatedCount = 0;

  for (const book of bookRows) {
    if (!book.publisherName) continue;
    
    const publisherId = nameToIdMap.get(book.publisherName.trim());
    if (publisherId) {
      await db.update(books)
        .set({ publisherId })
        .where(eq(books.id, book.id));
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} books.`);
}

migrate().catch(console.error);
