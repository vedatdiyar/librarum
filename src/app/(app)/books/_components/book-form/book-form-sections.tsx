import * as React from "react";
import {
  Cpu,
  Layers,
  MapPin,
  User,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/components/ui";

import { PublicationSection } from "./form-sections/publication-info-section";
import { StatusLocationSection } from "./form-sections/status-location-section";
import { PersonalSection, CoverSection } from "./form-sections/personal-and-cover-sections";
import { ClassificationSection } from "./form-sections/classification-section";

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
        data-section-index={index}
        className={cn(
          "group glass-panel relative flex flex-col overflow-hidden transition-all duration-300 hover:border-white/10",
          "rounded-[24px] p-4 md:rounded-[40px] md:p-8",
          "border-white/5 bg-white/1"
        )}
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/5 opacity-0 blur-[60px] transition-opacity duration-1000 group-hover:opacity-100 md:h-64 md:w-64 md:blur-[120px]" />
      
      <div className="relative space-y-4 md:space-y-8">
        <div className="flex items-start justify-between gap-4 md:gap-6">
          <div className="space-y-0.5 md:space-y-1">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white md:text-3xl">{title}</h3>
            <p className="max-w-sm text-[10px] leading-relaxed text-foreground italic md:text-[13px]">{description}</p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/10 bg-white/3 p-2 text-foreground transition-all duration-700 group-hover:bg-primary/10 group-hover:text-primary md:rounded-2xl md:p-3.5">
            <Icon className="h-4 w-4 md:h-6 md:w-6" />
          </div>
        </div>
        <div className="pt-0">{children}</div>
      </div>
    </div>
  );
}

export function BookFormSections(props: Record<string, any>) {

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
    updateDraftAuthorName,
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
    values,
    publishers,
    publisherQuery,
    setPublisherQuery,
    canCreatePublisher,
    createPublisher
  } = props;

  return (
    <>
      <Section
        index={0}
        icon={Cpu}
        description="Kitap başlığı, yazar ve temel yayın bilgileri."
        title="1. Bölüm — Kitap Detayları"
      >
        <PublicationSection
          addAuthorById={addAuthorById}
          removeDraftAuthorName={removeDraftAuthorName}
          updateDraftAuthorName={updateDraftAuthorName}
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
          publishers={publishers}
          publisherQuery={publisherQuery}
          setPublisherQuery={setPublisherQuery}
          canCreatePublisher={canCreatePublisher}
          createPublisher={createPublisher}
        />
      </Section>

      <Section
        index={1}
        icon={Layers}
        description="Koleksiyon kategorisi ve seri alanlarıyla kitabın sınıflandırmasını tamamlayın."
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
        description="Kitap durumu, koleksiyondaki konumu ve kopya sayısı."
        title="3. Bölüm — Durum ve Konum"
      >
        <StatusLocationSection />
      </Section>

      <Section
        index={3}
        icon={User}
        description="Kişisel değerlendirme, okuma puanı ve kitap notları."
        title="4. Bölüm — Kişisel Değerlendirme"
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
          id="coverImage"
          name="coverImage"
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
