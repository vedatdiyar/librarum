"use client";

import * as React from "react";
import { BookCopy, ChevronLeft, ChevronRight, LayoutGrid, List, LoaderCircle } from "lucide-react";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui";
import { useBooksViewStore } from "@/stores/books-view-store";
import { PageHero } from "@/components/page-hero";
import { useBooksPageData, useSelection } from "../_hooks/use-books-page-data";
import { BooksFilterBar } from "./filter-bar";
import { BooksTable, BooksGrid } from "./inventory-views";
import { BulkActionDialog, type BulkAction } from "./bulk-action-dialog";
import { cn } from "@/lib/utils";
import { appPageTitles } from "@/lib/navigation";
import { useUIStore } from "@/stores/ui-store";

const BULK_ACTIONS: Array<{ action: BulkAction; label: string }> = [
  { action: "category", label: "Kategori" },
  { action: "location", label: "Konum" },
  { action: "status", label: "Durum" },
  { action: "donatable", label: "Bağış" },
  { action: "series", label: "Seri" }
];

function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-12 duration-300 animate-in fade-in slide-in-from-bottom-2">
      <Button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-11 w-11 rounded-xl border-white/10 bg-white/3 transition-all duration-300 hover:bg-white/8"
        variant="ghost"
      >
        <ChevronLeft className="h-5 w-5 text-white/70" />
      </Button>
      <div className="flex flex-col items-center">
        <span className="mb-1 text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">Gezinti</span>
        <span className="font-serif text-sm font-bold tracking-tight text-foreground">
          Sayfa {currentPage} / {totalPages}
        </span>
      </div>
      <Button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-11 w-11 rounded-xl border-white/10 bg-white/3 transition-all duration-300 hover:bg-white/8"
        variant="ghost"
      >
        <ChevronRight className="h-5 w-5 text-white/70" />
      </Button>
    </div>
  );
}

