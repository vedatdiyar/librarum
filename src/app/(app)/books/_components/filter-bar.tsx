"use client";

import * as React from "react";
import { Search, ChevronDown, List, LayoutGrid } from "lucide-react";
import { 
  Input, 
  cn,
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui";
import type {
  AuthorListItem,
  CategoryOption,
  SeriesListItem
} from "@/types";
import type { BooksPageFilterState } from "../_hooks/use-books-page-data";

function FilterSelect({
  id,
  value,
  onChange,
  children,
  ariaLabel,
  label
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
  label: string;
}) {
  return (
    <div className="group relative flex flex-col gap-1.5">
      <label className="px-1 text-[10px] font-bold tracking-[0.2em] text-foreground uppercase" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          aria-label={ariaLabel}
          className="h-11 w-full appearance-none rounded-xl border border-white/5 bg-white/2 px-4 pr-10 text-sm font-medium text-white/80 transition-all duration-300 outline-none hover:border-white/10 hover:bg-white/5 focus:border-primary/40 focus:bg-white/8 focus:ring-1 focus:ring-primary/20"
          id={id}
          name={id}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-foreground transition-colors group-hover:text-primary" />
      </div>
    </div>
  );
}

import { STATUS_OPTIONS } from "@/lib/constants/books";

export function BooksFilterBar({
  filters,
  locations,
  onFilterChange,
  categories,
  authors,
  series,
  view,
  setView
}: {
  filters: BooksPageFilterState;
  locations: string[];
  onFilterChange: (key: keyof BooksPageFilterState, value: string) => void;
  categories: CategoryOption[];
  authors: AuthorListItem[];
  series: SeriesListItem[];
  view: "list" | "grid";
  setView: (view: "list" | "grid") => void;
}) {
  return (
    <div className="glass-panel rounded-2xl border-white/5 bg-white/1 p-6">
      <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
         <div className="flex flex-col gap-1">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/5 bg-white/3 px-2.5 py-1">
               <span className="h-1.5 w-1.5 rounded-full bg-primary" />
               <span className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">Arama Filtreleri</span>
            </div>
            <p className="capitalize-first text-[13px] leading-relaxed text-foreground italic">
               Keşfinizi durum, kategori, yazar, seri ve fiziksel konuma göre daraltın.
            </p>
         </div>

         <div className="flex shrink-0 items-center gap-4">
            <div className="hidden h-4 w-px bg-white/5 lg:block" />
            <Tabs onValueChange={(v) => setView(v as "list" | "grid")} value={view} className="bg-transparent">
              <TabsList className="h-10 rounded-xl border-white/10 bg-white/3 p-1">
                  <TabsTrigger value="list" className="h-8 rounded-lg px-3 text-[10px] font-bold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-black">
                    <List className="mr-2 h-3 w-3" />
                    Liste
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="h-8 rounded-lg px-3 text-[10px] font-bold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-black">
                    <LayoutGrid className="mr-2 h-3 w-3" />
                    Galeri
                  </TabsTrigger>
              </TabsList>
            </Tabs>
         </div>
      </div>

      <div className="grid gap-6">
        {/* All Filters Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            ariaLabel="Duruma göre filtrele"
            id="filter-status"
            label="Durum"
            onChange={(value) => onFilterChange("status", value)}
            value={filters.status}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} className="bg-background" value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Kategoriye göre filtrele"
            id="filter-category"
            label="Kategori"
            onChange={(value) => onFilterChange("category", value)}
            value={filters.category}
          >
            <option className="bg-background" value="">Tüm Kategoriler</option>
            {categories.map((option: CategoryOption) => (
              <option key={option.id} className="bg-background" value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Yazara göre filtrele"
            id="filter-author"
            label="Yazar"
            onChange={(value) => onFilterChange("author", value)}
            value={filters.author}
          >
            <option className="bg-background" value="">Tüm Yazarlar</option>
            {authors.map((option: AuthorListItem) => (
              <option key={option.id} className="bg-background" value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Seriye göre filtrele"
            id="filter-series"
            label="Seri"
            onChange={(value) => onFilterChange("series", value)}
            value={filters.series}
          >
            <option className="bg-background" value="">Tüm Seriler</option>
            {series.map((option: SeriesListItem) => (
              <option key={option.id} className="bg-background" value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Konuma göre filtrele"
            id="filter-location"
            label="Fiziksel Konum"
            onChange={(value) => onFilterChange("location", value)}
            value={filters.location}
          >
            <option className="bg-background" value="">Tüm Konumlar</option>
            {locations.map((loc) => (
              <option key={loc} className="bg-background" value={loc}>
                {loc}
              </option>
            ))}
          </FilterSelect>
        </div>
        </div>
    </div>
  );
}
