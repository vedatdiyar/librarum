"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type {
  BookDetail,
  BookFormMode,
  BookWriteInput,
  CreateBookResponse,
  DuplicateCheckResponse,
  DuplicateResolution
} from "@/types";
import { normalizeIsbn } from "@/lib/shared";
import { readJsonResponse } from "@/lib/shared";

export const BOOK_FORM_SCHEMA = z
  .object({
    isbn: z.string().trim().optional(),
    title: z.string().trim().min(1, "Baslik zorunlu."),
    authorIds: z.array(z.string().uuid()).min(1, "En az bir yazar secilmeli."),
    publisher: z.string().trim().optional(),
    publicationYear: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d{1,4}$/.test(value), "Yayin yili sayi olmali."),
    pageCount: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), "Sayfa sayisi sayi olmali."),
    categoryId: z.string().trim().optional(),
    tagIds: z.array(z.string().uuid()).default([]),
    isSeries: z.boolean().default(false),
    seriesId: z.string().trim().optional(),
    seriesName: z.string().trim().optional(),
    seriesTotalVolumes: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), "Toplam cilt sayisi sayi olmali."),
    seriesOrder: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), "Cilt numarasi sayi olmali."),
    status: z.enum(["owned", "completed", "abandoned", "loaned", "lost"]),
    locationName: z.string().trim().optional(),
    shelfRow: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^[A-Za-z]$/.test(value), "Raf tek harf olmali."),
    shelfColumn: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), "Sutun sayi olmali."),
    copyCount: z
      .string()
      .trim()
      .default("1")
      .refine((value) => /^\d+$/.test(value) && Number(value) >= 1, "Kopya sayisi en az 1 olmali."),
    donatable: z.boolean().default(false),
    rating: z.number().min(0.5).max(5).nullable(),
    readMonth: z.string().trim().optional(),
    readYear: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d{4}$/.test(value), "Yil 4 haneli olmali."),
    personalNote: z.string().trim().optional(),
    loanedTo: z.string().trim().optional(),
    coverMetadataUrl: z.string().trim().url().optional().or(z.literal("")),
    coverCustomUrl: z.string().trim().url().optional().or(z.literal("")),
    coverUploadKey: z.string().trim().optional()
  })
  .superRefine((value, context) => {
    if (value.status === "loaned" && !value.loanedTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Odunc verilen kisi zorunlu.",
        path: ["loanedTo"]
      });
    }

    if (value.readMonth && !value.readYear) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ay secildiyse yil da girilmeli.",
        path: ["readYear"]
      });
    }

    if (value.isSeries && !value.seriesId && !value.seriesName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seri secin veya olusturun.",
        path: ["seriesName"]
      });
    }

    if (!value.isSeries && value.seriesOrder) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cilt numarasi icin once seri acilmali.",
        path: ["seriesOrder"]
      });
    }
  });

export type BookFormValues = z.input<typeof BOOK_FORM_SCHEMA>;

export function toOptionalInteger(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }
  return Number.parseInt(value, 10);
}

export function defaultValuesFromBook(book?: BookDetail | null): BookFormValues {
  return {
    isbn: book?.isbn ?? "",
    title: book?.title ?? "",
    authorIds: book?.authors.map((author) => author.id) ?? [],
    publisher: book?.publisher ?? "",
    publicationYear: book?.publicationYear?.toString() ?? "",
    pageCount: book?.pageCount?.toString() ?? "",
    categoryId: book?.category?.id ?? "",
    tagIds: book?.tags.map((tag) => tag.id) ?? [],
    isSeries: Boolean(book?.series),
    seriesId: book?.series?.id ?? "",
    seriesName: book?.series?.name ?? "",
    seriesTotalVolumes: book?.series?.totalVolumes?.toString() ?? "",
    seriesOrder: book?.series?.seriesOrder?.toString() ?? "",
    status: book?.status ?? "owned",
    locationName: book?.location?.locationName ?? "",
    shelfRow: book?.location?.shelfRow ?? "",
    shelfColumn: book?.location?.shelfColumn?.toString() ?? "",
    copyCount: book?.copyCount?.toString() ?? "1",
    donatable: book?.donatable ?? false,
    rating: book?.rating ?? null,
    readMonth: book?.readMonth?.toString() ?? "",
    readYear: book?.readYear?.toString() ?? "",
    personalNote: book?.personalNote ?? "",
    loanedTo: book?.loanedTo ?? "",
    coverMetadataUrl: book?.coverMetadataUrl ?? "",
    coverCustomUrl: book?.coverCustomUrl ?? "",
    coverUploadKey: ""
  };
}

