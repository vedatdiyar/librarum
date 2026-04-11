import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { closeAllDbPools, createDb } from "../db/client.ts";

function loadDatabaseUrl() {
  const envText = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
  const line = envText
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("LIBRARUM_DATABASE_URL="));

  if (!line) {
    throw new Error("LIBRARUM_DATABASE_URL missing in .env.local");
  }

  const raw = line.slice("LIBRARUM_DATABASE_URL=".length).trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  return raw;
}

async function run() {
  const db = createDb(loadDatabaseUrl());

  const result = await db.execute(sql`
    select
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'series'
          and column_name = 'slug'
      ) as has_slug,
      (select count(*)::int from "series" where "slug" is null or "slug" = '') as null_slug_count
  `);

  console.log(result.rows[0]);
  await closeAllDbPools();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
