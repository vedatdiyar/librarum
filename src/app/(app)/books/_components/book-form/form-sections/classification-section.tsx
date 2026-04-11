"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import { Button, Checkbox, Input } from "@/components/ui";
import type { CategoryOption, SeriesOption } from "@/types";
import { Field } from "./publication-info-section";

type ClassificationSectionProps = {
  categories: CategoryOption[];
  categoryQuery: string;
  setCategoryQuery: (value: string) => void;
  canCreateCategory: boolean;
  createCategory: (name: string) => Promise<void>;
  series: SeriesOption[];
  selectedSeries: SeriesOption | null;
  seriesQuery: string;
  setSeriesQuery: (value: string) => void;
  canCreateSeries: boolean;
  createSeries: (name: string) => Promise<void>;
  isSubmitting: boolean;
};

export function ClassificationSection({
  categories,
  categoryQuery,
  setCategoryQuery,
  canCreateCategory,
  createCategory,
  series,
  selectedSeries,
  seriesQuery,
  setSeriesQuery,
  canCreateSeries,
  createSeries,
  isSubmitting
}: ClassificationSectionProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext();

  const isSeries = watch("isSeries") || false;
  const currentSeriesId = watch("seriesId") || "";

  const filteredSeries = React.useMemo(() => {
    const normalizedQuery = seriesQuery.trim().toLocaleLowerCase("tr-TR");
    return series
      .filter((item) => item.id !== currentSeriesId)
      .filter((item) => {
        if (!normalizedQuery) return true;
        return item.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [currentSeriesId, series, seriesQuery]);

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <Field
          description="Kitabın katalog kategorisini belirleyin."
          error={errors.categoryId?.message as string}
          id="categoryId"
          label="KATEGORİ"
        >
          <div className="space-y-3">
            <select
              aria-label="Kategori"
              className="h-12 w-full rounded-xl border border-white/5 bg-white/2 px-4 text-sm text-white transition-all outline-none hover:bg-white/4 focus:border-primary/40 focus:bg-white/8"
              {...register("categoryId")}
              id="categoryId"
            >
              <option className="bg-background text-foreground" value="">
                Kategori seçilmedi
              </option>
              {categories.map((category) => (
                <option
                  className="bg-background text-foreground"
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                className="h-12 rounded-xl border-white/5 bg-white/2 shadow-inner hover:bg-white/4 focus:bg-white/8"
                id="categoryQuery"
                name="categoryQuery"
                onChange={(event) => setCategoryQuery(event.target.value)}
                placeholder="Yeni kategori adı..."
                value={categoryQuery}
              />
              <Button
                className="h-12 shrink-0 rounded-xl bg-white px-6 text-[10px] font-bold tracking-widest text-black uppercase transition-all hover:bg-primary"
                disabled={!canCreateCategory || isSubmitting}
                onClick={() => void createCategory(categoryQuery.trim())}
                type="button"
              >
                Kategori Ekle
              </Button>
            </div>
          </div>
        </Field>

        <Field
          description="Bu kitap bir seriye aitse seriyi seçin veya yeni seri oluşturun."
          error={errors.seriesName?.message as string}
          id="seriesName"
          label="SERİ"
        >
          <div className="space-y-4 rounded-2xl border border-white/8 bg-white/3 p-4">
            <label className="flex items-center gap-3">
              <Checkbox
                aria-label="Bu bir seri kitabı"
                checked={isSeries}
                onCheckedChange={(checked) => {
                  setValue("isSeries", checked, { shouldDirty: true });

                  if (!checked) {
                    setValue("seriesId", "", { shouldDirty: true });
                    setValue("seriesName", "", { shouldDirty: true });
                    setSeriesQuery("");
                    setValue("seriesOrder", "", { shouldDirty: true });
                    setValue("seriesTotalVolumes", "", { shouldDirty: true });
                  }
                }}
              />
              <span className="text-xs font-bold tracking-widest text-foreground uppercase">
                Bu kitap bir seriye ait
              </span>
            </label>

            {isSeries ? (
              <div className="space-y-4">
                {selectedSeries ? (
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <span className="truncate text-xs font-semibold text-white">{selectedSeries.name}</span>
                    <button
                      className="rounded-full p-0.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      onClick={() => {
                        setValue("seriesId", "", { shouldDirty: true, shouldValidate: true });
                        setValue("seriesName", "", { shouldDirty: true });
                        setSeriesQuery("");
                      }}
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    className="h-12 rounded-xl border-white/5 bg-white/2 shadow-inner hover:bg-white/4 focus:bg-white/8"
                    id="seriesName"
                    name="seriesName"
                    onChange={(event) => {
                      setSeriesQuery(event.target.value);
                      setValue("seriesName", event.target.value, { shouldDirty: true });
                    }}
                    placeholder="Seri ara veya oluştur..."
                    value={selectedSeries ? selectedSeries.name : seriesQuery}
                  />
                  <Button
                    className="h-12 shrink-0 rounded-xl bg-white px-6 text-[10px] font-bold tracking-widest text-black uppercase transition-all hover:bg-primary"
                    disabled={!canCreateSeries || isSubmitting}
                    onClick={() => void createSeries(seriesQuery.trim())}
                    type="button"
                  >
                    Seri Ekle
                  </Button>
                </div>

                {filteredSeries.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredSeries.map((item) => (
                      <button
                        className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white transition-colors hover:border-primary/30 hover:bg-primary/10"
                        key={item.id}
                        onClick={() => {
                          setValue("seriesId", item.id, { shouldDirty: true, shouldValidate: true });
                          setValue("seriesName", item.name, { shouldDirty: true });
                          setSeriesQuery("");
                        }}
                        type="button"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    description="Serideki toplam kitap sayısı (opsiyonel)."
                    error={errors.seriesTotalVolumes?.message as string}
                    id="seriesTotalVolumes"
                    label="TOPLAM CİLT"
                  >
                    <Input
                      className="h-12 rounded-xl border-white/5 bg-white/2 text-sm shadow-inner hover:bg-white/4 focus:bg-white/8"
                      {...register("seriesTotalVolumes")}
                      id="seriesTotalVolumes"
                      inputMode="numeric"
                      placeholder="Opsiyonel"
                    />
                  </Field>

                  <Field
                    description="Bu kitabın serideki sırasını belirtin."
                    error={errors.seriesOrder?.message as string}
                    id="seriesOrder"
                    label="SERİ SIRASI"
                  >
                    <Input
                      className="h-12 rounded-xl border-white/5 bg-white/2 text-sm shadow-inner hover:bg-white/4 focus:bg-white/8"
                      {...register("seriesOrder")}
                      id="seriesOrder"
                      inputMode="numeric"
                      placeholder="1"
                    />
                  </Field>
                </div>
              </div>
            ) : null}
          </div>
        </Field>
      </div>
    </div>
  );
}