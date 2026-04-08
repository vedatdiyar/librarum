CREATE TYPE "public"."book_status" AS ENUM('owned', 'completed', 'abandoned', 'loaned', 'lost');--> statement-breakpoint
CREATE TYPE "public"."recommendation_preference_type" AS ENUM('author', 'category', 'tag');--> statement-breakpoint
CREATE TABLE "ai_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_authors" (
	"book_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	CONSTRAINT "book_authors_pk" PRIMARY KEY("book_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "book_series" (
	"book_id" uuid PRIMARY KEY NOT NULL,
	"series_id" uuid NOT NULL,
	"series_order" integer,
	CONSTRAINT "book_series_series_order_positive_check" CHECK ("book_series"."series_order" is null or "book_series"."series_order" >= 1)
);
--> statement-breakpoint
CREATE TABLE "book_tags" (
	"book_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "book_tags_pk" PRIMARY KEY("book_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"isbn" text,
	"publisher" text,
	"publication_year" integer,
	"page_count" integer,
	"status" "book_status" NOT NULL,
	"location_name" text,
	"shelf_row" text,
	"shelf_column" integer,
	"copy_count" integer DEFAULT 1 NOT NULL,
	"donatable" boolean DEFAULT false NOT NULL,
	"rating" numeric(2, 1),
	"personal_note" text,
	"read_month" integer,
	"read_year" integer,
	"loaned_to" text,
	"loaned_at" timestamp with time zone,
	"cover_custom_url" text,
	"cover_metadata_url" text,
	"category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_copy_count_positive_check" CHECK ("books"."copy_count" >= 1),
	CONSTRAINT "books_publication_year_positive_check" CHECK ("books"."publication_year" is null or "books"."publication_year" > 0),
	CONSTRAINT "books_page_count_positive_check" CHECK ("books"."page_count" is null or "books"."page_count" > 0),
	CONSTRAINT "books_shelf_column_positive_check" CHECK ("books"."shelf_column" is null or "books"."shelf_column" >= 1),
	CONSTRAINT "books_read_month_range_check" CHECK ("books"."read_month" is null or ("books"."read_month" >= 1 and "books"."read_month" <= 12)),
	CONSTRAINT "books_read_month_requires_year_check" CHECK ("books"."read_month" is null or "books"."read_year" is not null),
	CONSTRAINT "books_rating_half_step_check" CHECK ("books"."rating" is null or ("books"."rating" >= 0.5 and "books"."rating" <= 5.0 and mod((("books"."rating" * 10)::int), 5) = 0))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "recommendation_preference_type" NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"total_volumes" integer,
	CONSTRAINT "series_total_volumes_positive_check" CHECK ("series"."total_volumes" is null or "series"."total_volumes" >= 1)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "book_series" ADD CONSTRAINT "book_series_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "book_series" ADD CONSTRAINT "book_series_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "book_tags" ADD CONSTRAINT "book_tags_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "book_tags" ADD CONSTRAINT "book_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "authors_name_ci_unique" ON "authors" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "book_authors_author_id_idx" ON "book_authors" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "book_series_series_id_idx" ON "book_series" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "book_tags_tag_id_idx" ON "book_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "books_status_idx" ON "books" USING btree ("status");--> statement-breakpoint
CREATE INDEX "books_category_id_idx" ON "books" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "books_read_year_idx" ON "books" USING btree ("read_year");--> statement-breakpoint
CREATE INDEX "books_read_month_idx" ON "books" USING btree ("read_month");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_ci_unique" ON "categories" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_preferences_type_value_ci_unique" ON "recommendation_preferences" USING btree ("type",lower("value"));--> statement-breakpoint
CREATE UNIQUE INDEX "series_name_ci_unique" ON "series" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_ci_unique" ON "tags" USING btree (lower("name"));