"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  LoaderCircle,
  Route,
  BarChart3,
  Cpu,
  History,
  TrendingUp,
  Files,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import {
  Button,
  cn
} from "@/components/ui";
import type {
  AiSuggestionsResponse
} from "@/types";
import type { CuratedBookRecommendation } from "@/types/curator";
import { readJsonResponse } from "@/lib/shared";
import { PageHero } from "@/components/page-hero";
import { appPageTitles } from "@/lib/navigation";
import { HistoryDrawer, type HistoryItem } from "./history-drawer";

async function fetchAiSuggestions(id?: string) {
  const url = id ? `/api/ai/suggestions?id=${id}` : "/api/ai/suggestions";
  const response = await fetch(url);
  return readJsonResponse<AiSuggestionsResponse>(response);
}

async function fetchAiHistory() {
  const response = await fetch("/api/ai/suggestions/history");
  return readJsonResponse<{ reports: HistoryItem[] }>(response);
}

async function generateAiReport() {
  const response = await fetch("/api/ai/suggestions", {
    method: "POST",
  });
  return readJsonResponse<{ report: any; regenerated: boolean; error?: string }>(response);
}

function SuggestionsSkeleton() {
  const skeletonSlots = ["alpha", "beta", "gamma", "delta"];

  return (
    <section className="space-y-10 pb-20">
      {/* Hero Skeleton */}
      <div className="space-y-8 py-10">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />
          <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
        </div>
        <div className="h-14 w-48 animate-pulse rounded-2xl bg-white/5" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-8 lg:grid-cols-2">
        {skeletonSlots.map((slot) => (
          <div className="space-y-8 rounded-[32px] border border-white/5 bg-white/2 p-8" key={slot}>
             <div className="flex justify-between gap-6">
                <div className="space-y-3">
                  <div className="h-10 w-48 animate-pulse rounded-xl bg-white/5" />
                  <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />
                </div>
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-white/5" />
             </div>
             <div className="space-y-4">
               <div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />
               <div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />
             </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ 
  onAnalyze, 
  isAnalyzing 
}: { 
  onAnalyze: () => void;
  isAnalyzing: boolean;
}) {
  return (
    <section className="space-y-10 pb-20 duration-300 animate-in fade-in">
      <PageHero
        action={
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={onAnalyze} 
              disabled={isAnalyzing}
              className="h-14 rounded-2xl border border-primary/20 bg-primary/10 px-8 text-[11px] font-bold tracking-widest text-primary uppercase shadow-none transition-all hover:translate-y-0 hover:bg-primary/20 hover:shadow-none"
            >
              {isAnalyzing ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Cpu className="mr-2 h-4 w-4" />
              )}
              {isAnalyzing ? "Analiz Ediliyor..." : "Koleksiyonu Analiz Et"}
            </Button>
          </div>
        }

        description="Aylık koleksiyon analiziniz henüz oluşturulmadı. Koleksiyonunuzdaki eksikleri ve yeni önerileri görmek için bir analiz başlatabilirsiniz."
        kicker="Akıllı Öneriler"
        title={appPageTitles.aiSuggestions}
      />
    </section>
  );
}

function SectionCard<TItem>({
  title,
  description,
  icon: Icon,
  items,
  renderItem
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: TItem[];
  renderItem: (item: TItem, index: number) => React.ReactNode;
}) {
  return (
    <div className="group glass-panel relative flex flex-col overflow-hidden rounded-3xl border-white/5 bg-white/1 p-8 transition-all duration-700 hover:border-white/10">
      <div className="relative space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <h3 className="font-serif text-3xl font-bold tracking-tight text-white">{title}</h3>
            <p className="max-w-sm text-[13px] leading-relaxed text-foreground">{description}</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-white/1 py-12 text-center text-foreground/80">
               <p className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">Tüm veriler analiz edildi. Yeni bir sonuç bulunamadı.</p>
            </div>
          ) : (
            items.map((item, index) => {
              const itemKey = (item as any).id || (item as any).title || (item as any).series || (item as any).author || index;
              return (
                <div
                  className="group/item relative rounded-2xl border border-white/3 bg-white/2 p-6 transition-all duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-2 hover:border-white/10 hover:bg-white/5"
                  key={typeof itemKey === "string" ? itemKey : `item-${index}`}
                >
                  {renderItem(item, index)}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationItemView({ item }: { item: CuratedBookRecommendation }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-xl leading-tight font-bold tracking-tight text-white transition-colors group-hover/item:text-primary">{item.title}</h3>
        <span className="shrink-0 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-[9px] font-bold tracking-widest text-primary uppercase">
          %{Math.round(item.score)} UYUMLULUK
        </span>
      </div>
      <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">{item.author}</p>
      <p className="text-[13px] leading-relaxed text-foreground">{item.reason}</p>
    </div>
  );
}

function ConnectedBookItemView({
  item
}: {
  item: { title: string; author: string; connectionReason: string };
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-serif text-xl leading-tight font-bold tracking-tight text-white transition-colors group-hover/item:text-primary">{item.title}</h3>
      <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">{item.author}</p>
      <p className="text-[13px] leading-relaxed text-foreground">{item.connectionReason}</p>
    </div>
  );
}

function StatItemView({
  item
}: {
  item: { category: string; count: number; percentage: number; avgRating: number | null };
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl leading-tight font-bold tracking-tight text-white transition-colors group-hover/item:text-primary">
          {item.category}
        </h3>
        <span className="shrink-0 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-[9px] font-bold tracking-widest text-primary uppercase">
          {item.count} kitap
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-foreground">
        Oran: %{item.percentage.toFixed(1)} | Ortalama Puan: {item.avgRating ?? "—"}
      </p>
    </div>
  );
}

function SuggestionsContent({
  report,
  onAnalyze,
  onOpenHistory,
  isAnalyzing,
  isHistorical = false
}: {
  report: NonNullable<AiSuggestionsResponse["report"]>;
  onAnalyze: () => void;
  onOpenHistory: () => void;
  isAnalyzing: boolean;
  isHistorical?: boolean;
}) {
  return (
    <section className="space-y-10 pb-20">
      <PageHero
        action={
          <div className="flex flex-wrap gap-4">
             <Button 
              onClick={onAnalyze} 
              disabled={isAnalyzing}
              className="h-14 rounded-2xl border border-primary/20 bg-primary/10 px-8 text-[11px] font-bold tracking-widest text-primary uppercase shadow-none transition-all hover:translate-y-0 hover:bg-primary/20 hover:shadow-none"
            >
              {isAnalyzing ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Cpu className="mr-2 h-4 w-4" />
              )}
              {isAnalyzing ? "Analiz Ediliyor..." : "Yeni Analiz Başlat"}
            </Button>
            <Button onClick={onOpenHistory} variant="ghost" className="h-14 rounded-2xl border border-white/5 bg-white/5 px-8 text-[11px] font-bold tracking-widest text-white uppercase transition-all hover:border-white/10 hover:bg-white/10">
              <History className="mr-2 h-4 w-4" />
              Analiz Geçmişi
            </Button>
          </div>
        }

        description={isHistorical 
          ? `Bu rapor ${new Date(report.generatedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihinde oluşturulmuş bir arşiv kaydıdır.` 
          : report.libraryPanorama.summary
        }
        kicker={isHistorical ? "Analiz Arşivi" : "Akıllı Öneriler"}
        title={appPageTitles.aiSuggestions}
      />

      {isHistorical && (
         <div className="rounded-[32px] border border-primary/20 bg-primary/5 p-8 duration-700 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
               <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                  <TrendingUp className="h-6 w-6" />
               </div>
               <div>
                  <h4 className="font-serif text-xl font-bold text-white">Geçmiş Analiz Görüntüleniyor</h4>
                  <p className="text-[13px] text-foreground">Şu anki koleksiyon durumunuz bu rapordan farklı olabilir.</p>
               </div>
            </div>
         </div>
      )}

      {/* Analytics Preview (Only on latest) */}
      {!isHistorical && (
        <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: "Analiz Tarihi", value: new Date(report.generatedAt).toLocaleDateString("tr-TR"), icon: Clock },
              { label: "Öneri Sayısı", value: report.curatedSelection.length + report.nextMonthRoute.connectedBooks.length, icon: Files },
              { label: "Koleksiyon Durumu", value: report.libraryPanorama.unreadStats.trendDescription.split(".")[0], icon: BarChart3 },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel flex items-center gap-4 rounded-3xl border-white/5 bg-white/1 p-6 transition-all hover:border-white/10">
                <div className="rounded-xl bg-primary/5 p-3 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-foreground uppercase">{stat.label}</p>
                  <p className="font-serif text-lg leading-tight font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="grid gap-8 duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-4 lg:grid-cols-2">
        <SectionCard
          description="Bu ayın küratör seçkisi"
          icon={BookOpen}
          items={report.curatedSelection}
          renderItem={(item) => <RecommendationItemView item={item} />}
          title="Okuma Tavsiyeleri"
        />
        <SectionCard
          description={report.nextMonthRoute.thematicJustification}
          icon={Route}
          items={report.nextMonthRoute.connectedBooks}
          renderItem={(item) => <ConnectedBookItemView item={item} />}
          title={report.nextMonthRoute.theme}
        />
        <SectionCard
          description="Türlere göre koleksiyon dağılımı"
          icon={BarChart3}
          items={report.libraryPanorama.categoryBreakdown}
          renderItem={(item) => <StatItemView item={item} />}
          title="Analiz Özeti"
        />
        <SectionCard
          description="Gelecek ay için önerilen adımlar"
          icon={Cpu}
          items={report.nextMonthRoute.suggestedActions}
          renderItem={(item) => (
            <p className="text-[13px] leading-relaxed text-foreground">{item}</p>
          )}
          title="Gelecek Ayın Rotası"
        />
      </div>
    </section>
  );
}

export function AiSuggestionsPageClient() {
  const queryClient = useQueryClient();
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [selectedReportId, setSelectedReportId] = React.useState<string | undefined>();

  const suggestionsQuery = useQuery({
    queryKey: ["ai", "suggestions", selectedReportId],
    queryFn: () => fetchAiSuggestions(selectedReportId)
  });

  const historyQuery = useQuery({
    queryKey: ["ai", "suggestions", "history"],
    queryFn: fetchAiHistory
  });

  const [showAnalysisError, setShowAnalysisError] = React.useState(false);
  const analysisMutation = useMutation({
    mutationFn: generateAiReport,
    onSuccess: (data) => {
      if (data.regenerated) {
        queryClient.invalidateQueries({ queryKey: ["ai", "suggestions"] });
        setShowAnalysisError(false);
      }
    },
    onError: () => {
      setShowAnalysisError(true);
    }
  });

  const analysisError = analysisMutation.error instanceof Error 
    ? analysisMutation.error.message 
    : "Analiz sırasında bir hata oluştu.";


  if (suggestionsQuery.isLoading) {
    return (
      <div>
        <SuggestionsSkeleton />
      </div>
    );
  }

  if (suggestionsQuery.isError) {
    return (
      <>
        <section>
          <div className="glass-panel rounded-[40px] border-rose-400/20 bg-rose-400/5 p-12 text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold text-white">Bağlantı Hatası</h2>
            <p className="mx-auto max-w-md text-sm text-foreground">
               {suggestionsQuery.error instanceof Error
                  ? suggestionsQuery.error.message
                  : "Öneriler sunucudan alınamadı."}
            </p>
            <Button onClick={() => suggestionsQuery.refetch()} variant="ghost" className="mt-8 rounded-xl border border-white/5 hover:bg-white/3">Yeniden Dene</Button>
          </div>
        </section>
      </>
    );
  }

  const report = suggestionsQuery.data?.report ?? null;

  return (
    <div className="space-y-6">
      {showAnalysisError && (
        <div className="glass-panel relative flex items-start gap-4 overflow-hidden rounded-3xl border-rose-500/20 bg-rose-500/5 p-6 animate-in fade-in slide-in-from-top-4">
           <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500">
              <AlertCircle className="h-5 w-5" />
           </div>
           <div className="flex-1 pr-8">
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-rose-500 uppercase">Analiz Hatası</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground">{analysisError}</p>
           </div>
            <button 
              aria-label="Uyarıyı kapat"
              onClick={() => setShowAnalysisError(false)}
              className="absolute top-6 right-6 text-foreground/40 transition-colors hover:text-white"
           >
              <X className="h-4 w-4" />
           </button>
        </div>
      )}

      {report ? (
        <SuggestionsContent
          isHistorical={!!selectedReportId}
          onAnalyze={() => analysisMutation.mutate()}
          onOpenHistory={() => setHistoryOpen(true)}
          report={report}
          isAnalyzing={analysisMutation.isPending}
        />
      ) : (
        <EmptyState 
          onAnalyze={() => analysisMutation.mutate()} 
          isAnalyzing={analysisMutation.isPending}
        />
      )}
      
      <HistoryDrawer
        history={historyQuery.data?.reports ?? []}
        onOpenChange={setHistoryOpen}
        onSelectReport={setSelectedReportId}
        open={historyOpen}
        selectedId={selectedReportId}
      />
    </div>

  );
}
