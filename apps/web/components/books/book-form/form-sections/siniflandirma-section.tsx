"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Badge, Button, Checkbox, Input, cn } from "@librarum/ui";
import { Plus, X } from "lucide-react";
import { SelectionPills } from "../selection-pills";
import { Field } from "./kunye-section";
import type { CategoryOption, TagOption, SeriesOption } from "@librarum/types";

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
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Kategori">
          <select
            aria-label="Kategori"
            className={FIELD_CLASS_NAME}
            {...register("categoryId")}
          >
            <option value="">Kategori secilmedi</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Etiketler">
          <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
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
              onChange={(event) => setTagQuery(event.target.value)}
              placeholder="Etiket ara"
              value={tagQuery}
            />
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => (
                <Button
                  key={tag.id}
                  onClick={() =>
                    setValue("tagIds", [...tagIds, tag.id], { shouldDirty: true })
                  }
                  size="sm"
                  variant="secondary"
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </div>
        </Field>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <label className="flex items-center gap-3">
          <Checkbox
            checked={isSeries}
            onChange={(event) => {
              const nextChecked = event.target.checked;
              setValue("isSeries", nextChecked, { shouldDirty: true });
              if (!nextChecked) {
                setValue("seriesId", "", { shouldDirty: true });
                setValue("seriesName", "", { shouldDirty: true });
                setValue("seriesOrder", "", { shouldDirty: true });
                setValue("seriesTotalVolumes", "", { shouldDirty: true });
              }
            }}
          />
          <span className="text-sm font-medium text-text-primary">Bu bir seri kitabi</span>
        </label>

        {isSeries ? (
          <div className="grid gap-5 lg:grid-cols-[1.2fr,0.7fr,0.5fr]">
            <Field error={errors.seriesName?.message as string} label="Seri Adi">
              <div className="space-y-3">
                {selectedSeries ? (
                  <Badge className="w-fit gap-2" variant="accent">
                    {selectedSeries.name}
                    <button
                      className="rounded-full p-1 transition hover:bg-accent/20"
                      onClick={() => {
                        setValue("seriesId", "", { shouldDirty: true });
                        setValue("seriesName", "", { shouldDirty: true });
                      }}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null}
                <div className="flex gap-3">
                  <Input
                    onChange={(event) => {
                      setSeriesQuery(event.target.value);
                      setValue("seriesName", event.target.value, { shouldDirty: true });
                    }}
                    placeholder="Seri ara veya olustur"
                    value={selectedSeries ? selectedSeries.name : seriesQuery}
                  />
                  <Button
                    disabled={!canCreateSeries || isSubmitting}
                    onClick={() => void createSeries(seriesQuery.trim())}
                    variant="secondary"
                  >
                    Olustur
                  </Button>
                </div>
              </div>
            </Field>

            <Field error={errors.seriesTotalVolumes?.message as string} label="Toplam Cilt">
              <Input
                {...register("seriesTotalVolumes")}
                inputMode="numeric"
                placeholder="Opsiyonel"
              />
            </Field>

            <Field error={errors.seriesOrder?.message as string} label="Cilt No">
              <Input {...register("seriesOrder")} inputMode="numeric" placeholder="1" />
            </Field>
          </div>
        ) : null}
      </div>
    </>
  );
}
