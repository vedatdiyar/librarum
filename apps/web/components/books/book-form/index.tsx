"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";
import {
  AlertTriangle,
  LoaderCircle,
  RefreshCcw
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn
} from "@librarum/ui";
import type {
  AuthorOption,
  BookDetail,
  BookFormMode,
  CategoryOption,
  SeriesOption,
  TagOption
} from "@librarum/types";
import { readJsonResponse } from "@librarum/lib";

import { useBookForm, buildBookPayload, type BookFormValues } from "./use-book-form";
import { useIsbnMetadata } from "./use-isbn-metadata";
import { useCoverUpload } from "./use-cover-upload";
import { useBookFormData } from "./use-book-form-data";
import { DuplicateDialog } from "./duplicate-dialog";

import { KunyeSection } from "./form-sections/kunye-section";
import { SiniflandirmaSection } from "./form-sections/siniflandirma-section";
import { DurumKonumSection } from "./form-sections/durum-konum-section";
import { KisiselSection, CoverSection } from "./form-sections/kisisel-and-cover-sections";

const SECTION_CLASS_NAME = "rounded-[26px] border border-border/80 bg-surface-raised/70";

function Section({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={SECTION_CLASS_NAME}>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

type BookFormProps = {
  mode: BookFormMode;
  initialBook?: BookDetail | null;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (book: BookDetail, action?: "created" | "increase_copy" | "updated") => void;
};

export function BookForm({ mode, initialBook, onOpenChange, onSuccess }: BookFormProps) {
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
    onError: setSubmitError
  });

  const { setValue, watch, handleSubmit } = form;
  const values = watch() as BookFormValues;

  const {
    authorQuery,
    setAuthorQuery,
    tagQuery,
    setTagQuery,
    seriesQuery,
    setSeriesQuery,
    categoriesQuery,
    tagsQuery,
    seriesQueryResult,
    authorsQuery,
    selectedAuthors,
    selectedTags,
    selectedSeries,
    filteredTags,
    filteredSeries,
    createAuthor,
    createSeries,
    canCreateAuthor,
    canCreateSeries
  } = useBookFormData({
    initialBook,
    values,
    setValue,
    invalidateCollections
  });

  const { metadataState, fetchMetadata } = useIsbnMetadata({
    onMetadataFound: (metadata) => {
      setValue("title", metadata.title ?? "", { shouldDirty: true });
      setValue("publisher", metadata.publisher ?? "", { shouldDirty: true });
      setValue("publicationYear", metadata.publicationYear?.toString() ?? "", {
        shouldDirty: true
      });
      setValue("pageCount", metadata.pageCount?.toString() ?? "", { shouldDirty: true });

      if (!(values.coverCustomUrl ?? "")) {
        setValue("coverMetadataUrl", metadata.coverMetadataUrl ?? "", { shouldDirty: true });
      }
    }
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

  const coverPreviewUrl = values.coverCustomUrl || values.coverMetadataUrl || null;

  const onSubmit = handleSubmit(async (submittedValues) => {
    const payload = buildBookPayload(submittedValues);
    await runDuplicateCheck(submittedValues, payload);
  });

  const canCreateSeriesExt = values.isSeries && canCreateSeries;

  return (
    <FormProvider {...form}>
      <form className="space-y-6" onSubmit={onSubmit}>
        <Section
          description="ISBN, baslik ve temel bibliyografik veriler burada toplanir."
          title="Bolum 1 — Künye"
        >
          <KunyeSection
            authorQuery={authorQuery}
            authors={selectedAuthors}
            canCreateAuthor={canCreateAuthor}
            createAuthor={createAuthor}
            fetchMetadata={fetchMetadata}
            isSubmitting={isSubmitting}
            metadataState={metadataState}
            setAuthorQuery={setAuthorQuery}
          />
        </Section>

        <Section
          description="Kategoriler, etiketler ve seri bilgisi ile kitabın yerini netleştirin."
          title="Bolum 2 — Siniflandirma"
        >
          <SiniflandirmaSection
            canCreateSeries={Boolean(canCreateSeriesExt)}
            categories={categoriesQuery.data ?? []}
            createSeries={createSeries}
            filteredSeries={filteredSeries}
            filteredTags={filteredTags}
            isSubmitting={isSubmitting}
            selectedSeries={selectedSeries}
            selectedTags={selectedTags}
            series={seriesQueryResult.data ?? []}
            seriesQuery={seriesQuery}
            setSeriesQuery={setSeriesQuery}
            setTagQuery={setTagQuery}
            tagQuery={tagQuery}
            tags={tagsQuery.data ?? []}
          />
        </Section>

        <Section
          description="Kitabın mevcut durumu, fiziksel konumu ve kopya bilgisi."
          title="Bolum 3 — Durum & Konum"
        >
          <DurumKonumSection />
        </Section>

        <Section
          description="Okuma deneyimi ve kişisel notlarınız burada kalır."
          title="Bolum 4 — Kisisel"
        >
          <KisiselSection />
        </Section>

        <Section
          description="Metadata kapağını kullanabilir veya kendi kapağınızı yükleyebilirsiniz."
          title="Bolum 5 — Kapak"
        >
          <CoverSection
            coverPreviewUrl={coverPreviewUrl}
            hasCustomCover={Boolean(values.coverCustomUrl)}
            isSubmitting={isSubmitting}
            isUploadingCover={isUploadingCover}
            onRevertClick={() => void revertCoverToDefault()}
            onUploadClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            aria-label="Kapak resmi yükle"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadCover(file);
            }}
            type="file"
          />
        </Section>

        <div className="sticky bottom-6 z-10 flex justify-end gap-3 rounded-[28px] border border-border/60 bg-surface/80 p-4 shadow-2xl backdrop-blur-xl">
          <Button
            disabled={isSubmitting}
            onClick={() => onOpenChange?.(false)}
            size="lg"
            variant="secondary"
          >
            Vazgec
          </Button>
          <Button disabled={isSubmitting} size="lg" type="submit">
            {isSubmitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : mode === "add" ? (
              "Kitabi Ekle"
            ) : (
              "Degisiklikleri Kaydet"
            )}
          </Button>
        </div>

        {submitError ? (
          <div className="flex items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{submitError}</p>
          </div>
        ) : null}
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
