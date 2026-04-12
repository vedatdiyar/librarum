DROP INDEX "recommendation_preferences_type_value_ci_unique";--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "recommendation_preferences" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_preferences" ADD CONSTRAINT "recommendation_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_preferences_user_type_value_ci_unique" ON "recommendation_preferences" USING btree ("user_id","type",lower("value"));