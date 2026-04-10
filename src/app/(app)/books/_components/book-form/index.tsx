"use client";

import * as React from "react";
import Image from "next/image";
import { FormProvider } from "react-hook-form";
import {
  AlertTriangle,
  LoaderCircle,
  Cpu,
  Layers,
  MapPin,
  User,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ScrollText,
  BookOpen,
  Library,
  Quote
} from "lucide-react";
import {
  Button,
  cn
} from "@/components/ui";
import type {
  BookDetail,
  BookFormMode,
  BookStatus
} from "@/types";

import { useBookForm, buildBookPayload, type BookFormValues } from "./use-book-form";
import { useIsbnMetadata } from "./use-isbn-metadata";
import { useCoverUpload } from "./use-cover-upload";
import { useBookFormData } from "./use-book-form-data";
import { useSmartSticky } from "./use-smart-sticky";
import { DuplicateDialog } from "./duplicate-dialog";

import { PublicationSection } from "./form-sections/publication-info-section";
import { StatusLocationSection } from "./form-sections/status-location-section";
import { PersonalSection, CoverSection } from "./form-sections/personal-and-cover-sections";
import { ClassificationSection } from "./form-sections/classification-section";
import { splitBookDisplayTitle } from "@/lib/shared/book-title";

const STATUS_META: Record<
  BookStatus,
  {
    label: string;
    className: string;
  }
> = {
  owned: {
    label: "Kütüphanede",
    className: "border-primary/20 bg-primary/8 text-primary"
  },
  completed: {
    label: "Tamamlandı",
    className: "border-emerald-400/20 bg-emerald-400/8 text-emerald-300"
  },
  abandoned: {
    label: "Yarım Kaldı",
    className: "border-amber-400/20 bg-amber-400/8 text-amber-300"
  },
  loaned: {
    label: "Ödünç Verildi",
    className: "border-violet-400/20 bg-violet-400/8 text-violet-300"
  },
  lost: {
    label: "Kayıp",
    className: "border-rose-400/20 bg-rose-400/8 text-rose-300"
  }
};

function Section({
  title,
  description,
  icon: Icon,
  children,
  index
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <div 
        className="group glass-panel relative flex flex-col overflow-hidden rounded-[40px] border-white/5 bg-white/1 p-8 transition-all duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-6 hover:border-white/10"
        style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 opacity-0 blur-[120px] transition-opacity duration-1000 group-hover:opacity-100" />
      
      <div className="relative space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-serif text-3xl font-bold tracking-tight text-white">{title}</h3>
            <p className="max-w-sm text-[13px] leading-relaxed text-foreground italic">{description}</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/3 p-3.5 text-foreground transition-all duration-700 group-hover:bg-primary/10 group-hover:text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="pt-0">{children}</div>
      </div>
    </div>
  );
}

