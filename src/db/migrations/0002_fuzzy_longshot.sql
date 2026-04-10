CREATE TABLE "author_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "author_aliases" ADD CONSTRAINT "author_aliases_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "author_aliases_normalized_name_unique" ON "author_aliases" USING btree ("normalized_name");
--> statement-breakpoint
INSERT INTO "author_aliases" ("author_id", "name", "normalized_name")
SELECT
	"id",
	"name",
	lower(regexp_replace(regexp_replace(trim("name"), '[^[:alnum:]\s]', ' ', 'g'), '\s+', ' ', 'g'))
FROM "authors"
ON CONFLICT ("normalized_name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "author_aliases" ("author_id", "name", "normalized_name")
SELECT
	"id",
	concat(split_part(trim("name"), ' ', 1), ' ', regexp_replace(trim("name"), '^.*\s', '')),
	lower(
		regexp_replace(
			regexp_replace(
				concat(split_part(trim("name"), ' ', 1), ' ', regexp_replace(trim("name"), '^.*\s', '')),
				'[^[:alnum:]\s]',
				' ',
				'g'
			),
			'\s+',
			' ',
			'g'
		)
	)
FROM "authors"
WHERE array_length(regexp_split_to_array(trim("name"), '\s+'), 1) >= 3
ON CONFLICT ("normalized_name") DO NOTHING;
