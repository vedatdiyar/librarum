"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthorDetailPageClientBackLink, AuthorDetailPageClientContinuitySection, AuthorDetailPageClientDomainSection, AuthorDetailPageClientError, AuthorDetailPageClientHero, AuthorDetailPageClientLoading, AuthorDetailPageClientVolumesSection } from "./author-detail-page-client-sections";
import type { AuthorDetail } from "@/types";
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
        message={authorQuery.error instanceof Error ? authorQuery.error.message : "Bu yetkiliye ait arşiv kaydı alınamadı."}
      />
    );
  }

  const author = authorQuery.data;
  const categoryData = author.categoryDistribution.filter((item) => item.count > 0);

  return (
    <section className="space-y-16 pt-24 pb-40">
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

      <div className="grid gap-12 xl:grid-cols-[1fr_420px]">
        <div className="space-y-12">
          <AuthorDetailPageClientVolumesSection author={author} />
        </div>

        <div className="space-y-12 delay-500 duration-1000 animate-in fade-in fill-mode-both slide-in-from-right-12">
          <AuthorDetailPageClientDomainSection categoryData={categoryData} />

          <AuthorDetailPageClientContinuitySection relatedSeries={author.relatedSeries} />
        </div>
      </div>
    </section>
  );
}