function BookFormSections(props: any) {
  const {
    addAuthorById,
    availableAuthors,
    authorQuery,
    canCreateAuthor,
    canCreateCategory,
    canCreateSeries,
    categoryQuery,
    categories,
    createAuthor,
    createCategory,
    createSeries,
    draftAuthorNames,
    fileInputRef,
    isSubmitting,
    isUploadingCover,
    metadataState,
    mode,
    pendingAuthorSuggestions,
    removeDraftAuthorName,
    resolveSuggestedAuthor,
    selectedAuthors,
    selectedMetadataCoverUrl,
    selectedSeries,
    series,
    seriesQuery,
    setAuthorQuery,
    setCategoryQuery,
    setSeriesQuery,
    coverPreviewUrl,
    hasCustomCover,
    onRevertClick,
    onSelectMetadataCover,
    onUploadClick,
    uploadCover,
    values
  } = props;

  return (
    <>
      <Section
        index={0}
        icon={Cpu}
        description="Kitap adı, yazar ve temel yayın bilgileri."
        title="1. Bölüm — Kitap Bilgileri"
      >
        <PublicationSection
          addAuthorById={addAuthorById}
          removeDraftAuthorName={removeDraftAuthorName}
          availableAuthors={availableAuthors}
          authorQuery={authorQuery}
          authors={selectedAuthors}
          draftAuthorNames={draftAuthorNames}
          canCreateAuthor={canCreateAuthor}
          createAuthor={createAuthor}
          fetchMetadata={props.fetchMetadata}
          isSubmitting={isSubmitting}
          metadataState={metadataState}
          pendingAuthorSuggestions={pendingAuthorSuggestions}
          resolveSuggestedAuthor={resolveSuggestedAuthor}
          setAuthorQuery={setAuthorQuery}
        />
      </Section>

      <Section
        index={1}
        icon={Layers}
        description="Kategori ve seri alanlariyla kitabin siniflandirmasini tamamlayin."
        title="2. Bölüm — Sınıflandırma"
      >
        <ClassificationSection
          canCreateCategory={canCreateCategory}
          canCreateSeries={Boolean(canCreateSeries)}
          categories={categories}
          categoryQuery={categoryQuery}
          createCategory={createCategory}
          createSeries={createSeries}
          isSubmitting={isSubmitting}
          selectedSeries={selectedSeries}
          series={series}
          seriesQuery={seriesQuery}
          setCategoryQuery={setCategoryQuery}
          setSeriesQuery={setSeriesQuery}
        />
      </Section>

      <Section
        index={2}
        icon={MapPin}
        description="Kitap durumu, kütüphanedeki konumu ve kopya sayısı."
        title="3. Bölüm — Durum ve Konum"
      >
        <StatusLocationSection />
      </Section>

      <Section
        index={3}
        icon={User}
        description="Kişisel değerlendirme, hâkimiyet seviyesi ve özel notlar."
        title="4. Bölüm — Değerlendirme"
      >
        <PersonalSection />
      </Section>

      <Section
        index={4}
        icon={ImageIcon}
        description="Kitap kapağı. Hazır görselleri kullanın veya kendi kapağınızı yükleyin."
        title="5. Bölüm — Kapak Görseli"
      >
        <CoverSection
          coverPreviewUrl={coverPreviewUrl}
          hasCustomCover={hasCustomCover}
          isSubmitting={isSubmitting}
          isUploadingCover={isUploadingCover}
          metadataCoverOptions={metadataState.coverOptions}
          selectedMetadataCoverUrl={selectedMetadataCoverUrl}
          onSelectMetadataCover={onSelectMetadataCover}
          onRevertClick={onRevertClick}
          onUploadClick={onUploadClick}
        />
        <input
          ref={fileInputRef}
          aria-label="Özel kapak yükle"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadCover(file);
          }}
          type="file"
        />
      </Section>
    </>
  );
}

