import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { closeAllDbPools, createDb } from "../db/client.ts";

function loadDatabaseUrl() {
  if (process.env.LIBRARUM_DATABASE_URL) {
    return process.env.LIBRARUM_DATABASE_URL;
  }

  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return undefined;
  }

  const envText = fs.readFileSync(envPath, "utf8");
  const line = envText
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("LIBRARUM_DATABASE_URL="));

  if (!line) {
    return undefined;
  }

  const raw = line.slice("LIBRARUM_DATABASE_URL=".length).trim();
  if (!raw) {
    return undefined;
  }

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  return raw;
}

async function run() {
  const databaseUrl = loadDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("LIBRARUM_DATABASE_URL is missing.");
  }

  const db = createDb(databaseUrl);

  await db.execute(sql`ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "slug" text`);

  await db.execute(sql`
    UPDATE "series"
    SET "slug" = CASE
      WHEN "slug" IS NOT NULL AND btrim("slug") <> '' THEN "slug"
      ELSE COALESCE(
        NULLIF(
          regexp_replace(
            replace(
              replace(translate(lower("name"), 'çğıöşü', 'cgiosu'), '''', ''),
              '’',
              ''
            ),
            '[^a-z0-9]+',
            '-',
            'g'
          ),
          ''
        ),
        'series'
      )
    END
  `);

  await db.execute(sql`UPDATE "series" SET "slug" = regexp_replace("slug", '^-+|-+$', '', 'g')`);
  await db.execute(sql`UPDATE "series" SET "slug" = 'series' WHERE "slug" IS NULL OR "slug" = ''`);

  await db.execute(sql`
    WITH duplicated AS (
      SELECT
        "id",
        "slug",
        row_number() OVER (PARTITION BY "slug" ORDER BY "id") AS rn
      FROM "series"
    )
    UPDATE "series" s
    SET "slug" = s."slug" || '-' || substr(replace(s."id"::text, '-', ''), 1, 6)
    FROM duplicated d
    WHERE s."id" = d."id" AND d.rn > 1
  `);

  await db.execute(sql`ALTER TABLE "series" ALTER COLUMN "slug" SET NOT NULL`);
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "series_slug_unique" ON "series" USING btree ("slug")`
  );

  console.log("series.slug migration applied");
  await closeAllDbPools();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
