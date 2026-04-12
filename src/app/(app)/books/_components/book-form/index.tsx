"use client";

import * as React from "react";
import { FormProvider } from "react-hook-form";
import { cn } from "@/components/ui";
import type {
  BookDetail,
  BookFormMode,
  IsbnCoverOption,
  IsbnMetadata,
  IsbnMetadataSource,
  SeriesOption
} from "@/types";

import { useBookForm, buildBookPayload, type BookFormValues } from "./use-book-form";
import { useIsbnMetadata } from "./use-isbn-metadata";
import { useCoverUpload } from "./use-cover-upload";
import { useBookFormData } from "./use-book-form-data";
import { useSmartSticky } from "./use-smart-sticky";
import { DuplicateDialog } from "./duplicate-dialog";
import { splitBookDisplayTitle } from "@/lib/book-title";

import { STATUS_META, toSafeCoverPreviewUrl } from "./book-form-constants";
import { BookFormProvider, type BookFormContextValue } from "./book-form-context.tsx";
import { BookFormSections } from "./book-form-sections";
import { BookFormSidebar } from "./book-form-sidebar";
import { BookFormActions } from "./book-form-actions";

type BookFormSidebarProps = React.ComponentProps<typeof BookFormSidebar>;
type BookFormActionsProps = React.ComponentProps<typeof BookFormActions>;
type BookFormSectionsProps = React.ComponentProps<typeof BookFormSections>;

function BookFormPageContent({
  sidebarProps,
  actionsProps
}: {
  sidebarProps: BookFormSidebarProps;
  actionsProps: BookFormActionsProps;
}) {
  return (
    <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_320px]">
      <BookFormSidebar {...sidebarProps} />
      <div className="min-w-0 space-y-8">
        <BookFormSections />
        <BookFormActions {...actionsProps} />
      </div>
    </div>
  );
}

function BookFormModalContent({
  actionsProps
}: {
  actionsProps: BookFormActionsProps;
}) {
  return (
    <>
      <BookFormSections />
      <BookFormActions {...actionsProps} />
    </>
  );
}

type BookFormProps = {
  mode: BookFormMode;
  initialBook?: BookDetail | null;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (book: BookDetail, action?: "created" | "increase_copy" | "updated") => void;
  onCancel?: () => void;
  layout?: "modal" | "page";
};