function BookFormSidebar(props: any) {
  const {
    categoryLabel,
    coverPreviewUrl,
    hasSummaryContent,
    mode,
    summaryAuthors,
    summaryLocation,
    summarySeries,
    summaryStatus,
    summaryTitle,
    values
  } = props;

  return (
    <aside className="order-first xl:order-last xl:self-start" style={props.stickyStyle}>
      <div className="space-y-6">
        <div className="glass-panel overflow-hidden rounded-[32px] border-white/8 bg-white/3 transition-transform duration-500 hover:scale-[1.01]">
          <div className="relative aspect-2/3 overflow-hidden border-b border-white/8 bg-linear-to-b from-white/5 to-transparent">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,160,89,0.16),transparent_58%)]" />
            {coverPreviewUrl ? (
              <>
                <Image alt="" className="shrink-0 object-cover opacity-40 blur-2xl" fill src={coverPreviewUrl} />
                <Image
                  alt={summaryTitle.title || "Başlık henüz girilmedi"}
                  className="relative rounded-xl object-contain transition-transform duration-1000 hover:scale-105"
                  fill
                  quality={90}
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 70vw, 420px"
                  src={coverPreviewUrl}
                />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-10 text-center">
                <div className="mb-5 rounded-2xl border border-white/10 bg-white/4 p-4">
                  <BookOpen className="h-8 w-8 text-primary/70" />
                </div>
                <div className="space-y-2">
                  <p className="font-serif text-3xl leading-tight font-bold tracking-tight wrap-break-word text-white">
                    {summaryTitle.title || "Başlık henüz girilmedi"}
                  </p>
                  {summaryTitle.subtitle ? (
                    <p className="font-serif text-xl leading-tight font-bold tracking-tight wrap-break-word text-white/75">
                      {summaryTitle.subtitle}
                    </p>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                  Kapak görseli eklenene kadar anlık özet burada şekillenmeye devam eder.
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="truncate text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase">
                  {mode === "add" ? "Yeni kayıt taslağı" : "Güncellenen kayıt"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                  <span className="text-[10px] font-bold tracking-[0.24em] text-primary uppercase">Anlık özet</span>
                </div>
                <div className={cn("rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase", summaryStatus.className)}>
                  {summaryStatus.label}
                </div>
              </div>

              <div>
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl leading-tight font-bold tracking-tight wrap-break-word text-white">
                    {summaryTitle.title || "Başlık henüz girilmedi"}
                  </h3>
                  {summaryTitle.subtitle ? (
                    <p className="text-sm font-semibold tracking-wide wrap-break-word text-primary/80 uppercase">
                      {summaryTitle.subtitle}
                    </p>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                  {summaryAuthors.length > 0
                    ? summaryAuthors.join(", ")
                    : "Yazar atandığında kitap bilgileri burada tamamlanacak."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                {
                  label: "Bibliyografya",
                  value:
                    values.publisher?.trim() || values.publicationYear?.trim()
                      ? [values.publisher?.trim(), values.publicationYear?.trim()].filter(Boolean).join(" • ")
                      : "Yayınevi ve yayın yılı bekleniyor"
                },
                {
                  label: "Konum",
                  value:
                    summaryLocation ||
                    (values.status === "loaned" ? values.loanedTo?.trim() || "Dış dolaşım bilgisi bekleniyor" : "Konum bilgisi eklenmedi")
                },
                {
                  label: "Sınıflandırma",
                  value: categoryLabel || "Kategori seçimi bekleniyor"
                },
                {
                  label: "Seri / Kopya",
                  value: summarySeries ? `${summarySeries} • ${values.copyCount || "1"} kopya` : `${values.copyCount || "1"} kopya arşivleniyor`
                }
              ].map((item) => (
                <div key={item.label} className="group/item rounded-2xl border border-white/8 bg-white/3 px-4 py-3 transition-colors duration-300 hover:border-primary/20 hover:bg-white/5">
                  <p className="text-[10px] font-bold tracking-[0.24em] text-foreground/45 uppercase group-hover/item:text-primary/70">{item.label}</p>
                  <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[28px] border-white/8 bg-white/3 p-5 transition-transform duration-500 hover:scale-[1.01]">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-3 text-primary">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.24em] text-primary uppercase">Kayıt notları</p>
              <p className="text-sm text-foreground/70">Formu doldururken şekillenen kısa okuma.</p>
            </div>
          </div>

          {hasSummaryContent ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 transition-colors duration-300 hover:border-white/12 hover:bg-white/5">
                <div className="mb-2 flex items-center gap-2 text-foreground/55">
                  <Library className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Arşiv hissi</span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  {values.isbn?.trim()
                    ? `ISBN tanımlandı, kayıt bibliyografik olarak daha güçlü bağlandı.`
                    : `ISBN girilirse başlık, kapak ve yazar eşitlemesi hızlanır.`}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 transition-colors duration-300 hover:border-white/12 hover:bg-white/5">
                <div className="mb-2 flex items-center gap-2 text-foreground/55">
                  <Quote className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Kişisel katman</span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  {values.personalNote?.trim()
                    ? values.personalNote.trim()
                    : "Değerlendirme ve notlar eklendiğinde kayıt yalnızca envanter değil, kişisel bir iz de taşıyacak."}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 px-4 py-5">
              <p className="text-sm leading-relaxed text-foreground/70">
                Sağ panel, formu doldurdukça kitabın kimliğini canlı olarak özetleyecek. İlk olarak başlık, yazar veya ISBN alanlarından başlayın.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function BookFormActions(props: any) {
  const { layout, isSubmitting, mode, onCancel, onOpenChange, submitError } = props;
  const actionsClassName =
    layout === "page"
      ? "mt-12 rounded-[32px] border border-white/8 bg-white/3 px-4 py-8 md:px-6"
      : "mt-12 border-t border-white/5 bg-transparent px-6 py-8 md:-mx-8 md:px-8";
  const actionsInnerClassName =
    layout === "page"
      ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      : "mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end";

  return (
    <>
      <div className={actionsClassName}>
        <div className={actionsInnerClassName}>
          <p className="max-w-md text-sm leading-relaxed text-foreground/70">
            Kayıt işlemi tamamlandığında; yinelenen denetimi, bilgi güncelleme ve kapak seçimi süreçleri mevcut işleyişe uygun olarak korunur.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-12 rounded-2xl border-white/10 bg-white/3 px-8 text-[11px] font-bold tracking-widest text-white/60 uppercase transition-all hover:bg-white/8 hover:text-white"
              disabled={isSubmitting}
              onClick={onCancel ?? (() => onOpenChange?.(false))}
              variant="ghost"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Vazgeç
            </Button>
            <Button
              className="h-12 rounded-2xl bg-white px-10 text-[11px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {mode === "add" ? "Kaydet" : "Güncelle"}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {submitError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5 text-rose-400 duration-500 animate-in zoom-in-95">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
          <p className="text-[11px] leading-relaxed font-bold tracking-tight uppercase">{submitError}</p>
        </div>
      ) : null}
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

export function BookForm({
  mode,
  initialBook,
  onOpenChange,
  onSuccess,
  onCancel,
  layout = "modal"
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
    selectedSeries,
    pendingAuthorSuggestions,
    addAuthorById,
    removeDraftAuthorName,
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

  const { metadataState, fetchMetadata } = useIsbnMetadata({
    onMetadataFound: (metadata, _source, coverOptions) => {
      void (async () => {
        setValue("title", metadata.title ?? "", { shouldDirty: true });
        setValue("subtitle", metadata.subtitle ?? "", { shouldDirty: true });
        setValue("publisher", metadata.publisher ?? "", { shouldDirty: true });
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
          const authorIds = await resolveAuthorIdsFromNames(metadata.authors);
          if (authorIds.length > 0) {
            const mergedAuthorIds = Array.from(
              new Set([...(values.authorIds ?? []), ...authorIds])
            );

            setValue("authorIds", mergedAuthorIds, {
              shouldDirty: true,
              shouldValidate: true
            });
          }
        }
      })();
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
      values.publisher?.trim() ||
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

  return (
    <FormProvider {...form}>
      <form className={cn("pb-12", layout === "page" ? "space-y-8" : "space-y-12 pb-16")} onSubmit={onSubmit}>
        {layout === "page" ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <BookFormSidebar
              categoryLabel={categoryLabel}
              coverPreviewUrl={coverPreviewUrl}
              hasSummaryContent={hasSummaryContent}
              mode={mode}
              selectedSeries={selectedSeries}
              stickyStyle={stickyStyle}
              summaryAuthors={summaryAuthors}
              summaryLocation={summaryLocation}
              summarySeries={summarySeries}
              summaryStatus={summaryStatus}
              summaryTitle={summaryTitle}
              values={values}
            />

            <div className="min-w-0 space-y-8">
              <BookFormSections
                addAuthorById={addAuthorById}
                availableAuthors={availableAuthors}
                authorQuery={authorQuery}
                canCreateAuthor={canCreateAuthor}
                canCreateCategory={canCreateCategory}
                canCreateSeries={canCreateSeriesExt}
                categoryQuery={categoryQuery}
                categories={categoriesQuery.data ?? []}
                createAuthor={createAuthor}
                createCategory={createCategory}
                createSeries={createSeries}
                draftAuthorNames={draftAuthorNames}
                fileInputRef={fileInputRef}
                fetchMetadata={fetchMetadata}
                hasCustomCover={Boolean(values.coverCustomUrl)}
                isSubmitting={isSubmitting}
                isUploadingCover={isUploadingCover}
                metadataState={metadataState}
                mode={mode}
                onRevertClick={() => void revertCoverToDefault()}
                onSelectMetadataCover={(url: string) => {
                  setValue("coverMetadataUrl", url, { shouldDirty: true });
                }}
                onUploadClick={() => fileInputRef.current?.click()}
                pendingAuthorSuggestions={pendingAuthorSuggestions}
                removeDraftAuthorName={removeDraftAuthorName}
                resolveSuggestedAuthor={resolveSuggestedAuthor}
                selectedAuthors={selectedAuthors}
                selectedMetadataCoverUrl={values.coverMetadataUrl || null}
                selectedSeries={selectedSeries}
                series={seriesQueryResult.data ?? []}
                seriesQuery={seriesQuery}
                setAuthorQuery={setAuthorQuery}
                setCategoryQuery={setCategoryQuery}
                setSeriesQuery={setSeriesQuery}
                coverPreviewUrl={coverPreviewUrl}
                uploadCover={uploadCover}
                values={values}
              />

              <BookFormActions
                isSubmitting={isSubmitting}
                layout={layout}
                mode={mode}
                onCancel={onCancel}
                onOpenChange={onOpenChange}
                submitError={submitError}
              />
            </div>
          </div>
        ) : (
          <>
            <BookFormSections
              addAuthorById={addAuthorById}
              availableAuthors={availableAuthors}
              authorQuery={authorQuery}
              canCreateAuthor={canCreateAuthor}
              canCreateCategory={canCreateCategory}
              canCreateSeries={canCreateSeriesExt}
              categoryQuery={categoryQuery}
              categories={categoriesQuery.data ?? []}
              createAuthor={createAuthor}
              createCategory={createCategory}
              createSeries={createSeries}
              draftAuthorNames={draftAuthorNames}
              fileInputRef={fileInputRef}
              fetchMetadata={fetchMetadata}
              hasCustomCover={Boolean(values.coverCustomUrl)}
              isSubmitting={isSubmitting}
              isUploadingCover={isUploadingCover}
              metadataState={metadataState}
              mode={mode}
              onRevertClick={() => void revertCoverToDefault()}
              onSelectMetadataCover={(url: string) => {
                setValue("coverMetadataUrl", url, { shouldDirty: true });
              }}
              onUploadClick={() => fileInputRef.current?.click()}
              pendingAuthorSuggestions={pendingAuthorSuggestions}
              removeDraftAuthorName={removeDraftAuthorName}
              resolveSuggestedAuthor={resolveSuggestedAuthor}
              selectedAuthors={selectedAuthors}
              selectedMetadataCoverUrl={values.coverMetadataUrl || null}
              selectedSeries={selectedSeries}
              series={seriesQueryResult.data ?? []}
              seriesQuery={seriesQuery}
              setAuthorQuery={setAuthorQuery}
              setCategoryQuery={setCategoryQuery}
              setSeriesQuery={setSeriesQuery}
              coverPreviewUrl={coverPreviewUrl}
              uploadCover={uploadCover}
              values={values}
            />

            <BookFormActions
              isSubmitting={isSubmitting}
              layout={layout}
              mode={mode}
              onCancel={onCancel}
              onOpenChange={onOpenChange}
              submitError={submitError}
            />
          </>
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
