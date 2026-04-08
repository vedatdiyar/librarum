"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { LoaderCircle, Search } from "lucide-react";
import { Button, Input, cn } from "@exlibris/ui";
import { MobileBarcodeScanner } from "@/components/books/mobile-barcode-scanner";
import { SelectionPills } from "../selection-pills";
import type { AuthorOption } from "@exlibris/types";

const FIELD_CLASS_NAME =
  "flex h-11 w-full rounded-xl border border-border/80 bg-surface px-4 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent/80 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {hint ? <span className="text-xs text-text-secondary">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </label>
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
    <>
      <div className="grid gap-5 lg:grid-cols-[1.4fr,1fr]">
        <Field
          error={errors.isbn?.message as string}
          hint={metadataState.status === "loading" ? "Metadata aranıyor" : undefined}
          label="ISBN"
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  {...register("isbn")}
                  className="pr-11"
                  onBlur={(event) => {
                    register("isbn").onBlur(event);
                    void fetchMetadata(event.target.value);
                  }}
                  placeholder="978..."
                />
                {metadataState.status === "loading" ? (
                  <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent" />
                ) : null}
              </div>
              <MobileBarcodeScanner
                disabled={isSubmitting}
                onDetected={(isbn) => {
                  setValue("isbn", isbn, { shouldDirty: true });
                  void fetchMetadata(isbn, true);
                }}
              />
            </div>
          </div>
        </Field>

        <Field error={errors.title?.message as string} label="Baslik">
          <Input {...register("title")} placeholder="Kitap basligi" />
        </Field>
      </div>

      <Field error={errors.authorIds?.message as string} label="Yazar(lar)">
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
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
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                aria-label="Yazar ara"
                className={cn(FIELD_CLASS_NAME, "pl-9")}
                onChange={(event) => setAuthorQuery(event.target.value)}
                placeholder="Yazar ara veya yeni olustur"
                value={authorQuery}
              />
            </div>
            <Button
              disabled={!canCreateAuthor || isSubmitting}
              onClick={() => void createAuthor(authorQuery.trim())}
              variant="secondary"
            >
              Olustur
            </Button>
          </div>
        </div>
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field error={errors.publisher?.message as string} label="Yayinevi">
          <Input {...register("publisher")} placeholder="Yayinevi" />
        </Field>
        <Field error={errors.publicationYear?.message as string} label="Yayin Yili">
          <Input {...register("publicationYear")} inputMode="numeric" placeholder="2024" />
        </Field>
        <Field error={errors.pageCount?.message as string} label="Sayfa Sayisi">
          <Input {...register("pageCount")} inputMode="numeric" placeholder="320" />
        </Field>
      </div>
    </>
  );
}