function useBookFormLogic({
  mode,
  initialBook,
  onOpenChange,
  onSuccess,
  onCancel,
  layout
}: BookFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    form,
    isSubmitting,
    duplicateResult,
    setDuplicateResult,
    pendingSubmitRef,
    performSubmit,
    runDuplicateCheck,
    invalidateCollections
  } = useBookForm({
    mode,
    initialBook,
    onSuccess,
    onOpenChange,
    onCancel,
    onError: setSubmitError
  });

  const { setValue, watch, handleSubmit } = form;
  const values = watch() as BookFormValues;

  const {
    authorQuery,
    setAuthorQuery,
    seriesQuery,
    setSeriesQuery,
    categoriesQuery,
    seriesQueryResult,
    authorsQuery,
    availableAuthors,
    selectedAuthors,
    draftAuthorNames,
    publishersQuery,
    resolvePublisherIdFromName,
    createPublisher,
    publisherQuery,
    setPublisherQuery,
    canCreatePublisher,
    selectedSeries,
    pendingAuthorSuggestions,
    addAuthorById,
    removeDraftAuthorName,
    updateDraftAuthorName,
    createAuthor,
    createSeries,
    createCategory,
    categoryQuery,
    setCategoryQuery,
    canCreateCategory,
    resolveSuggestedAuthor,
    resolveAuthorIdsFromNames,
    canCreateAuthor,
    canCreateSeries
  } = useBookFormData({
    initialBook,
    values,
    setValue,
    invalidateCollections
  });

  const applyMetadataToForm = React.useCallback(
    (
      metadata: IsbnMetadata,
      _source: IsbnMetadataSource,
      coverOptions: IsbnCoverOption[]
    ) => {
      void (async () => {
        setValue("title", metadata.title ?? "", { shouldDirty: true });
        setValue("subtitle", metadata.subtitle ?? "", { shouldDirty: true });

        if (metadata.publisher) {
          const resolvedId = await resolvePublisherIdFromName(metadata.publisher);
          if (resolvedId) {
            setValue("publisher", { id: resolvedId }, { shouldDirty: true });
          } else {
            setValue("publisher", { name: metadata.publisher }, { shouldDirty: true });
            setPublisherQuery(metadata.publisher);
          }
        } else {
          setValue("publisher", null, { shouldDirty: true });
        }

        setValue("publicationYear", metadata.publicationYear?.toString() ?? "", {
          shouldDirty: true
        });
        setValue("pageCount", metadata.pageCount?.toString() ?? "", { shouldDirty: true });

        if (!(values.coverCustomUrl ?? "")) {
          const preferredCoverUrl =
            coverOptions[0]?.url ?? metadata.coverMetadataUrl ?? "";
          setValue("coverMetadataUrl", preferredCoverUrl, { shouldDirty: true });
        }

        if (metadata.authors.length > 0) {
          const { resolvedIds, unresolvedNames } = await resolveAuthorIdsFromNames(metadata.authors);

          if (resolvedIds.length > 0) {
            const mergedAuthorIds = Array.from(
              new Set([...(values.authorIds ?? []), ...resolvedIds])
            );

            setValue("authorIds", mergedAuthorIds, {
              shouldDirty: true,
              shouldValidate: true
            });
          }

          if (unresolvedNames.length > 0 && !authorQuery.trim()) {
            setAuthorQuery(unresolvedNames[0]);
          }
        }
      })();
    },
    [
      authorQuery,
      resolveAuthorIdsFromNames,
      resolvePublisherIdFromName,
      setAuthorQuery,
      setPublisherQuery,
      setValue,
      values.authorIds,
      values.coverCustomUrl
    ]
  );

  const { metadataState, fetchMetadata } = useIsbnMetadata({
    onMetadataFound: applyMetadataToForm
  });

  const { isUploadingCover, uploadCover, revertCoverToDefault } = useCoverUpload({
    mode,
    initialBook,
    currentCoverCustomUrl: values.coverCustomUrl,
    currentCoverUploadKey: values.coverUploadKey,
    onCoverUploaded: (url, key) => {
      setValue("coverCustomUrl", url, { shouldDirty: true });
      setValue("coverUploadKey", key, { shouldDirty: true });
    },
    onCoverReverted: () => {
      setValue("coverCustomUrl", "", { shouldDirty: true });
      setValue("coverUploadKey", "", { shouldDirty: true });
    },
    onError: setSubmitError
  });

  const coverPreviewUrl = toSafeCoverPreviewUrl(values.coverCustomUrl || values.coverMetadataUrl || null);
  const summaryStatus = STATUS_META[values.status];
  const summaryAuthors = [
    ...selectedAuthors.map((author) => author.name),
    ...draftAuthorNames
  ];
  const summaryTitle = splitBookDisplayTitle(values.title?.trim() || null, values.subtitle?.trim() || null);
  const summaryLocation = [values.locationName, values.shelfRow]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" / ");
  const summarySeries = values.isSeries
    ? selectedSeries?.name || values.seriesName?.trim() || "Seri seçimi bekleniyor"
    : null;
  const hasSummaryContent = Boolean(
    values.title?.trim() ||
      summaryAuthors.length ||
      values.publisher ||
      values.publicationYear?.trim() ||
      values.personalNote?.trim() ||
      coverPreviewUrl
  );

  const { stickyStyle } = useSmartSticky(48, 48);
  const categoryLabel = values.categoryId
    ? categoriesQuery.data?.find((category) => category.id === values.categoryId)?.name ?? "Kategori seçildi"
    : "";

  const onSubmit = handleSubmit(async (submittedValues) => {
    const payload = buildBookPayload(submittedValues);
    await runDuplicateCheck(submittedValues, payload);
  });
  const canCreateSeriesExt = values.isSeries && canCreateSeries;

  // Create context value for form state
  const contextValue: BookFormContextValue = {
    mode,
    values,
    isSubmitting,

    // Author management
    addAuthorById,
    authorQuery,
    availableAuthors,
    canCreateAuthor,
    createAuthor,
    draftAuthorNames,
    pendingAuthorSuggestions,
    removeDraftAuthorName,
    resolveSuggestedAuthor,
    selectedAuthors,
    setAuthorQuery,
    updateDraftAuthorName,

    // Publisher management
    canCreatePublisher,
    createPublisher,
    publisherQuery,
    publishers: publishersQuery.data ?? [],
    setPublisherQuery,

    // Category management
    canCreateCategory,
    categories: categoriesQuery.data ?? [],
    categoryQuery,
    createCategory,
    setCategoryQuery,

    // Series management
    canCreateSeries: Boolean(canCreateSeriesExt),
    createSeries,
    series: seriesQueryResult.data?.items ?? [],
    selectedSeries: (selectedSeries as SeriesOption | null) ?? null,
    seriesQuery,
    setSeriesQuery,

    // ISBN metadata
    fetchMetadata,
    metadataState,

    // Cover management
    coverPreviewUrl,
    fileInputRef,
    hasCustomCover: Boolean(values.coverCustomUrl),
    isUploadingCover,
    metadataCoverOptions: metadataState.coverOptions,
    selectedMetadataCoverUrl: values.coverMetadataUrl || null,
    onSelectMetadataCover: (url: string) => {
      setValue("coverMetadataUrl", url, { shouldDirty: true });
    },
    onRevertClick: () => void revertCoverToDefault(),
    onUploadClick: () => fileInputRef.current?.click(),
    uploadCover
  };

  const sectionsProps: BookFormSectionsProps = {};

  const sidebarProps: BookFormSidebarProps = {
    categoryLabel,
    coverPreviewUrl,
    hasSummaryContent,
    mode,
    stickyStyle,
    summaryAuthors,
    summaryLocation,
    summarySeries,
    summaryStatus,
    summaryTitle,
    values,
    publishers: publishersQuery.data ?? []
  };

  const actionsProps: BookFormActionsProps = {
    isSubmitting,
    layout,
    mode,
    onCancel,
    onOpenChange,
    submitError
  };

  return {
    actionsProps,
    contextValue,
    duplicateResult,
    form,
    isSubmitting,
    onSubmit,
    pendingSubmitRef,
    performSubmit,
    setDuplicateResult,
    sidebarProps
  };
}