export function BooksPageClientContent({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const view = useBooksViewStore((state) => state.view);
  const setView = useBooksViewStore((state) => state.setView);

  const searchParamsObject = React.useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, item));
        return;
      }

      if (value != null) {
        params.set(key, value);
      }
    });

    return params;
  }, [searchParams]);

  const {
    page,
    filters,
    booksQuery,
    categoriesQuery,
    authorsQuery,
    seriesQuery,
    locationsQuery,
    syncFiltersToUrl,
    bulkUpdateMutation
  } = useBooksPageData(searchParamsObject);

  const [activeBulkAction, setActiveBulkAction] = React.useState<BulkAction | null>(null);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  const items = booksQuery.data?.items ?? [];
  const { selectedIds, allVisibleSelected, toggleRow, toggleAllVisible, clearSelection } =
    useSelection(items);



  const handleFilterChange = (key: string, value: string) => {
    syncFiltersToUrl({ ...filters, [key]: value });
  };

  const handleBulkSubmit = (payload: any) => {
    bulkUpdateMutation.mutate(
      { ...payload, bookIds: selectedIds },
      {
        onSuccess: () => {
          setActiveBulkAction(null);
          clearSelection();
        },
        onError: (error) => {
          console.error(error);
        }
      }
    );
  };

  return (
    <section className="space-y-10 pb-20">
      <PageHero
        description="Kitaplarınızın kapsamlı dökümü. Gelişmiş filtrelerle aramanızı özelleştirin, liste veya galeri görünümü arasında geçiş yapın ve koleksiyonunuzu toplu işlemlerle yönetin."
        kicker="Koleksiyon"
        title={appPageTitles.books}
      />

      <div className="delay-50 duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-2">
        <BooksFilterBar
            authors={authorsQuery.data ?? []}
            categories={categoriesQuery.data ?? []}
            filters={filters}
            onFilterChange={handleFilterChange}
            series={seriesQuery.data ?? []}
            locations={locationsQuery.data ?? []}
            view={view}
            setView={setView}
        />
      </div>


      {booksQuery.isLoading ? (
        <div className="space-y-4 duration-500 animate-in fade-in">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="h-24 w-full animate-pulse rounded-2xl border border-white/5 bg-white/2" key={`internal-row-skeleton-${i}`} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="glass-panel rounded-3xl border-white/5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)] delay-150 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-8">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-white/3 px-4 py-6 md:flex-row md:items-center md:gap-6 md:px-8">
                <div>
                  <h3 className="font-serif text-lg font-bold tracking-tight text-white md:text-xl">Kayıtlı Kitaplar</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground/60 italic md:text-[12px]">Koleksiyonunuzdaki kitapların ve genel durumun özeti.</p>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="hidden h-10 w-px bg-white/5 md:block" />
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="font-serif text-xl font-bold tracking-tighter text-white md:text-2xl">{booksQuery.data?.totalItems ?? 0}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary md:h-9 md:w-9 md:rounded-xl">
                        <BookCopy className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                    </div>
                    <p className="line-clamp-1 text-[8px] font-bold tracking-wider text-primary/70 uppercase md:text-[9px]">Toplam Kitap</p>
                  </div>
                </div>
            </div>

            <div className="px-2 py-2 pb-8 md:px-4">
                {view === "list" ? (
                    <BooksTable
                    allVisibleSelected={allVisibleSelected}
                    items={items}
                    onToggleAllVisible={toggleAllVisible}
                    onToggleRow={toggleRow}
                    selectedIds={selectedIds}
                    />
                ) : (
                    <div className="px-2 py-6 md:px-4">
                        <BooksGrid items={items} onToggleRow={toggleRow} selectedIds={selectedIds} />
                    </div>
                )}

                <Pagination
                    currentPage={page}
                    onPageChange={(p) => syncFiltersToUrl(filters, p)}
                    totalPages={booksQuery.data?.totalPages ?? 1}
                />
            </div>
        </div>
      ) : (
        <div className="glass-panel flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-dashed border-white/5 duration-300 animate-in fade-in zoom-in-95">
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/2 p-4">
            <LayoutGrid className="h-8 w-8 text-foreground/20" />
          </div>
          <p className="mb-2 font-serif text-xl font-bold text-foreground">Kayıtlar Sessiz.</p>
          <p className="text-sm text-foreground italic">Mevcut arama parametrelerine uygun kitap bulunamadı.</p>
        </div>
      )}

      {selectedIds.length > 0 && (
          <div className={cn(
            "fixed right-0 bottom-6 left-0 z-50 flex justify-center px-4 transition-all duration-500 animate-in fade-in fill-mode-both slide-in-from-bottom-5 md:bottom-8",
            isSidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[240px]"
          )}>
            <div className="glass-panel flex flex-col items-center gap-4 rounded-2xl border-white/10 bg-white/1 p-3 shadow-[0_0_40px_rgba(0,0,0,0.5)] md:flex-row md:gap-6 md:p-4">
            <div className="flex items-center gap-3 border-white/10 pr-0 md:border-r md:pr-6">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 md:h-8 md:w-8">
                <span className="text-[10px] font-bold text-primary md:text-xs">{selectedIds.length}</span>
              </div>
              <span className="text-[10px] font-bold tracking-tight text-white/80 md:text-xs">Kitap Seçildi</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
              {BULK_ACTIONS.map(({ action, label }) => (
                <Button
                  key={action}
                  onClick={() => setActiveBulkAction(action)}
                  className="h-8 rounded-lg border-white/5 bg-white/5 px-3 text-[9px] font-bold tracking-wider text-foreground uppercase transition-all hover:bg-white/10 hover:text-primary active:scale-95 md:h-9 md:rounded-xl md:px-4 md:text-[10px] md:tracking-widest"
                  variant="ghost"
                >
                  {label}
                </Button>
              ))}
              <div className="mx-1 hidden h-4 w-px bg-white/10 md:mx-2 md:block" />
              <Button 
                onClick={clearSelection} 
                className="h-8 rounded-lg px-3 text-[9px] font-bold tracking-wider text-foreground uppercase transition-colors hover:text-destructive active:scale-95 md:h-9 md:rounded-xl md:px-4 md:text-[10px] md:tracking-widest"
                variant="ghost"
              >
                Temizle
              </Button>
            </div>
          </div>
        </div>
      )}

      <BulkActionDialog
        action={activeBulkAction}
        categories={categoriesQuery.data ?? []}
        errorMessage={
          bulkUpdateMutation.error instanceof Error ? bulkUpdateMutation.error.message : null
        }
        isPending={bulkUpdateMutation.isPending}
        onOpenChange={(open) => !open && setActiveBulkAction(null)}
        onSubmit={handleBulkSubmit}
        open={Boolean(activeBulkAction)}
        selectedCount={selectedIds.length}
        series={seriesQuery.data ?? []}
      />
    </section>
  );
}
