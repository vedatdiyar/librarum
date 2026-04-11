"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input
} from "@/components/ui";
import { LoaderCircle } from "lucide-react";
import type {
  BulkBooksPatchInput,
  CategoryOption,
  SeriesListItem
} from "@/types";

export type BulkAction = "category" | "location" | "status" | "donatable" | "series";

function FilterSelect({
  id,
  value,
  onChange,
  children,
  ariaLabel
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-11 w-full rounded-xl border border-border/80 bg-surface px-3 text-sm text-text-primary transition outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
      id={id}
      name={id}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {children}
    </select>
  );
}

import { BOOK_STATUS_LABELS } from "@/lib/constants/books";

const BULK_STATUS_OPTIONS = [
  { value: "owned", label: BOOK_STATUS_LABELS.owned },
  { value: "completed", label: BOOK_STATUS_LABELS.completed },
  { value: "abandoned", label: BOOK_STATUS_LABELS.abandoned },
  { value: "lost", label: BOOK_STATUS_LABELS.lost }
] as const;

function parseTagInput(value: string) {
  return value
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

export function BulkActionDialog({
  action,
  open,
  onOpenChange,
  selectedCount,
  categories,
  series,
  onSubmit,
  isPending,
  errorMessage
}: {
  action: BulkAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  categories: CategoryOption[];
  series: SeriesListItem[];
  onSubmit: (payload: Omit<BulkBooksPatchInput, "bookIds">) => void;
  isPending: boolean;
  errorMessage: string | null;
}) {
  const [formState, setFormState] = React.useState({
    categoryId: "",
    locationName: "",
    shelfRow: "",
    status: "owned",
    donatable: "true",
    seriesId: "",
    seriesOrder: ""
  });

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    if (!open) {
      setFormState({
        categoryId: "",
        locationName: "",
        shelfRow: "",
        status: "owned",
        donatable: "true",
        seriesId: "",
        seriesOrder: ""
      });
    }
  }, [open]);

  function submit() {
    if (!action) return;

    switch (action) {
      case "category":
        onSubmit({
          category:
            formState.categoryId === "__none__"
              ? null
              : formState.categoryId
                ? { id: formState.categoryId }
                : null
        });
        return;
            case "location":
        onSubmit({
          location:
            !formState.locationName.trim() &&
            !formState.shelfRow.trim()
              ? null
              : {
                  locationName: formState.locationName.trim() || null,
                  shelfRow: formState.shelfRow.trim().toUpperCase() || null
                }
        });
        return;
      case "status":
        onSubmit({
          status: formState.status as BulkBooksPatchInput["status"]
        });
        return;
      case "donatable":
        onSubmit({
          donatable: formState.donatable === "true"
        });
        return;
      case "series":
        onSubmit({
          series:
            formState.seriesId === "__none__"
              ? null
              : formState.seriesId
                ? { id: formState.seriesId }
                : null,
          seriesOrder: formState.seriesOrder.trim()
            ? Number.parseInt(formState.seriesOrder.trim(), 10)
            : null
        });
    }
  }

  const titleMap: Record<BulkAction, string> = {
    category: "Toplu kategori güncelle",
    location: "Toplu konum güncelle",
    status: "Toplu durum güncelle",
    donatable: "Toplu bağış durumu",
    series: "Toplu seri atama"
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(92vw,620px)]">
        <DialogHeader className="pr-10">
          <DialogTitle>{action ? titleMap[action] : "Toplu işlem"}</DialogTitle>
          <DialogDescription>
            {selectedCount} seçili kitap için değişikliği uygulayacaksın.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {action === "category" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="bulk-category">Kategori</label>
              <FilterSelect
                ariaLabel="Toplu kategori"
                id="bulk-category"
                onChange={(val) => updateField("categoryId", val)}
                value={formState.categoryId}
              >
                <option value="">Kategori seç</option>
                <option value="__none__">Kategoriyi temizle</option>
                {categories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FilterSelect>
            </div>
          ) : null}

          {action === "location" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="bulk-location-name">Alan Adı</label>
                <Input
                    aria-label="Alan adı"
                    id="bulk-location-name"
                    name="locationName"
                    onChange={(event) => updateField("locationName", event.target.value)}
                    placeholder="Alan adı"
                    value={formState.locationName}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="bulk-shelf-row">Raf</label>
                <Input
                    aria-label="Raf"
                    id="bulk-shelf-row"
                    maxLength={1}
                    name="shelfRow"
                    onChange={(event) => updateField("shelfRow", event.target.value)}
                    placeholder="Raf"
                    value={formState.shelfRow}
                />
              </div>
            </div>
          ) : null}

          {action === "status" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="bulk-status">Durum</label>
              <FilterSelect
                ariaLabel="Toplu durum"
                id="bulk-status"
                onChange={(val) => updateField("status", val)}
                value={formState.status}
              >
                {BULK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FilterSelect>
            </div>
          ) : null}

          {action === "donatable" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="bulk-donatable">Bağışlanabilirlik</label>
              <FilterSelect
                ariaLabel="Toplu bağışlanabilirlik"
                id="bulk-donatable"
                onChange={(val) => updateField("donatable", val)}
                value={formState.donatable}
              >
                <option value="true">Bağışlanabilir yap</option>
                <option value="false">Bağışlanamaz yap</option>
              </FilterSelect>
            </div>
          ) : null}

          {action === "series" ? (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="bulk-series">Seri</label>
                <FilterSelect
                  ariaLabel="Toplu seri"
                  id="bulk-series"
                  onChange={(val) => updateField("seriesId", val)}
                  value={formState.seriesId}
                >
                  <option value="">Seri seç</option>
                  <option value="__none__">Seriyi kaldır</option>
                  {series.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </FilterSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="bulk-series-order">Cilt no</label>
                <Input
                  aria-label="Cilt numarası"
                  id="bulk-series-order"
                  inputMode="numeric"
                  name="seriesOrder"
                  onChange={(event) => updateField("seriesOrder", event.target.value)}
                  placeholder="Cilt no"
                  value={formState.seriesOrder}
                />
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Vazgeç
          </Button>
          <Button disabled={isPending || !action} onClick={submit} variant="primary">
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Uygulanıyor
              </>
            ) : (
              "Değişikliği uygula"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
