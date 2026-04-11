"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthorDetailPageClientBackLink, AuthorDetailPageClientContinuitySection, AuthorDetailPageClientDomainSection, AuthorDetailPageClientError, AuthorDetailPageClientHero, AuthorDetailPageClientLoading, AuthorDetailPageClientVolumesSection } from "./author-detail-page-client-sections";
import type { AuthorDetail } from "@/types";
import { Library } from "lucide-react";
import { readJsonResponse } from "@/lib/shared";

async function fetchAuthorDetail(authorSlug: string) {
  const response = await fetch(`/api/authors/${authorSlug}`);
  return readJsonResponse<AuthorDetail>(response);
}

export function AuthorDetailPageClient({ authorSlug }: { authorSlug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState("");
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const authorQuery = useQuery({
    queryKey: ["author-detail", authorSlug],
    queryFn: () => fetchAuthorDetail(authorSlug)
  });

  React.useEffect(() => {
    if (authorQuery.data) {
      setNameDraft(authorQuery.data.name);
    }
  }, [authorQuery.data]);

  React.useEffect(() => {
    if (isEditing) {
      nameInputRef.current?.focus();
    }
  }, [isEditing]);

  const updateMutation = useMutation({
    mutationFn: async (name: string) =>
      readJsonResponse<{ id: string; name: string; slug: string }>(
        await fetch(`/api/authors/${authorSlug}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ name })
        })
      ),
    onSuccess: (updatedAuthor) => {
      void queryClient.invalidateQueries({ queryKey: ["author-detail", authorSlug] });
      void queryClient.invalidateQueries({ queryKey: ["author-detail", updatedAuthor.slug] });
      void queryClient.invalidateQueries({ queryKey: ["authors"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      setIsEditing(false);
      if (updatedAuthor.slug !== authorSlug) {
        router.replace(`/authors/${updatedAuthor.slug}`);
      }
    }
  });

  if (authorQuery.isLoading) {
    return <AuthorDetailPageClientLoading />;
  }

  if (authorQuery.isError || !authorQuery.data) {
    return (
      <AuthorDetailPageClientError
        message={authorQuery.error instanceof Error ? authorQuery.error.message : "Bu yazara ait bilgiler yüklenemedi."}
      />
    );
  }

  const author = authorQuery.data;
  const categoryData = author.categoryDistribution.filter((item) => item.count > 0);

  return (
    <div className="relative z-10 space-y-12 pb-24">
      <AuthorDetailPageClientBackLink />

      <AuthorDetailPageClientHero
        author={author}
        errorMessage={updateMutation.isError ? updateMutation.error instanceof Error ? updateMutation.error.message : "Yeniden kayıt sırasında orkestrasyon hatası oluştu." : null}
        isEditing={isEditing}
        isPending={updateMutation.isPending}
        nameDraft={nameDraft}
        nameInputRef={nameInputRef}
        onCancel={() => {
          setNameDraft(author.name);
          setIsEditing(false);
        }}
        onStartEditing={() => setIsEditing(true)}
        onSubmit={() => updateMutation.mutate(nameDraft.trim())}
        setNameDraft={setNameDraft}
      />

      <div className="space-y-12">
        <AuthorDetailPageClientVolumesSection author={author} />

        <div className="grid gap-12 delay-500 duration-1000 animate-in fade-in fill-mode-both slide-in-from-right-12 xl:grid-cols-2">
          <AuthorDetailPageClientDomainSection categoryData={categoryData} />
          <AuthorDetailPageClientContinuitySection relatedSeries={author.relatedSeries} />
        </div>
      </div>

      <footer className="relative mt-20 overflow-hidden border-t border-white/5 pt-12">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="space-y-1.5 text-center md:text-left">
              <p className="text-[11px] font-bold tracking-wider text-foreground/40 uppercase">
                Librarum Dijital Kütüphane Sistemi
              </p>
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <span className="text-[10px] font-medium tracking-tighter text-foreground/60 uppercase">Yazar ID:</span>
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-primary/80">
                  {author.slug}
                </code>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <span className="text-[10px] font-bold tracking-[0.2em] text-foreground/40 uppercase">Koleksiyon Verisi</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-2 backdrop-blur-md">
              <Library className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold tracking-wide text-foreground/80">
                {author.bookCount} Kayıtlı Eser
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
