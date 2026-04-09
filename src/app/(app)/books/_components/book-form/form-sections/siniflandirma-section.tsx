"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Badge, Button, Checkbox, Input, cn } from "@/components/ui";
import { Plus, X } from "lucide-react";
import { SelectionPills } from "../selection-pills";
import { Field } from "./kunye-section";
import type { CategoryOption, TagOption, SeriesOption } from "@/types";

const FIELD_CLASS_NAME =
  "flex h-11 w-full rounded-xl border border-border/80 bg-surface px-4 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent/80 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

export function SiniflandirmaSection({
  categories,
  tags,
  tagQuery,
  setTagQuery,
  filteredTags,
  selectedTags,
  series,
  seriesQuery,
  setSeriesQuery,
  filteredSeries,
  selectedSeries,
  canCreateSeries,
  createSeries,
  isSubmitting
}: {
  categories: CategoryOption[];
  tags: TagOption[];
  tagQuery: string;
  setTagQuery: (v: string) => void;
  filteredTags: TagOption[];
  selectedTags: TagOption[];
  series: SeriesOption[];
  seriesQuery: string;
  setSeriesQuery: (v: string) => void;
  filteredSeries: SeriesOption[];
  selectedSeries: SeriesOption | null;
  canCreateSeries: boolean;
  createSeries: (name: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const tagIds = watch("tagIds") || [];
  const isSeries = watch("isSeries") || false;
  const seriesId = watch("seriesId");

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field 
          label="Kategori" 
          description="Kitabın hangi ana kategoriye ait olduğunu belirtin."
        >
          <select
            aria-label="Kategori"
            className={cn(FIELD_CLASS_NAME, "cursor-pointer appearance-none bg-surface")}
            {...register("categoryId")}
          >
            <option value="">Kategori seçilmedi</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field 
          label="Etiketler" 
          description="Arama ve filtreleme için anahtar kelimeler ekleyin."
        >
          <div className="space-y-4 rounded-2xl border border-border/60 bg-surface/50 p-4 transition-colors hover:bg-surface/80">
            <SelectionPills
              items={selectedTags}
              onRemove={(tagId) =>
                setValue(
                  "tagIds",
                  tagIds.filter((id: string) => id !== tagId),
                  { shouldDirty: true }
                )
              }
            />
            <Input
              className="bg-surface/50"
              onChange={(event) => setTagQuery(event.target.value)}
              placeholder="Etiket ara..."
              value={tagQuery}
            />
            {filteredTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {filteredTags.map((tag) => (
                  <Button
                    key={tag.id}
                    className="h-8 rounded-lg px-3 text-xs"
                    onClick={() =>
                      setValue("tagIds", [...tagIds, tag.id], { shouldDirty: true })
                    }
                    size="sm"
                    variant="secondary"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {tag.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Field>
      </div>

      <div className="rounded-[22px] border border-border/60 bg-surface/40 p-5 transition-all hover:bg-surface/60">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={isSeries}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const nextChecked = e.target.checked;
              setValue("isSeries", nextChecked, { shouldDirty: true });
              if (!nextChecked) {
                setValue("seriesId", "", { shouldDirty: true });
                setValue("seriesName", "", { shouldDirty: true });
                setValue("seriesOrder", "", { shouldDirty: true });
                setValue("seriesTotalVolumes", "", { shouldDirty: true });
              }
            }}
          />
          <span className="text-[13px] font-bold uppercase tracking-wider text-text-primary">Bu bir seri kitabı</span>
        </label>

        {isSeries && (
          <div className="mt-6 grid gap-6 animate-in fade-in slide-in-from-top-2 lg:grid-cols-[1.4fr,1fr,0.6fr]">
            <Field 
              error={errors.seriesName?.message as string} 
              label="Seri Adı"
              description="Kitabın ait olduğu seriyi seçin."
            >
              <div className="space-y-3">
                {selectedSeries && (
                  <Badge className="w-fit gap-2 py-1 px-3 text-[11px] font-bold uppercase tracking-wide" variant="accent">
                    {selectedSeries.name}
                    <button
                      className="rounded-full p-0.5 transition hover:bg-foreground/10"
                      onClick={() => {
                        setValue("seriesId", "", { shouldDirty: true });
                        setValue("seriesName", "", { shouldDirty: true });
                      }}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <div className="flex gap-2">
                  <Input
                    className="bg-surface"
                    onChange={(event) => {
                      setSeriesQuery(event.target.value);
                      setValue("seriesName", event.target.value, { shouldDirty: true });
                    }}
                    placeholder="Seri ara veya oluştur..."
                    value={selectedSeries ? selectedSeries.name : seriesQuery}
                  />
                  <Button
                    className="shrink-0"
                    disabled={!canCreateSeries || isSubmitting}
                    onClick={() => void createSeries(seriesQuery.trim())}
                    variant="secondary"
                  >
                    Oluştur
                  </Button>
                </div>
              </div>
            </Field>

            <Field 
              error={errors.seriesTotalVolumes?.message as string} 
              label="Toplam Cilt"
              description="Serideki toplam kitap sayısı."
            >
              <Input
                className="bg-surface"
                {...register("seriesTotalVolumes")}
                inputMode="numeric"
                placeholder="Opsiyonel"
              />
            </Field>

            <Field 
              error={errors.seriesOrder?.message as string} 
              label="No"
              description="Bu kitabın sırası."
            >
              <Input 
                className="bg-surface"
                {...register("seriesOrder")} 
                inputMode="numeric" 
                placeholder="1" 
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
