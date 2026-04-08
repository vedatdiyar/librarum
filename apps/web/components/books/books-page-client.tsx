"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, List, LoaderCircle } from "lucide-react";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger
} from "@librarum/ui";
import { useBooksViewStore } from "@/lib/stores/books-view-store";
import { PageHero } from "@/components/page-hero";
import { useBooksPageData, useSelection } from "./use-books-page-data";
import { BooksFilterBar } from "./filter-bar";
import { BooksTable, BooksGrid } from "./inventory-views";
import { BulkActionDialog, type BulkAction } from "./bulk-action-dialog";

const BULK_ACTIONS: Array<{ action: BulkAction; label: string }> = [
  { action: "category", label: "Kategori Güncelle" },
  { action: "tags", label: "Etiketleri Değiştir" },
  { action: "location", label: "Konum Güncelle" },
  { action: "status", label: "Durum Güncelle" },
  { action: "donatable", label: "Bağış Durumu" },
  { action: "series", label: "Seri Ata" }
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
    <div className="flex items-center justify-center gap-4 py-8">
      <Button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        size="icon"
        variant="secondary"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-text-primary">
        Sayfa {currentPage} / {totalPages}
      </span>
      <Button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        size="icon"
        variant="secondary"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Internal content component that uses useSearchParams.
 * It is NOT exported to prevent static analysis tools from flagging it as a missing boundary site.
 */
function BooksPageClientContent() {
  const view = useBooksViewStore((state) => state.view);
  const setView = useBooksViewStore((state) => state.setView);

  const searchParams = useSearchParams();
  const {
    page,
    filters,
    booksQuery,
    categoriesQuery,
    tagsQuery,
    authorsQuery,
    seriesQuery,
    syncFiltersToUrl,
    bulkUpdateMutation
  } = useBooksPageData(searchParams);

  const [locationDraft, setLocationDraft] = React.useState(filters.location);
  const [activeBulkAction, setActiveBulkAction] = React.useState<BulkAction | null>(null);

  const items = booksQuery.data?.items ?? [];
  const { selectedIds, allVisibleSelected, toggleRow, toggleAllVisible, clearSelection } =
    useSelection(items);

  React.useEffect(() => {
    setLocationDraft(filters.location);
  }, [filters.location]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (locationDraft !== filters.location) {
        syncFiltersToUrl({ ...filters, location: locationDraft });
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [locationDraft, filters, syncFiltersToUrl]);

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
    <section className="page-stack">
      <PageHero
        description="Koleksiyonunuzdaki tüm kitaplar burada listelenir. Filtreleri kullanarak aradığınızı bulabilir veya toplu işlemler yapabilirsiniz."
        kicker="Kütüphane"
        title="Tüm Kitaplar"
      />

      <BooksFilterBar
        authors={authorsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        filters={filters}
        locationDraft={locationDraft}
        onFilterChange={handleFilterChange}
        series={seriesQuery.data ?? []}
        setLocationDraft={setLocationDraft}
        tags={tagsQuery.data ?? []}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 ? (
            <>
              <span className="mr-2 text-sm font-medium text-accent">
                {selectedIds.length} kitap seçili
              </span>
              {BULK_ACTIONS.map(({ action, label }) => (
                <Button
                  key={action}
                  onClick={() => setActiveBulkAction(action)}
                  size="sm"
                  variant="secondary"
                >
                  {label}
                </Button>
              ))}
              <Button onClick={clearSelection} size="sm" variant="ghost">
                Seçimi Temizle
              </Button>
            </>
          ) : (
            <p className="text-sm text-text-secondary">
              İşlem yapmak için listeden kitap seçebilirsiniz.
            </p>
          )}
        </div>

        <Tabs onValueChange={(v) => setView(v as "list" | "grid")} value={view}>
          <TabsList>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="grid">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Galeri
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {booksQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : items.length > 0 ? (
        <>
          {view === "list" ? (
            <BooksTable
              allVisibleSelected={allVisibleSelected}
              items={items}
              onToggleAllVisible={toggleAllVisible}
              onToggleRow={toggleRow}
              selectedIds={selectedIds}
            />
          ) : (
            <BooksGrid items={items} onToggleRow={toggleRow} selectedIds={selectedIds} />
          )}

          <Pagination
            currentPage={page}
            onPageChange={(p) => syncFiltersToUrl(filters, p)}
            totalPages={booksQuery.data?.totalPages ?? 1}
          />
        </>
      ) : (
        <div className="rounded-[26px] border border-border/60 bg-surface p-12 text-center">
          <p className="text-lg text-text-secondary">Aradığınız kriterlere uygun kitap bulunamadı.</p>
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

export function BooksPageClient() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <BooksPageClientContent />
    </React.Suspense>
  );
}
