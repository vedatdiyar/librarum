"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  Check,
  LoaderCircle,
  Pencil,
  Star,
  X
} from "lucide-react";
import dynamic from "next/dynamic";
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@librarum/ui";
import { cn } from "@librarum/ui";
import type { AuthorDetail } from "@librarum/types";
import { readJsonResponse } from "@librarum/lib";
import { PageHero } from "@/components/page-hero";

const CHART_COLORS = ["#7ea596", "#5f8074", "#8ea49c", "#6a7771", "#4d635c", "#a4bbb1"];

async function fetchAuthorDetail(authorId: string) {
  return readJsonResponse<AuthorDetail>(await fetch(`/api/authors/${authorId}`));
}

function BookThumb({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative h-20 w-14 overflow-hidden rounded-[8px] border border-border bg-surface-raised">
        <Image alt={`${title} kapagi`} className="object-cover" fill sizes="56px" src={coverUrl} />
      </div>
    );
  }

  return (
    <div className="book-placeholder h-20 w-14 rounded-[8px] p-2">
      <span className="line-clamp-3 font-display text-[10px] leading-4 text-text-primary">
        {title}
      </span>
    </div>
  );
}

function formatAverageRating(value: number | null) {
  return value == null ? "—" : value.toFixed(2);
}

export function AuthorDetailPageClient({ authorId }: { authorId: string }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState("");
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const authorQuery = useQuery({
    queryKey: ["author-detail", authorId],
    queryFn: () => fetchAuthorDetail(authorId)
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
      readJsonResponse<{ id: string; name: string }>(
        await fetch(`/api/authors/${authorId}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ name })
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["author-detail", authorId] });
      void queryClient.invalidateQueries({ queryKey: ["authors"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      setIsEditing(false);
    }
  });

  if (authorQuery.isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-surface-raised" />
        <Card>
          <CardContent className="h-[240px] animate-pulse p-8">
            <div className="h-full rounded-[24px] bg-surface-raised" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (authorQuery.isError || !authorQuery.data) {
    return (
      <section className="space-y-6">
        <Button asChild size="sm" variant="ghost">
          <Link href="/authors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Yazarlara don
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Yazar detayi yuklenemedi</CardTitle>
            <CardDescription>
              {authorQuery.error instanceof Error
                ? authorQuery.error.message
                : "Yazar verileri alinamadi."}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const author = authorQuery.data;
  const categoryData = author.categoryDistribution.filter((item) => item.count > 0);

  return (
    <section className="page-stack">
      <Button asChild size="sm" variant="ghost">
        <Link href="/authors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Yazarlara don
        </Link>
      </Button>

      <PageHero
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Metrikler</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-3">
                <dt className="text-text-secondary">Kitap sayisi</dt>
                <dd className="font-display text-2xl text-text-primary">{author.bookCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-secondary">Ort. puan</dt>
                <dd className="font-display text-2xl text-text-primary">
                  {formatAverageRating(author.averageRating)}
                </dd>
              </div>
            </dl>
          </div>
        }
        action={
          isEditing ? (
            <div className="w-full max-w-xl space-y-3">
              <Input
                aria-label="Yazar adı"
                className="h-14 text-2xl"
                onChange={(event) => setNameDraft(event.target.value)}
                ref={nameInputRef}
                value={nameDraft}
              />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => updateMutation.mutate(nameDraft.trim())} size="sm">
                  {updateMutation.isPending ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Kaydet
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setNameDraft(author.name);
                    setIsEditing(false);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <X className="mr-2 h-4 w-4" />
                  Vazgec
                </Button>
              </div>
              {updateMutation.isError ? (
                <p className="text-sm text-destructive">
                  {updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : "Guncelleme tamamlanamadi."}
                </p>
              ) : null}
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="secondary">
              <Pencil className="mr-2 h-4 w-4" />
              Duzenle
            </Button>
          )
        }
        description="Bu yazara bagli tum kitaplar, kategori dagilimi ve ilgili seriler tek bir yuzeyde toplanir."
        kicker="Author Detail"
        title={author.name}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Sahip olunan kitaplar</CardTitle>
              <CardDescription>Bu yazara bagli koleksiyondaki tum kitaplar.</CardDescription>
            </CardHeader>
            <CardContent>
              {author.books.length === 0 ? (
                <div className="empty-panel">
                  <p className="text-sm leading-7 text-text-secondary">Bu yazara bagli kitap bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {author.books.map((book) => (
                    <Link
                      className="interactive-row flex items-center gap-4 p-3"
                      href={`/books/${book.id}`}
                      key={book.id}
                    >
                      <BookThumb coverUrl={book.coverUrl} title={book.title} />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-display text-xl text-text-primary">
                          {book.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                          <span>{book.status}</span>
                          <span>{book.rating == null ? "Puan yok" : `${book.rating.toFixed(1)} / 5`}</span>
                          {book.series ? (
                            <span>
                              {book.series.name}
                              {book.series.seriesOrder ? ` - Cilt ${book.series.seriesOrder}` : ""}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Kategori dagilimi</CardTitle>
              <CardDescription>Bu yazarin kitaplari hangi kategorilerde toplaniyor.</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="empty-panel min-h-[240px]">
                  <p className="text-sm leading-7 text-text-secondary">
                    Bu yazar icin kategori dagilimi henuz olusmadi.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer height="100%" width="100%">
                      <BarChart data={categoryData} margin={{ top: 12, right: 8, left: -20, bottom: 12 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis axisLine={false} dataKey="name" tick={{ fill: "rgba(150,159,154,1)", fontSize: 12 }} tickLine={false} />
                        <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "rgba(150,159,154,1)", fontSize: 12 }} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            border: "1px solid rgba(44,52,52,1)",
                            borderRadius: "18px",
                            background: "rgba(18,22,23,0.96)",
                            color: "rgba(235,239,236,1)"
                          }}
                          cursor={{ fill: "rgba(126,165,150,0.08)" }}
                        />
                        <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={entry.name} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid gap-2">
                    {categoryData.map((item, index) => (
                      <div className="panel-muted flex items-center justify-between px-4 py-3" key={item.name}>
                        <div className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className="text-sm text-text-primary">{item.name}</span>
                        </div>
                        <span className="text-sm text-text-secondary">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Ilgili seriler</CardTitle>
              <CardDescription>Bu yazarin koleksiyondaki seri baglantilari.</CardDescription>
            </CardHeader>
            <CardContent>
              {author.relatedSeries.length === 0 ? (
                <div className="empty-panel min-h-[180px]">
                  <p className="text-sm leading-7 text-text-secondary">Bu yazara bagli seri bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {author.relatedSeries.map((series) => (
                    <Link
                      className="interactive-row flex items-center justify-between gap-4 px-4 py-4"
                      href={`/series/${series.id}`}
                      key={series.id}
                    >
                      <div>
                        <p className="font-display text-xl text-text-primary">{series.name}</p>
                        <p className="text-sm text-text-secondary">
                          {series.totalVolumes
                            ? `${series.ownedCount} / ${series.totalVolumes} cilt`
                            : `${series.ownedCount} cilt`}
                        </p>
                      </div>
                      <BarChart3 className="h-4 w-4 text-accent" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
