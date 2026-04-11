"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  SeriesDetailPageClientBackLink, 
  SeriesDetailPageClientError, 
  SeriesDetailPageClientHero, 
  SeriesDetailPageClientLoading, 
  SeriesDetailPageClientStatusSection, 
  SeriesDetailPageClientVolumesSection 
} from "./series-detail-page-client-sections";
import type { SeriesDetail } from "@/types";
import { Library } from "lucide-react";
import { readJsonResponse } from "@/lib/shared";

async function fetchSeriesDetail(seriesSlug: string) {
  const response = await fetch(`/api/series/${seriesSlug}`);
  return readJsonResponse<SeriesDetail>(response);
}

export function SeriesDetailPageClient({ seriesSlug }: { seriesSlug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState("");
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);

  const detailQuery = useQuery({
    queryKey: ["series-detail", seriesSlug],
    queryFn: () => fetchSeriesDetail(seriesSlug)
  });

  React.useEffect(() => {
    if (detailQuery.data) {
      setNameDraft(detailQuery.data.name);
    }
  }, [detailQuery.data]);

  React.useEffect(() => {
    if (isEditing) {
      nameInputRef.current?.focus();
    }
  }, [isEditing]);

  const updateMutation = useMutation({
    mutationFn: async (name: string) =>
      readJsonResponse<{ id: string; name: string; slug: string }>(
        await fetch(`/api/series/${seriesSlug}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ name })
        })
      ),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["series-detail", seriesSlug] });
      void queryClient.invalidateQueries({ queryKey: ["series-detail", updated.slug] });
      void queryClient.invalidateQueries({ queryKey: ["series"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      setIsEditing(false);
      if (updated.slug !== seriesSlug) {
        router.replace(`/series/${updated.slug}`);
      }
    }
  });

  if (detailQuery.isLoading) {
    return <SeriesDetailPageClientLoading />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <SeriesDetailPageClientError
        message={detailQuery.error instanceof Error ? detailQuery.error.message : "Seri bilgileri kütüphaneden alınırken bir sorun oluştu."}
      />
    );
  }

  const series = detailQuery.data;

  return (
    <div className="relative z-10 space-y-12 pb-24">
      <SeriesDetailPageClientBackLink />

      <SeriesDetailPageClientHero
        series={series}
        errorMessage={updateMutation.isError ? updateMutation.error instanceof Error ? updateMutation.error.message : "Güncelleme sırasında hata oluştu." : null}
        isEditing={isEditing}
        isPending={updateMutation.isPending}
        nameDraft={nameDraft}
        nameInputRef={nameInputRef}
        onCancel={() => {
          setNameDraft(series.name);
          setIsEditing(false);
        }}
        onStartEditing={() => setIsEditing(true)}
        onSubmit={() => updateMutation.mutate(nameDraft.trim())}
        setNameDraft={setNameDraft}
      />

      <div className="grid gap-12 xl:grid-cols-[1fr_420px]">
        <SeriesDetailPageClientVolumesSection series={series} />
        <SeriesDetailPageClientStatusSection series={series} />
      </div>

      <footer className="relative mt-20 overflow-hidden border-t border-white/5 pt-12">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="space-y-1.5 text-center md:text-left">
              <p className="text-[11px] font-bold tracking-wider text-foreground/80 uppercase">
                Librarum Dijital Kütüphane Sistemi
              </p>
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <span className="text-[10px] font-medium tracking-tighter text-foreground/80 uppercase">Seri ID:</span>
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-primary/80">
                  {series.slug}
                </code>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <span className="text-[10px] font-bold tracking-[0.2em] text-foreground/80 uppercase">Koleksiyon Verisi</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-2 backdrop-blur-md">
              <Library className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold tracking-wide text-foreground/80">
                {series.ownedVolumes.length} Kayıtlı Kitap
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
