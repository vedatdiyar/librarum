ALTER TABLE "books" DROP CONSTRAINT IF EXISTS "books_shelf_column_positive_check";
--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN IF EXISTS "shelf_column";