export function buildBookPayload(values: BookFormValues): BookWriteInput {
  const isbn = values.isbn ?? "";
  const publisher = values.publisher ?? "";
  const locationName = values.locationName ?? "";
  const shelfRow = values.shelfRow ?? "";
  const shelfColumn = values.shelfColumn ?? "";
  const personalNote = values.personalNote ?? "";
  const loanedTo = values.loanedTo ?? "";
  const coverCustomUrl = values.coverCustomUrl ?? "";
  const coverMetadataUrl = values.coverMetadataUrl ?? "";
  const tagIds = values.tagIds ?? [];
  const seriesName = values.seriesName ?? "";
  const isSeriesEnabled = values.isSeries ?? false;
  const copyCount = values.copyCount ?? "1";

  return {
    title: values.title.trim(),
    authors: (values.authorIds ?? []).map((id) => ({ id })),
    isbn: isbn.trim() || null,
    publisher: publisher.trim() || null,
    publicationYear: toOptionalInteger(values.publicationYear),
    pageCount: toOptionalInteger(values.pageCount),
    status: values.status,
    location:
      locationName.trim() || shelfRow.trim() || shelfColumn.trim()
        ? {
            locationName: locationName.trim() || null,
            shelfRow: shelfRow.trim().toUpperCase() || null,
            shelfColumn: toOptionalInteger(shelfColumn)
          }
        : null,
    copyCount: Number.parseInt(copyCount, 10),
    donatable: values.donatable ?? false,
    rating: values.rating,
    personalNote: personalNote.trim() || null,
    readMonth: toOptionalInteger(values.readMonth),
    readYear: toOptionalInteger(values.readYear),
    loanedTo: loanedTo.trim() || null,
    coverCustomUrl: coverCustomUrl.trim() || null,
    coverMetadataUrl: coverMetadataUrl.trim() || null,
    category: values.categoryId ? { id: values.categoryId } : null,
    tags: tagIds.map((id) => ({ id })),
    series: isSeriesEnabled
      ? values.seriesId
        ? { id: values.seriesId }
        : seriesName.trim()
          ? {
              name: seriesName.trim(),
              totalVolumes: toOptionalInteger(values.seriesTotalVolumes)
            }
          : null
      : null,
    seriesOrder: isSeriesEnabled ? toOptionalInteger(values.seriesOrder) : null
  };
}

export function isDuplicateRelevantChange(
  mode: BookFormMode,
  values: BookFormValues,
  initialBook?: BookDetail | null
) {
  if (mode === "add" || !initialBook) {
    return true;
  }

  const nextIsbn = normalizeIsbn(values.isbn ?? "") ?? "";
  const initialIsbn = normalizeIsbn(initialBook.isbn ?? "") ?? "";
  const nextTitle = values.title.trim().toLocaleLowerCase("tr-TR");
  const initialTitle = initialBook.title.trim().toLocaleLowerCase("tr-TR");
  const nextAuthors = [...(values.authorIds ?? [])].sort().join("|");
  const initialAuthors = [...initialBook.authors.map((author) => author.id)].sort().join("|");

  return nextIsbn !== initialIsbn || nextTitle !== initialTitle || nextAuthors !== initialAuthors;
}

export function useBookForm(options: {
  mode: BookFormMode;
  initialBook?: BookDetail | null;
  onSuccess?: (book: BookDetail, action?: "created" | "increase_copy" | "updated") => void;
  onOpenChange?: (open: boolean) => void;
  onError?: (error: string) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [duplicateResult, setDuplicateResult] = React.useState<
    Extract<DuplicateCheckResponse, { isDuplicate: true }> | null
  >(null);
  
  const pendingSubmitRef = React.useRef<{
    payload: BookWriteInput;
    values: BookFormValues;
  } | null>(null);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(BOOK_FORM_SCHEMA),
    defaultValues: defaultValuesFromBook(options.initialBook)
  });

  const invalidateCollections = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["books"] });
    void queryClient.invalidateQueries({ queryKey: ["book-form"] });
  }, [queryClient]);

  const performSubmit = React.useCallback(
    async (payload: BookWriteInput, resolution?: DuplicateResolution) => {
      setIsSubmitting(true);
      if (options.onError) options.onError(""); 

      try {
        const isAddMode = options.mode === "add";
        const response = await fetch(isAddMode ? "/api/books" : `/api/books/${options.initialBook?.id}`, {
          method: isAddMode ? "POST" : "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(
            isAddMode
              ? {
                  ...payload,
                  duplicateResolution: resolution ?? "block"
                }
              : payload
          )
        });

        if (isAddMode) {
          const result = await readJsonResponse<CreateBookResponse>(response);
          invalidateCollections();
          options.onSuccess?.(result.book, result.action);
          options.onOpenChange?.(false);
          React.startTransition(() => {
            router.refresh();
          });
          return;
        }

        const book = await readJsonResponse<BookDetail>(response);
        invalidateCollections();
        options.onSuccess?.(book, "updated");
        options.onOpenChange?.(false);
        React.startTransition(() => {
          router.refresh();
        });
      } catch (error) {
        if (options.onError) {
           options.onError(error instanceof Error ? error.message : "Kayit tamamlanamadi.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [options, invalidateCollections, router]
  );

  const runDuplicateCheck = React.useCallback(
    async (valuesToSubmit: BookFormValues, payload: BookWriteInput) => {
      if (!isDuplicateRelevantChange(options.mode, valuesToSubmit, options.initialBook)) {
        await performSubmit(payload);
        return;
      }

      const response = await fetch("/api/books/check-duplicate", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          isbn: (valuesToSubmit.isbn ?? "").trim() || null,
          title: valuesToSubmit.title,
          authorIds: valuesToSubmit.authorIds ?? [],
          excludeBookId: options.mode === "edit" ? options.initialBook?.id : undefined
        })
      });
      const result = await readJsonResponse<DuplicateCheckResponse>(response);

      if (result.isDuplicate) {
        pendingSubmitRef.current = {
          payload,
          values: valuesToSubmit
        };
        setDuplicateResult(result);
        return;
      }

      await performSubmit(payload);
    },
    [options.mode, options.initialBook, performSubmit]
  );

  return {
    form,
    isSubmitting,
    duplicateResult,
    setDuplicateResult,
    pendingSubmitRef,
    performSubmit,
    runDuplicateCheck,
    invalidateCollections
  };
}
