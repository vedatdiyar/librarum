"use client";

import * as React from "react";
import Image from "next/image";
import { Controller, useFormContext } from "react-hook-form";
import type { IsbnCoverOption } from "@/types";
import { 
  Button, 
  Input, 
  cn, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui";
import {
  Upload,
  LoaderCircle,
  Calendar,
  Quote,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { RatingInput } from "../rating-input";
import { Field } from "./publication-info-section";

const MONTH_OPTIONS = [
  { value: "0", label: "Ay Atanmamış" },
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" }
];

export function PersonalSection() {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext();
  const rating = watch("rating");

  return (
    <div className="space-y-12">
      <Field id="rating" label="DEĞERLENDİRME PUANI" description="Kitabı 0.0 ile 5.0 arasında puanlayın.">
        <div className="pt-2">
          <RatingInput
            onChange={(val) => setValue("rating", val, { shouldDirty: true })}
            value={rating}
          />
        </div>
      </Field>

      <div className="grid gap-10 md:grid-cols-2">
        <Field id="readMonth" label="OKUMA AYI" description="Kitabın tamamlandığı ayı seçin.">
          <Controller
            control={control}
            name="readMonth"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || "0"}>
                <SelectTrigger id="readMonth" className="h-14 rounded-2xl border-white/5 bg-white/2 pl-12 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8">
                  <Calendar className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground" />
                  <SelectValue placeholder="Ay seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field 
          error={errors.readYear?.message as string} 
          id="readYear"
          label="OKUMA YILI"
          description="Okumanın tamamlandığı yıl (örn. 2026)."
        >
          <div className="relative">
            <Calendar className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input 
                className="h-14 rounded-2xl border-white/5 bg-white/2 pl-12 shadow-inner transition-all placeholder:italic hover:bg-white/4 focus:border-primary/40 focus:bg-white/8" 
                {...register("readYear")} 
                id="readYear"
                inputMode="numeric" 
                placeholder="2026" 
            />
          </div>
        </Field>
      </div>

      <Field id="personalNote" label="KİTAP NOTLARI" description="Kitap hakkındaki düşüncelerinizi, favori alıntılarınızı veya önemli notlarınızı buraya ekleyin.">
        <div className="relative">
            <Quote className="absolute top-6 left-6 h-5 w-5 text-primary" />
            <textarea
                aria-label="Yankı Notu"
                {...register("personalNote")}
                className="flex min-h-[160px] w-full resize-none rounded-[32px] border border-white/5 bg-white/2 py-6 pr-8 pl-16 text-sm text-white shadow-inner transition-all outline-none placeholder:text-foreground placeholder:italic focus:border-primary/40 focus:bg-white/4"
                id="personalNote"
                placeholder="Kitap hakkındaki düşüncelerinizi veya önemli alıntıları buraya ekleyin..."
            />
        </div>
      </Field>
    </div>
  );
}

export function CoverSection({
  coverPreviewUrl,
  metadataCoverOptions,
  selectedMetadataCoverUrl,
  onSelectMetadataCover,
  isSubmitting,
  isUploadingCover,
  onUploadClick,
  onRevertClick,
  hasCustomCover
}: {
  coverPreviewUrl: string | null;
  metadataCoverOptions: IsbnCoverOption[];
  selectedMetadataCoverUrl: string | null;
  onSelectMetadataCover: (url: string) => void;
  isSubmitting: boolean;
  isUploadingCover: boolean;
  onUploadClick: () => void;
  onRevertClick: () => void;
  hasCustomCover: boolean;
}) {
  const { watch } = useFormContext();
  const title = watch("title");

  return (
    <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
      <div className="group/cover relative aspect-2/3 overflow-hidden rounded-[32px] border border-white/10 bg-white/2 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.6)] transition-all duration-700 hover:scale-[1.02] hover:border-white/20">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-30" />
        {coverPreviewUrl ? (
          <>
            <Image alt="" className="shrink-0 object-cover opacity-40 blur-2xl" fill sizes="(max-width: 1023px) 75vw, 360px" src={coverPreviewUrl} />
            <Image
              alt={title || "Kitap Önizleme"}
              className="relative rounded-xl object-contain transition-transform duration-700"
              fill
              quality={90}
              sizes="(max-width: 1023px) 75vw, 360px"
              src={coverPreviewUrl}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-white/1 p-8 text-center">
            <ImageIcon className="mb-4 h-12 w-12 text-foreground" />
            <p className="font-serif text-xl leading-tight font-bold tracking-tight text-white/20 uppercase">
              {title || "Kitap Künyesi"}
            </p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-700 group-hover/cover:opacity-100" />
      </div>

      <div className="flex flex-col justify-center space-y-8">
        <div className="glass-panel rounded-3xl border-white/5 bg-white/1 p-8 shadow-inner">
           <div className="mb-2 flex items-center gap-3">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <p className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase">Görsel Kaynağı</p>
           </div>
           <p className="font-serif text-lg font-bold tracking-tight text-white/60">
            {hasCustomCover ? "Elle Eklenen Kapak" : coverPreviewUrl ? "Üstveriden Alınan Kapak" : "Henüz Kapak Atanmadı"}
           </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            className="h-12 rounded-2xl bg-white px-8 text-[10px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary"
            disabled={isSubmitting || isUploadingCover}
            onClick={onUploadClick}
            variant="secondary"
          >
            {isUploadingCover ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploadingCover ? "Yükleniyor..." : "Kapak Görseli Yükle"}
          </Button>
          <Button
            className="h-12 rounded-2xl border-white/5 bg-white/3 px-8 text-[10px] font-bold tracking-widest text-white/40 uppercase transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            disabled={!hasCustomCover || isSubmitting || isUploadingCover}
            onClick={onRevertClick}
            variant="ghost"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Varsayılana Dön
          </Button>
        </div>

        {metadataCoverOptions.length > 0 ? (
          <div className="space-y-3 rounded-3xl border border-white/8 bg-white/2 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold tracking-[0.24em] text-foreground uppercase">
                Önerilen Kapaklar
              </p>
              {hasCustomCover ? (
                <p className="text-[10px] text-foreground/70">
                  Not: Özel kapak aktifken seçim önizlemeyi etkilemez.
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {metadataCoverOptions.map((option) => {
                const isSelected = selectedMetadataCoverUrl === option.url;

                return (
                  <button
                    key={`${option.source}-${option.url}`}
                    className={cn(
                      "group/option flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary/45 bg-primary/12"
                        : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/8"
                    )}
                    disabled={isSubmitting || isUploadingCover}
                    onClick={() => onSelectMetadataCover(option.url)}
                    type="button"
                  >
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                      <Image alt="" className="object-cover opacity-30 blur-sm" fill sizes="48px" src={option.url} />
                      <Image
                        alt={`${option.label} kapak adayı`}
                        className="relative object-contain"
                        fill
                        sizes="48px"
                        src={option.url}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{option.label}</p>
                      <p className="mt-1 text-[11px] text-foreground/70">
                        {isSelected ? "Seçili" : "Seçmek için tıklayın"}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
