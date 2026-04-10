"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { LoaderCircle, Search, Hash, BookOpen, ScanSearch } from "lucide-react";
import { Input, Button } from "@/components/ui";
import type { MetadataState } from "../use-isbn-metadata";
import { MobileBarcodeScanner } from "../mobile-barcode-scanner";
import { SelectionPills } from "../selection-pills";
import type { AuthorOption } from "@/types";

export function Field({
  id,
  label,
  hint,
  description,
  error,
  children
}: {
  id?: string;
  label: string;
  hint?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group/field flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
          <label className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase transition-colors group-focus-within/field:text-primary" htmlFor={id}>
            {label}
          </label>
          {hint ? <span className="text-[10px] font-bold tracking-widest text-primary uppercase italic">{hint}</span> : null}
        </div>

        {description ? (
          <p className="px-1 text-[11px] leading-relaxed text-foreground italic">
            {description}
          </p>
        ) : null}
      </div>
      
      <div className="relative">
        {children}
      </div>

      {error ? (
        <p className="px-1 text-[10px] font-bold tracking-tight text-rose-400 uppercase animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PublicationSection({
  addAuthorById,
  removeDraftAuthorName,
  availableAuthors,
  metadataState,
  fetchMetadata,
  isSubmitting,
  authors,
  draftAuthorNames,
  authorQuery,
  pendingAuthorSuggestions,
  resolveSuggestedAuthor,
  setAuthorQuery,
  canCreateAuthor,
  createAuthor
}: {
  addAuthorById: (authorId: string) => void;
  removeDraftAuthorName: (name: string) => void;
  availableAuthors: AuthorOption[];
  metadataState: MetadataState;
  fetchMetadata: (isbn: string) => Promise<void>;
  isSubmitting: boolean;
  authors: AuthorOption[];
  draftAuthorNames: string[];
  authorQuery: string;
  pendingAuthorSuggestions: Array<{
    inputName: string;
    suggestedAuthor: AuthorOption;
  }>;
  resolveSuggestedAuthor: (
    suggestion: {
      inputName: string;
      suggestedAuthor: AuthorOption;
    },
    decision: "same_author" | "new_author"
  ) => Promise<void>;
  setAuthorQuery: (v: string) => void;
  canCreateAuthor: boolean;
  createAuthor: (name: string) => Promise<void>;
}) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const authorIds = watch("authorIds") || [];
  const titleSubtitleInputClassName =
    "h-12 min-h-12 max-h-12 rounded-xl border-white/5 bg-white/2 px-4 py-0 text-sm leading-none shadow-inner hover:bg-white/4 focus:bg-white/8";

  return (
    <div className="space-y-12 duration-700 animate-in fade-in">
      <div className="space-y-10">
        <Field
          description="ISBN girip kontrol düğmesine bastığınızda başlık, yayınevi, yıl ve yazar bilgileri doldurulur; Google Books ve Open Library kapakları seçenek olarak gelir."
          error={errors.isbn?.message as string}
          hint={metadataState.status === "loading" ? "Kontrol ediliyor..." : undefined}
          id="isbn"
          label="ISBN NUMARASI"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Hash className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground" />
              <Input
                className="h-14 rounded-2xl border-white/5 bg-white/2 pr-28 pl-12 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8"
                {...register("isbn")}
                id="isbn"
                placeholder="978..."
              />
              <Button
                className="absolute top-1.5 right-1.5 h-11 rounded-xl bg-white px-4 text-[10px] font-bold tracking-widest text-black uppercase transition-all hover:bg-primary"
                disabled={isSubmitting || metadataState.status === "loading"}
                onClick={() => void fetchMetadata(watch("isbn") ?? "")}
                type="button"
              >
                {metadataState.status === "loading" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Tara
                  </>
                )}
              </Button>
              {metadataState.status === "loading" && (
                <LoaderCircle className="pointer-events-none absolute top-1/2 right-24 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
              )}
            </div>
            <MobileBarcodeScanner
              disabled={isSubmitting}
              onDetected={(isbn) => {
                setValue("isbn", isbn, { shouldDirty: true });
                void fetchMetadata(isbn);
              }}
            />
          </div>

          {metadataState.message ? (
            <div className="mt-3 rounded-2xl border border-white/5 bg-white/3 px-4 py-3">
              <p className="text-[11px] leading-relaxed text-foreground">
                {metadataState.message}
              </p>
            </div>
          ) : null}
        </Field>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {[
            {
              name: "title" as const,
              label: "KİTAP ADI",
              description: "Kayda geçen eserin ana başlığı.",
              placeholder: "Kitap adı...",
              error: errors.title?.message as string | undefined
            },
            {
              name: "subtitle" as const,
              label: "ALT BAŞLIK",
              description: "Eserin alt başlığı veya cilt bilgisi.",
              placeholder: "Alt başlık / cilt bilgisi",
              error: errors.subtitle?.message as string | undefined
            }
          ].map((field) => (
            <div className="min-w-0" key={field.name}>
              <Field
                description={field.description}
                error={field.error}
                id={field.name}
                label={field.label}
              >
                <Input
                  className={titleSubtitleInputClassName}
                  {...register(field.name)}
                  id={field.name}
                  placeholder={field.placeholder}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <Field 
        description="Yazar bilgilerini atayın. Yeni yazar adları kitap kaydedildiğinde veritabanına yazılır."
        error={errors.authorIds?.message as string} 
        label="YAZARLAR"
      >
        <div className="glass-panel space-y-6 rounded-3xl border-white/5 bg-white/1 p-8 transition-all group-hover:border-white/10">
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
          {draftAuthorNames.length > 0 ? (
            <SelectionPills
              items={draftAuthorNames.map((name) => ({ id: `draft:${name}`, name }))}
              onRemove={(id) => {
                const name = id.replace(/^draft:/, "");
                removeDraftAuthorName(name);
              }}
            />
          ) : null}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground" />
              <input
                aria-label="Yazar Ara"
                className="h-12 w-full rounded-xl border border-white/5 bg-white/3 pl-12 text-sm text-white transition-all outline-none placeholder:text-foreground focus:border-primary/40 focus:bg-white/6"
                onChange={(event) => setAuthorQuery(event.target.value)}
                placeholder="Yazar ara veya taslağa ekle..."
                value={authorQuery}
              />
            </div>
            <Button
              className="h-12 shrink-0 rounded-xl bg-white px-6 text-[10px] font-bold tracking-widest text-black uppercase transition-all hover:bg-primary"
              disabled={!canCreateAuthor || isSubmitting}
              onClick={() => void createAuthor(authorQuery.trim())}
              variant="secondary"
            >
              Taslağa Ekle
            </Button>
          </div>

          {availableAuthors.length > 0 ? (
            <div className="space-y-3 rounded-2xl border border-white/5 bg-white/2 p-4">
              <p className="text-[10px] font-bold tracking-[0.24em] text-foreground/60 uppercase">
                Mevcut Yazarlar
              </p>
              <div className="flex flex-wrap gap-2">
                {availableAuthors.slice(0, 8).map((author) => (
                  <button
                    key={author.id}
                    className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white transition-colors hover:border-primary/30 hover:bg-primary/10"
                    onClick={() => addAuthorById(author.id)}
                    type="button"
                  >
                    {author.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {pendingAuthorSuggestions.length > 0 ? (
            <div className="space-y-3 rounded-2xl border border-amber-300/15 bg-amber-400/6 p-4">
              <p className="text-[10px] font-bold tracking-[0.24em] text-amber-200 uppercase">
                Eşleşme Önerileri
              </p>
              <div className="space-y-3">
                {pendingAuthorSuggestions.map((suggestion) => (
                  <div
                    key={`${suggestion.inputName}-${suggestion.suggestedAuthor.id}`}
                    className="rounded-2xl border border-white/8 bg-black/15 p-4"
                  >
                    <p className="text-sm leading-relaxed text-white/85">
                      <span className="font-semibold">{suggestion.inputName}</span> için mevcut
                      kayıt olarak <span className="font-semibold">{suggestion.suggestedAuthor.name}</span> bulundu.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="h-10 rounded-xl bg-white px-4 text-[10px] font-bold tracking-widest text-black uppercase hover:bg-primary"
                        disabled={isSubmitting}
                        onClick={() => void resolveSuggestedAuthor(suggestion, "same_author")}
                        type="button"
                      >
                        Aynı Yazar
                      </Button>
                      <Button
                        className="h-10 rounded-xl border-white/10 bg-white/4 px-4 text-[10px] font-bold tracking-widest text-white uppercase hover:bg-white/8"
                        disabled={isSubmitting}
                        onClick={() => void resolveSuggestedAuthor(suggestion, "new_author")}
                        type="button"
                        variant="secondary"
                      >
                        Ayrı Yazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Field>

      <div className="grid gap-8 md:grid-cols-3">
        <Field 
          description="Yayınevinin arşiv kaydı."
          error={errors.publisher?.message as string} 
          id="publisher"
          label="YAYINEVİ"
        >
          <Input 
            className="h-12 rounded-xl border-white/5 bg-white/2 text-sm shadow-inner hover:bg-white/4 focus:bg-white/8" 
            {...register("publisher")} 
            id="publisher"
            placeholder="Yayınevi adı" 
          />
        </Field>
        <Field 
          description="Kitabın yayın yılı."
          error={errors.publicationYear?.message as string} 
          id="publicationYear"
          label="YAYIN YILI"
        >
          <Input 
            className="h-12 rounded-xl border-white/5 bg-white/2 text-sm shadow-inner hover:bg-white/4 focus:bg-white/8" 
            {...register("publicationYear")} 
            id="publicationYear"
            inputMode="numeric" 
            placeholder="Yıl" 
          />
        </Field>
        <Field 
          description="Kitabın sayfa sayısı."
          error={errors.pageCount?.message as string} 
          id="pageCount"
          label="SAYFA SAYISI"
        >
          <div className="relative">
             <BookOpen className="absolute top-1/2 right-4 h-3.5 w-3.5 -translate-y-1/2 text-foreground" />
             <Input 
                className="h-12 rounded-xl border-white/5 bg-white/2 text-sm shadow-inner hover:bg-white/4 focus:bg-white/8" 
                {...register("pageCount")} 
                id="pageCount"
                inputMode="numeric" 
                placeholder="Sayfa" 
             />
          </div>
        </Field>
      </div>
    </div>
  );
}
