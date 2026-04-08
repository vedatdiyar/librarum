import { z } from "zod";
import type { BookStatus, DuplicateResolution } from "@exlibris/types";

const UUID_MESSAGE = "Must be a valid UUID.";

export const uuidSchema = z.string().uuid(UUID_MESSAGE);
export const isbnRouteParamSchema = z.string().trim().min(10).max(17);

const bookStatusValues: [BookStatus, ...BookStatus[]] = [
  "owned",
  "completed",
  "abandoned",
  "loaned",
  "lost"
];

const duplicateResolutionValues: [
  DuplicateResolution,
  ...DuplicateResolution[]
] = ["block", "increase_copy", "new_edition", "ignore"];

const bulkBookStatusValues = bookStatusValues.filter(
  (status) => status !== "loaned"
) as [Exclude<BookStatus, "loaned">, ...Exclude<BookStatus, "loaned">[]];

function trimToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function uppercaseOrNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim().toUpperCase();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

const nullableStringSchema = z
  .preprocess(trimToNull, z.string().min(1).nullable())
  .optional();

const nullableUrlSchema = z
  .preprocess(trimToNull, z.string().url().nullable())
  .optional();

const nullablePositiveIntSchema = z.number().int().min(1).nullable().optional();

const nullableRatingSchema = z
  .number()
  .min(0.5)
  .max(5)
  .refine((value) => Number.isInteger(value * 2), {
    message: "Rating must be in 0.5 increments."
  })
  .nullable()
  .optional();

const nullableDateTimeSchema = z
  .union([z.string().datetime({ offset: true }), z.null()])
  .optional();

export const entityReferenceSchema = z.union([
  z.object({
    id: uuidSchema
  }),
  z.object({
    name: z.string().trim().min(1)
  })
]);

export const seriesReferenceSchema = z.union([
  z.object({
    id: uuidSchema
  }),
  z.object({
    name: z.string().trim().min(1),
    totalVolumes: z.number().int().min(1).nullable().optional()
  })
]);

export const locationInputSchema = z
  .object({
    locationName: nullableStringSchema,
    shelfRow: z.preprocess(uppercaseOrNull, z.string().length(1).nullable()).optional(),
    shelfColumn: nullablePositiveIntSchema
  })
  .strict();

export const listBooksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(25).default(25),
  sort: z.enum(["created_at"]).default("created_at"),
  status: z.enum(bookStatusValues).nullable().optional().catch(undefined),
  category: uuidSchema.nullable().optional().catch(undefined),
  tag: uuidSchema.nullable().optional().catch(undefined),
  author: uuidSchema.nullable().optional().catch(undefined),
  series: uuidSchema.nullable().optional().catch(undefined),
  location: nullableStringSchema
});

export const authorListQuerySchema = z.object({
  q: nullableStringSchema
});

export const searchQuerySchema = z.object({
  q: nullableStringSchema
});

export const createAuthorSchema = z.object({
  name: z.string().trim().min(1)
});

export const updateAuthorSchema = createAuthorSchema;

export const createCategorySchema = z.object({
  name: z.string().trim().min(1)
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1)
});

export const createSeriesSchema = z.object({
  name: z.string().trim().min(1),
  totalVolumes: z.number().int().min(1).nullable().optional()
});

export const updateSeriesSchema = createSeriesSchema;

export const createBookSchema = z
  .object({
    title: z.string().trim().min(1),
    authors: z.array(entityReferenceSchema).min(1),
    isbn: nullableStringSchema,
    publisher: nullableStringSchema,
    publicationYear: nullablePositiveIntSchema,
    pageCount: nullablePositiveIntSchema,
    status: z.enum(bookStatusValues),
    location: locationInputSchema.nullable().optional(),
    copyCount: z.number().int().min(1).default(1),
    donatable: z.boolean().default(false),
    rating: nullableRatingSchema,
    personalNote: nullableStringSchema,
    readMonth: z.number().int().min(1).max(12).nullable().optional(),
    readYear: nullablePositiveIntSchema,
    loanedTo: nullableStringSchema,
    loanedAt: nullableDateTimeSchema,
    coverCustomUrl: nullableUrlSchema,
    coverMetadataUrl: nullableUrlSchema,
    category: entityReferenceSchema.nullable().optional(),
    tags: z.array(entityReferenceSchema).default([]),
    series: seriesReferenceSchema.nullable().optional(),
    seriesOrder: z.number().int().min(1).nullable().optional(),
    duplicateResolution: z.enum(duplicateResolutionValues).default("block")
  })
  .superRefine((value, context) => {
    if (value.readMonth != null && value.readYear == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "readYear is required when readMonth is provided.",
        path: ["readYear"]
      });
    }

    if (value.status === "loaned" && !value.loanedTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "loanedTo is required when status is loaned.",
        path: ["loanedTo"]
      });
    }

    if (value.series === null && value.seriesOrder != null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "seriesOrder cannot be set when series is null.",
        path: ["seriesOrder"]
      });
    }
  });

export const duplicateCheckSchema = z.object({
  isbn: nullableStringSchema,
  title: z.string().trim().min(1),
  authorIds: z.array(uuidSchema).min(1),
  excludeBookId: uuidSchema.optional()
});

export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    authors: z.array(entityReferenceSchema).min(1).optional(),
    isbn: nullableStringSchema,
    publisher: nullableStringSchema,
    publicationYear: nullablePositiveIntSchema,
    pageCount: nullablePositiveIntSchema,
    status: z.enum(bookStatusValues).optional(),
    location: locationInputSchema.nullable().optional(),
    copyCount: z.number().int().min(1).optional(),
    donatable: z.boolean().optional(),
    rating: nullableRatingSchema,
    personalNote: nullableStringSchema,
    readMonth: z.number().int().min(1).max(12).nullable().optional(),
    readYear: nullablePositiveIntSchema,
    loanedTo: nullableStringSchema,
    loanedAt: nullableDateTimeSchema,
    coverCustomUrl: nullableUrlSchema,
    coverMetadataUrl: nullableUrlSchema,
    category: entityReferenceSchema.nullable().optional(),
    tags: z.array(entityReferenceSchema).optional(),
    series: seriesReferenceSchema.nullable().optional(),
    seriesOrder: z.number().int().min(1).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const bulkBooksPatchSchema = z
  .object({
    bookIds: z.array(uuidSchema).min(1),
    category: entityReferenceSchema.nullable().optional(),
    tags: z.array(entityReferenceSchema).optional(),
    location: locationInputSchema.nullable().optional(),
    status: z.enum(bulkBookStatusValues).optional(),
    donatable: z.boolean().optional(),
    series: seriesReferenceSchema.nullable().optional(),
    seriesOrder: z.number().int().min(1).nullable().optional()
  })
  .superRefine((value, context) => {
    const hasMutationField =
      value.category !== undefined ||
      value.tags !== undefined ||
      value.location !== undefined ||
      value.status !== undefined ||
      value.donatable !== undefined ||
      value.series !== undefined ||
      value.seriesOrder !== undefined;

    if (!hasMutationField) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one update field must be provided."
      });
    }

    if (value.series === null && value.seriesOrder != null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "seriesOrder cannot be set when series is null.",
        path: ["seriesOrder"]
      });
    }
  });

export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BulkBooksPatchInputSchema = z.infer<typeof bulkBooksPatchSchema>;
export type DuplicateCheckInputSchema = z.infer<typeof duplicateCheckSchema>;
