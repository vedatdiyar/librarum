ALTER TABLE "series" ADD COLUMN "slug" text;--> statement-breakpoint

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
END;--> statement-breakpoint

UPDATE "series"
SET "slug" = regexp_replace("slug", '^-+|-+$', '', 'g');--> statement-breakpoint

UPDATE "series"
SET "slug" = 'series'
WHERE "slug" IS NULL OR "slug" = '';--> statement-breakpoint

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
WHERE s."id" = d."id" AND d.rn > 1;--> statement-breakpoint

ALTER TABLE "series" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "series_slug_unique" ON "series" USING btree ("slug");