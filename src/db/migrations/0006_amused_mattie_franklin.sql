ALTER TABLE "ai_suggestions" DROP CONSTRAINT "ai_suggestions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "recommendation_preferences" DROP CONSTRAINT "recommendation_preferences_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "author_aliases" DROP CONSTRAINT "author_aliases_author_id_authors_id_fk";
--> statement-breakpoint
ALTER TABLE "publisher_aliases" DROP CONSTRAINT "publisher_aliases_publisher_id_publishers_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recommendation_preferences" ADD CONSTRAINT "recommendation_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "author_aliases" ADD CONSTRAINT "author_aliases_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "publisher_aliases" ADD CONSTRAINT "publisher_aliases_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE cascade;