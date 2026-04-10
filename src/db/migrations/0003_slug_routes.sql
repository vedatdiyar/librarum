ALTER TABLE "authors" ADD COLUMN "slug" text;
ALTER TABLE "books" ADD COLUMN "slug" text;

WITH author_bases AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        regexp_replace(
          regexp_replace(
            lower(
              translate(name, 'çğıöşüâîû', 'cgiosuaiu')
            ),
            '[^a-z0-9]+',
            '-',
            'g'
          ),
          '(^-+)|(-+$)',
          '',
          'g'
        ),
        ''
      ),
      'author'
    ) AS slug_base
  FROM "authors"
),
author_slugs AS (
  SELECT
    id,
    CASE
      WHEN count(*) OVER (PARTITION BY slug_base) = 1 THEN slug_base
      ELSE slug_base || '-' || left(replace(id::text, '-', ''), 6)
    END AS slug
  FROM author_bases
)
UPDATE "authors"
SET "slug" = author_slugs.slug
FROM author_slugs
WHERE "authors"."id" = author_slugs.id;

WITH book_bases AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        regexp_replace(
          regexp_replace(
            lower(
              translate(concat_ws(' ', title, subtitle), 'çğıöşüâîû', 'cgiosuaiu')
            ),
            '[^a-z0-9]+',
            '-',
            'g'
          ),
          '(^-+)|(-+$)',
          '',
          'g'
        ),
        ''
      ),
      'book'
    ) AS slug_base
  FROM "books"
),
book_slugs AS (
  SELECT
    id,
    CASE
      WHEN count(*) OVER (PARTITION BY slug_base) = 1 THEN slug_base
      ELSE slug_base || '-' || left(replace(id::text, '-', ''), 6)
    END AS slug
  FROM book_bases
)
UPDATE "books"
SET "slug" = book_slugs.slug
FROM book_slugs
WHERE "books"."id" = book_slugs.id;

ALTER TABLE "authors" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "books" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "authors_slug_unique" ON "authors" USING btree ("slug");
CREATE UNIQUE INDEX "books_slug_unique" ON "books" USING btree ("slug");