export function BookForm({
  mode,
  initialBook,
  onOpenChange,
  onSuccess,
  onCancel,
  layout = "modal"
}: BookFormProps) {
  const {
    actionsProps,
    contextValue,
    duplicateResult,
    form,
    isSubmitting,
    onSubmit,
    pendingSubmitRef,
    performSubmit,
    setDuplicateResult,
    sidebarProps
  } = useBookFormLogic({

    mode,

    initialBook,
    onOpenChange,
    onSuccess,
    onCancel,
    layout
  });

  return (
    <FormProvider {...form}>
      <BookFormProvider value={contextValue}>
        <form className={cn("pb-12", layout === "page" ? "space-y-6 md:space-y-8" : "space-y-8 pb-16 md:space-y-12")} onSubmit={onSubmit}>
          {layout === "page" ? (
            <BookFormPageContent
              actionsProps={actionsProps}
              sidebarProps={sidebarProps}
            />
          ) : (
            <BookFormModalContent
              actionsProps={actionsProps}
            />
          )}
        </form>

        <DuplicateDialog
          duplicateResult={duplicateResult}
          isSubmitting={isSubmitting}
          onConfirm={(resolution) => {
            if (pendingSubmitRef.current) {
              void performSubmit(pendingSubmitRef.current.payload, resolution);
            }
          }}
          setDuplicateResult={setDuplicateResult}
        />
      </BookFormProvider>
    </FormProvider>
  );
}
