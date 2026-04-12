"use client";

import * as React from "react";
import { FormProvider } from "react-hook-form";
import { cn } from "@/components/ui";
import type {
  BookDetail,
  BookFormMode,
  IsbnCoverOption,
  IsbnMetadata,
  IsbnMetadataSource
} from "@/types";

import { useBookForm, buildBookPayload, type BookFormValues } from "./use-book-form";
import { useIsbnMetadata } from "./use-isbn-metadata";
import { useCoverUpload } from "./use-cover-upload";
import { useBookFormData } from "./use-book-form-data";
import { useSmartSticky } from "./use-smart-sticky";
import { DuplicateDialog } from "./duplicate-dialog";
import { splitBookDisplayTitle } from "@/lib/book-title";

import { STATUS_META, toSafeCoverPreviewUrl } from "./book-form-constants";
import { BookFormSections } from "./book-form-sections";
import { BookFormSidebar } from "./book-form-sidebar";
import { BookFormActions } from "./book-form-actions";

type BookFormSectionsProps = React.ComponentProps<typeof BookFormSections>;
type BookFormSidebarProps = React.ComponentProps<typeof BookFormSidebar>;
type BookFormActionsProps = React.ComponentProps<typeof BookFormActions>;

function BookFormPageContent({
  sectionsProps,
  sidebarProps,
  actionsProps
}: {
  sectionsProps: BookFormSectionsProps;
  sidebarProps: BookFormSidebarProps;
  actionsProps: BookFormActionsProps;
}) {
  return (
    <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_320px]">
      <BookFormSidebar {...sidebarProps} />
      <div className="min-w-0 space-y-8">
        <BookFormSections {...sectionsProps} />
        <BookFormActions {...actionsProps} />
      </div>
    </div>
  );
}

function BookFormModalContent({
  sectionsProps,
  actionsProps
}: {
  sectionsProps: BookFormSectionsProps;
  actionsProps: BookFormActionsProps;
}) {
  return (
    <>
      <BookFormSections {...sectionsProps} />
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
  const sectionsProps: BookFormSectionsProps = {
    addAuthorById,
    availableAuthors,
    authorQuery,
    canCreateAuthor,
    canCreateCategory,
    canCreateSeries: canCreateSeriesExt,
    categoryQuery,
    categories: categoriesQuery.data ?? [],
    createAuthor,
    createCategory,
    createSeries,
    createPublisher,
    draftAuthorNames,
    fileInputRef,
    fetchMetadata,
    hasCustomCover: Boolean(values.coverCustomUrl),
    isSubmitting,
    isUploadingCover,
    metadataState,
    mode,
    onRevertClick: () => void revertCoverToDefault(),
    onSelectMetadataCover: (url: string) => {
      setValue("coverMetadataUrl", url, { shouldDirty: true });
    },
    onUploadClick: () => fileInputRef.current?.click(),
    pendingAuthorSuggestions,
    removeDraftAuthorName,
    updateDraftAuthorName,
    resolveSuggestedAuthor,
    selectedAuthors,
    selectedMetadataCoverUrl: values.coverMetadataUrl || null,
    selectedSeries,
    series: seriesQueryResult.data ?? [],
    seriesQuery,
    setAuthorQuery,
    setCategoryQuery,
    setSeriesQuery,
    setPublisherQuery,
    publishers: publishersQuery.data ?? [],
    publisherQuery,
    canCreatePublisher,
    coverPreviewUrl,
    uploadCover,
    values
  };

  const sidebarProps: BookFormSidebarProps = {
    categoryLabel,
    coverPreviewUrl,
    hasSummaryContent,
    mode,
    selectedSeries,
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
    duplicateResult,
    form,
    isSubmitting,
    onSubmit,
    pendingSubmitRef,
    performSubmit,
    sectionsProps,
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
    duplicateResult,
    form,
    isSubmitting,
    onSubmit,
    pendingSubmitRef,
    performSubmit,
    sectionsProps,
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
      <form className={cn("pb-12", layout === "page" ? "space-y-6 md:space-y-8" : "space-y-8 pb-16 md:space-y-12")} onSubmit={onSubmit}>
        {layout === "page" ? (
          <BookFormPageContent
            actionsProps={actionsProps}
            sectionsProps={sectionsProps}
            sidebarProps={sidebarProps}
          />
        ) : (
          <BookFormModalContent
            actionsProps={actionsProps}
            sectionsProps={sectionsProps}
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
    </FormProvider>
  );
}
