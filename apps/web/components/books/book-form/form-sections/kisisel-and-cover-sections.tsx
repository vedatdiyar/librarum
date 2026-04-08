"use client";

import * as React from "react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import { Button, Input } from "@exlibris/ui";
import { Upload, LoaderCircle } from "lucide-react";
import { RatingInput } from "../rating-input";
import { Field } from "./kunye-section";

const FIELD_CLASS_NAME =
  "flex h-11 w-full rounded-xl border border-border/80 bg-surface px-4 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent/80 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

const TEXTAREA_CLASS_NAME =
  "flex min-h-[120px] w-full rounded-2xl border border-border/80 bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent/80 focus:ring-2 focus:ring-accent/15";

const MONTH_OPTIONS = [
  { value: "", label: "Ay secilmedi" },
  { value: "1", label: "Ocak" },
  { value: "2", label: "Subat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayis" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Agustos" },
  { value: "9", label: "Eylul" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasim" },
  { value: "12", label: "Aralik" }
];

export function KisiselSection() {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const rating = watch("rating");

  return (
    <>
      <Field label="Puan">
        <RatingInput
          onChange={(val) => setValue("rating", val, { shouldDirty: true })}
          value={rating}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Okuma Ayi">
          <select
            aria-label="Okuma Ayi"
            className={FIELD_CLASS_NAME}
            {...register("readMonth")}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value || "empty"} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field error={errors.readYear?.message as string} label="Okuma Yili">
          <Input {...register("readYear")} inputMode="numeric" placeholder="2026" />
        </Field>
      </div>

      <Field label="Not">
        <textarea
          aria-label="Not"
          {...register("personalNote")}
          className={TEXTAREA_CLASS_NAME}
          placeholder="Bu kitapla ilgili kisa notlar..."
        />
      </Field>
    </>
  );
}



export function CoverSection({
  coverPreviewUrl,
  isSubmitting,
  isUploadingCover,
  onUploadClick,
  onRevertClick,
  hasCustomCover
}: {
  coverPreviewUrl: string | null;
  isSubmitting: boolean;
  isUploadingCover: boolean;
  onUploadClick: () => void;
  onRevertClick: () => void;
  hasCustomCover: boolean;
}) {
  const { watch } = useFormContext();
  const title = watch("title");

  return (
    <div className="grid gap-5 lg:grid-cols-[220px,1fr]">
      <div className="overflow-hidden rounded-[24px] border border-border bg-surface">
        <div className="relative aspect-[2/3]">
          {coverPreviewUrl ? (
            <Image
              alt={title || "Kapak onizlemesi"}
              className="object-cover"
              fill
              sizes="220px"
              src={coverPreviewUrl}
            />
          ) : (
            <div className="book-placeholder h-full p-4">
              <p className="font-display text-lg text-text-primary">
                {title || "Kapak onizlemesi"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border/80 bg-surface p-4 text-sm text-text-secondary">
          <p>
            Kaynak:{" "}
            <span className="text-text-primary">
              {hasCustomCover ? "Yuklenen kapak" : coverPreviewUrl ? "Metadata kapagi" : "Kapak secilmedi"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={isSubmitting || isUploadingCover}
            onClick={onUploadClick}
            variant="secondary"
          >
            {isUploadingCover ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploadingCover ? "Yukleniyor..." : "Farkli kapak yukle"}
          </Button>
          <Button
            disabled={!hasCustomCover || isSubmitting || isUploadingCover}
            onClick={onRevertClick}
            variant="ghost"
          >
            Varsayilana don
          </Button>
        </div>
      </div>
    </div>
  );
}
