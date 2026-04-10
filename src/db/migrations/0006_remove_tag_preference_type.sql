DELETE FROM "recommendation_preferences"
WHERE "type"::text = 'tag';
--> statement-breakpoint
ALTER TYPE "recommendation_preference_type" RENAME TO "recommendation_preference_type_old";
--> statement-breakpoint
CREATE TYPE "recommendation_preference_type" AS ENUM ('author', 'category');
--> statement-breakpoint
ALTER TABLE "recommendation_preferences"
ALTER COLUMN "type" TYPE "recommendation_preference_type"
USING ("type"::text::"recommendation_preference_type");
--> statement-breakpoint
DROP TYPE "recommendation_preference_type_old";
