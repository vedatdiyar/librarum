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
    title: z.string().trim().min(1, "Başlık zorunlu."),
    subtitle: z.string().trim().optional(),
    authorIds: z.array(z.string().uuid()).default([]),
    authorNames: z.array(z.string().trim().min(1)).default([]),
    publisher: z
      .union([
        z.object({ id: z.string().uuid() }),
        z.object({ name: z.string().trim().min(1) })
      ])
      .nullable()
      .optional(),
    publicationYear: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d{1,4}$/.test(value), "Yayın yılı sayı olmalı."),
    pageCount: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), "Sayfa sayısı sayı olmalı."),
    categoryId: z.string().trim().optional(),
    isSeries: z.boolean().default(false),
    seriesId: z.string().trim().optional(),
    seriesName: z.string().trim().optional(),
    seriesTotalVolumes: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), "Toplam cilt sayısı sayı olmalı."),
    seriesOrder: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), "Cilt numarası sayı olmalı."),
    status: z.enum(["owned", "completed", "abandoned", "loaned", "lost"]),
    locationName: z.string().trim().optional(),
    shelfRow: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^[A-Za-z]$/.test(value), "Raf tek harf olmalı."),
    copyCount: z
      .string()
      .trim()
      .default("1")
      .refine((value) => /^\d+$/.test(value) && Number(value) >= 1, "Kopya sayısı en az 1 olmalı."),
    donatable: z.boolean().default(false),
    rating: z.number().min(0.5).max(5).nullable(),
    readMonth: z.string().trim().optional(),
    readYear: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d{4}$/.test(value), "Yıl 4 haneli olmalı."),
    personalNote: z.string().trim().optional(),
    loanedTo: z.string().trim().optional(),
    coverMetadataUrl: z.string().trim().url().optional().or(z.literal("")),
    coverCustomUrl: z.string().trim().url().optional().or(z.literal("")),
    coverUploadKey: z.string().trim().optional()
  })
  .superRefine((value, context) => {
    if ((value.authorIds?.length ?? 0) + (value.authorNames?.length ?? 0) < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "En az bir yazar seçilmeli.",
        path: ["authorIds"]
      });
    }

    if (value.status === "loaned" && !value.loanedTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ödünç verilen kişi zorunlu.",
        path: ["loanedTo"]
      });
    }

    if (value.readMonth && !value.readYear) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ay seçildiyse yıl da girilmeli.",
        path: ["readYear"]
      });
    }

    if (value.isSeries && !value.seriesId && !value.seriesName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seri seçin veya oluşturun.",
        path: ["seriesName"]
      });
    }

    if (!value.isSeries && value.seriesOrder) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cilt numarası için önce seri açılmalı.",
        path: ["seriesOrder"]
      });
    }
  });

export type BookFormValues = z.input<typeof BOOK_FORM_SCHEMA>;

export function toOptionalInteger(value: string | undefined) {
  if (!value?.trim() || value === "0") {
    return null;
  }
  return Number.parseInt(value, 10);
}

export function defaultValuesFromBook(book?: BookDetail | null): BookFormValues {
  const isLoaned = book?.status === "loaned";
  
  return {
    isbn: book?.isbn ?? "",
    title: book?.title ?? "",
    subtitle: book?.subtitle ?? "",
    authorIds: book?.authors.map((author) => author.id) ?? [],
    authorNames: [],
    publisher: book?.publisher ? { id: book.publisher.id } : null,
    publicationYear: book?.publicationYear?.toString() ?? "",
    pageCount: book?.pageCount?.toString() ?? "",
    categoryId: book?.category?.id ?? "",
    isSeries: Boolean(book?.series),
    seriesId: book?.series?.id ?? "",
    seriesName: book?.series?.name ?? "",
    seriesTotalVolumes: book?.series?.totalVolumes?.toString() ?? "",
    seriesOrder: book?.series?.seriesOrder?.toString() ?? "",
    status: book?.status ?? "owned",
    locationName: isLoaned ? "" : (book?.location?.locationName ?? ""),
    shelfRow: isLoaned ? "" : (book?.location?.shelfRow ?? ""),
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
  const subtitle = values.subtitle ?? "";
  const publisher = values.publisher;
  const locationName = values.locationName ?? "";
  const shelfRow = values.shelfRow ?? "";
  const personalNote = values.personalNote ?? "";
  const loanedTo = values.loanedTo ?? "";
  const coverCustomUrl = values.coverCustomUrl ?? "";
  const coverMetadataUrl = values.coverMetadataUrl ?? "";
  const seriesName = values.seriesName ?? "";
  const isSeriesEnabled = values.isSeries ?? false;
  const copyCount = values.copyCount ?? "1";

  return {
    title: values.title.trim(),
    subtitle: subtitle.trim() || null,
    authors: [
      ...(values.authorIds ?? []).map((id) => ({ id })),
      ...(values.authorNames ?? []).map((name) => ({ name }))
    ],
    isbn: isbn.trim() || null,
    publisher: publisher || null,
    publicationYear: toOptionalInteger(values.publicationYear),
    pageCount: toOptionalInteger(values.pageCount),
    status: values.status,
    location:
      values.status === "loaned"
        ? null
        : locationName.trim() || shelfRow.trim()
          ? {
              locationName: locationName.trim() || null,
              shelfRow: shelfRow.trim().toUpperCase() || null
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
  const nextSubtitle = (values.subtitle ?? "").trim().toLocaleLowerCase("tr-TR");
  const initialSubtitle = (initialBook.subtitle ?? "").trim().toLocaleLowerCase("tr-TR");
  const nextAuthors = [...(values.authorIds ?? [])].sort().join("|");
  const initialAuthors = [...initialBook.authors.map((author) => author.id)].sort().join("|");

  return (
    nextIsbn !== initialIsbn ||
    nextTitle !== initialTitle ||
    nextSubtitle !== initialSubtitle ||
    nextAuthors !== initialAuthors
  );
}

export function useBookForm(options: {
  mode: BookFormMode;
  initialBook?: BookDetail | null;
  onSuccess?: (book: BookDetail, action?: "created" | "increase_copy" | "updated") => void;
  onOpenChange?: (open: boolean) => void;
  onCancel?: () => void;
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
          options.onCancel ? options.onCancel() : options.onOpenChange?.(false);
          React.startTransition(() => {
            router.refresh();
          });
          return;
        }

        const book = await readJsonResponse<BookDetail>(response);
        invalidateCollections();
        options.onSuccess?.(book, "updated");
        options.onCancel ? options.onCancel() : options.onOpenChange?.(false);
        React.startTransition(() => {
          router.refresh();
        });
      } catch (error) {
        if (options.onError) {
           options.onError(error instanceof Error ? error.message : "Kayıt tamamlanamadı.");
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
          subtitle: (valuesToSubmit.subtitle ?? "").trim() || null,
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
