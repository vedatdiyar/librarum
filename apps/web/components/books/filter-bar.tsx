"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@exlibris/ui";
import type {
  AuthorListItem,
  CategoryOption,
  SeriesListItem,
  TagOption
} from "@exlibris/types";
import type { BooksPageFilterState } from "./use-books-page-data";

function FilterSelect({
  value,
  onChange,
  children,
  ariaLabel
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-11 w-full rounded-xl border border-border/80 bg-surface px-3 text-sm text-text-primary outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {children}
    </select>
  );
}

const STATUS_OPTIONS = [
  { value: "", label: "Tüm durumlar" },
  { value: "owned", label: "Sahibim" },
  { value: "completed", label: "Okudum" },
  { value: "abandoned", label: "Yarım Bıraktım" },
  { value: "loaned", label: "Ödünç Verdim" },
  { value: "lost", label: "Kayıp" }
] as const;

export function BooksFilterBar({
  filters,
  locationDraft,
  setLocationDraft,
  onFilterChange,
  categories,
  tags,
  authors,
  series
}: {
  filters: BooksPageFilterState;
  locationDraft: string;
  setLocationDraft: (value: string) => void;
  onFilterChange: (key: keyof BooksPageFilterState, value: string) => void;
  categories: CategoryOption[];
  tags: TagOption[];
  authors: AuthorListItem[];
  series: SeriesListItem[];
}) {
  return (
    <Card className="rounded-[28px] border-border/60 bg-surface-raised/50 p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr,minmax(max-content,auto)]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            ariaLabel="Durum filtrele"
            onChange={(value) => onFilterChange("status", value)}
            value={filters.status}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Kategori filtrele"
            onChange={(value) => onFilterChange("category", value)}
            value={filters.category}
          >
            <option value="">Tüm kategoriler</option>
            {categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Yazar filtrele"
            onChange={(value) => onFilterChange("author", value)}
            value={filters.author}
          >
            <option value="">Tüm yazarlar</option>
            {authors.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Seri filtrele"
            onChange={(value) => onFilterChange("series", value)}
            value={filters.series}
          >
            <option value="">Tüm seriler</option>
            {series.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FilterSelect
            ariaLabel="Etiket filtrele"
            onChange={(value) => onFilterChange("tag", value)}
            value={filters.tag}
          >
            <option value="">Tüm etiketler</option>
            {tags.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              aria-label="Konum filtrele"
              className="pl-9"
              onChange={(event) => setLocationDraft(event.target.value)}
              placeholder="Konum (Salon, Raf A...)"
              value={locationDraft}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

import { Card } from "@exlibris/ui";
