import { z } from "zod";

const scoreSchema = z.number().min(0).max(100);

export const aiChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(500)
});

const aiRecommendationItemSchema = z.object({
  title: z.string().trim().min(1),
  author: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  score: scoreSchema
});

const aiMissingVolumeItemSchema = z.object({
  series: z.string().trim().min(1),
  missingVolumes: z.array(z.number().int().min(1)),
  reason: z.string().trim().min(1),
  score: scoreSchema
});

const aiFavoriteAuthorItemSchema = z.object({
  author: z.string().trim().min(1),
  suggestedTitles: z.array(z.string().trim().min(1)),
  reason: z.string().trim().min(1),
  score: scoreSchema
});

function createSectionSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    items: z.array(itemSchema)
  });
}

export const monthlySuggestionModelSchema = z.object({
  summary: z.string().trim().min(1),
  sections: z.object({
    readingList: createSectionSchema(aiRecommendationItemSchema),
    missingVolumes: createSectionSchema(aiMissingVolumeItemSchema),
    favoriteAuthors: createSectionSchema(aiFavoriteAuthorItemSchema),
    backlog: createSectionSchema(aiRecommendationItemSchema)
  })
});
