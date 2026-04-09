"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { LoaderCircle, Search } from "lucide-react";
import { Button, Input, cn } from "@/components/ui";
import { MobileBarcodeScanner } from "../mobile-barcode-scanner";
import { SelectionPills } from "../selection-pills";
import type { AuthorOption } from "@/types";

const FIELD_CLASS_NAME =
  "flex h-11 w-full rounded-xl border border-border/80 bg-surface px-4 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent/80 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

export function Field({
  label,
  hint,
  description,
  error,
  children
}: {
  label: string;
  hint?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-0.5">
        <label className="text-[13px] font-bold uppercase tracking-wider text-text-primary/90">
          {label}
        </label>
        {hint ? <span className="text-[11px] font-medium text-text-secondary/60 italic">{hint}</span> : null}
      </div>
      {description ? (
        <p className="px-0.5 text-xs leading-relaxed text-text-secondary/70">
          {description}
        </p>
      ) : null}
      <div className="mt-1">
        {children}
      </div>
      {error ? (
        <p className="mt-1 px-0.5 text-xs font-medium text-destructive/90 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function KunyeSection({
  metadataState,
  fetchMetadata,
  isSubmitting,
  authors,
  authorQuery,
  setAuthorQuery,
  canCreateAuthor,
  createAuthor
}: {
  metadataState: any;
  fetchMetadata: (isbn: string, auto?: boolean) => Promise<void>;
  isSubmitting: boolean;
  authors: AuthorOption[];
  authorQuery: string;
  setAuthorQuery: (v: string) => void;
  canCreateAuthor: boolean;
  createAuthor: (name: string) => Promise<void>;
}) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const authorIds = watch("authorIds") || [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Field
          description="Kitabın arkasındaki barkod numarasını girin."
          error={errors.isbn?.message as string}
          hint={metadataState.status === "loading" ? "Otomatik çekiliyor..." : undefined}
          label="ISBN Numarası"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Input
                className="bg-surface pr-11"
                {...register("isbn")}
                onBlur={(event) => {
                  register("isbn").onBlur(event);
                  void fetchMetadata(event.target.value);
                }}
                placeholder="978..."
              />
              {metadataState.status === "loading" && (
                <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
              )}
            </div>
            <MobileBarcodeScanner
              disabled={isSubmitting}
              onDetected={(isbn) => {
                setValue("isbn", isbn, { shouldDirty: true });
                void fetchMetadata(isbn, true);
              }}
            />
          </div>
        </Field>

        <Field 
          description="Meta verilerden çekilir veya elle girilebilir."
          error={errors.title?.message as string} 
          label="Kitap Başlığı"
        >
          <Input className="bg-surface" {...register("title")} placeholder="Asıl başlık..." />
        </Field>
      </div>

      <Field 
        description="Birden fazla yazar eklenebilir."
        error={errors.authorIds?.message as string} 
        label="Yazar Bilgisi"
      >
        <div className="space-y-4 rounded-[22px] border border-border/60 bg-surface/40 p-5 transition-all hover:bg-surface/60">
          <SelectionPills
            items={authors}
            onRemove={(authorId) =>
              setValue(
                "authorIds",
                authorIds.filter((id: string) => id !== authorId),
                { shouldDirty: true, shouldValidate: true }
              )
            }
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
              <input
                aria-label="Yazar ara"
                className={cn(FIELD_CLASS_NAME, "bg-surface/50 pl-9 transition-colors focus:bg-surface")}
                onChange={(event) => setAuthorQuery(event.target.value)}
                placeholder="Yazar ara veya yeni oluştur..."
                value={authorQuery}
              />
            </div>
            <Button
              className="shrink-0"
              disabled={!canCreateAuthor || isSubmitting}
              onClick={() => void createAuthor(authorQuery.trim())}
              variant="secondary"
            >
              Ekle
            </Button>
          </div>
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field 
          description="Basım evi."
          error={errors.publisher?.message as string} 
          label="Yayınevi"
        >
          <Input className="bg-surface" {...register("publisher")} placeholder="Yayınevi" />
        </Field>
        <Field 
          description="Yılı girin."
          error={errors.publicationYear?.message as string} 
          label="Yayın Yılı"
        >
          <Input className="bg-surface" {...register("publicationYear")} inputMode="numeric" placeholder="2024" />
        </Field>
        <Field 
          description="Toplam sayfa."
          error={errors.pageCount?.message as string} 
          label="Sayfa"
        >
          <Input className="bg-surface" {...register("pageCount")} inputMode="numeric" placeholder="320" />
        </Field>
      </div>
    </div>
  );
}
