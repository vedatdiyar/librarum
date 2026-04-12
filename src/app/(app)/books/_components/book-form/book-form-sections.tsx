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
import { useBookFormContext } from "./book-form-context.tsx";

type BookFormSectionsProps = {
  className?: string;
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

export function BookFormSections({ className }: BookFormSectionsProps) {
  const ctx = useBookFormContext();

  return (
    <>
      {/* eslint-disable react-hooks/refs -- Context values contain a ref but are safe to access during render */}
      <Section
        index={0}
        icon={Cpu}
        description="Kitap başlığı, yazar ve temel yayın bilgileri."
        title="1. Bölüm — Kitap Detayları"
      >
        <PublicationSection
          addAuthorById={ctx.addAuthorById}
          removeDraftAuthorName={ctx.removeDraftAuthorName}
          updateDraftAuthorName={ctx.updateDraftAuthorName}
          availableAuthors={ctx.availableAuthors}
          authorQuery={ctx.authorQuery}
          authors={ctx.selectedAuthors}
          draftAuthorNames={ctx.draftAuthorNames}
          canCreateAuthor={ctx.canCreateAuthor}
          createAuthor={ctx.createAuthor}
          fetchMetadata={ctx.fetchMetadata}
          isSubmitting={ctx.isSubmitting}
          metadataState={ctx.metadataState}
          pendingAuthorSuggestions={ctx.pendingAuthorSuggestions}
          resolveSuggestedAuthor={ctx.resolveSuggestedAuthor}
          setAuthorQuery={ctx.setAuthorQuery}
          publishers={ctx.publishers}
          publisherQuery={ctx.publisherQuery}
          setPublisherQuery={ctx.setPublisherQuery}
          canCreatePublisher={ctx.canCreatePublisher}
          createPublisher={ctx.createPublisher}
        />
      </Section>

      <Section
        index={1}
        icon={Layers}
        description="Koleksiyon kategorisi ve seri alanlarıyla kitabın sınıflandırmasını tamamlayın."
        title="2. Bölüm — Sınıflandırma"
      >
        <ClassificationSection
          canCreateCategory={ctx.canCreateCategory}
          canCreateSeries={ctx.canCreateSeries}
          categories={ctx.categories}
          categoryQuery={ctx.categoryQuery}
          createCategory={ctx.createCategory}
          createSeries={ctx.createSeries}
          isSubmitting={ctx.isSubmitting}
          selectedSeries={ctx.selectedSeries}
          series={ctx.series}
          seriesQuery={ctx.seriesQuery}
          setCategoryQuery={ctx.setCategoryQuery}
          setSeriesQuery={ctx.setSeriesQuery}
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
          coverPreviewUrl={ctx.coverPreviewUrl}
          hasCustomCover={ctx.hasCustomCover}
          isSubmitting={ctx.isSubmitting}
          isUploadingCover={ctx.isUploadingCover}
          metadataCoverOptions={ctx.metadataCoverOptions}
          selectedMetadataCoverUrl={ctx.selectedMetadataCoverUrl}
          onSelectMetadataCover={ctx.onSelectMetadataCover}
          onRevertClick={ctx.onRevertClick}
          onUploadClick={ctx.onUploadClick}
        />
        <input
          ref={ctx.fileInputRef}
          aria-label="Özel kapak yükle"
          className="hidden"
          accept="image/*"
          id="coverImage"
          name="coverImage"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void ctx.uploadCover(file);
          }}
          type="file"
        />
      </Section>
      {/* eslint-enable react-hooks/refs */}
    </>
  );
}
