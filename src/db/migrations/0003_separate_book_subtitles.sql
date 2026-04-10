ALTER TABLE "books" ADD COLUMN "subtitle" text;
--> statement-breakpoint
UPDATE "books"
SET
	"title" = regexp_replace("title", '^(.*?)\s+(?:Cilt|Bölüm|Sayı)\s*:??\s*\d+(?:\s*[:\-]\s*.+)?$', '\1'),
	"subtitle" = regexp_replace(
		regexp_replace("title", '^(.*?)\s+((?:Cilt|Bölüm|Sayı)\s*:??\s*\d+(?:\s*[:\-]\s*.+)?)$', '\2'),
		'^\1$',
		''
	)
WHERE "subtitle" IS NULL
	AND "title" ~ '^(.*?)\s+(?:Cilt|Bölüm|Sayı)\s*:??\s*\d+(?:\s*[:\-]\s*.+)?$';
--> statement-breakpoint