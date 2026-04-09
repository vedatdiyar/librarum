"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import type { AuthorListItem } from "@/types";
import { readJsonResponse } from "@/lib/shared";
import { PageHero } from "@/components/page-hero";

async function fetchAuthors() {
  return readJsonResponse<AuthorListItem[]>(await fetch("/api/authors"));
}

function formatAverageRating(value: number | null) {
  return value == null ? "—" : value.toFixed(2);
}

export function AuthorsPageClient() {
  const authorsQuery = useQuery({
    queryKey: ["authors"],
    queryFn: fetchAuthors
  });

  if (authorsQuery.isLoading) {
    return (
      <section className="page-stack">
        <div className="page-hero rounded-[24px] p-8">
          <div className="h-4 w-24 animate-pulse rounded-full bg-surface-raised" />
          <div className="mt-6 h-14 w-72 animate-pulse rounded-2xl bg-surface-raised" />
        </div>
      </section>
    );
  }

  if (authorsQuery.isError) {
    return (
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Yazarlar yüklenemedi</CardTitle>
            <CardDescription>
              {authorsQuery.error instanceof Error
                ? authorsQuery.error.message
                : "Yazar listesi alınamadı."}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const authors = authorsQuery.data ?? [];

  return (
    <section className="page-stack">
      <PageHero
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Toplam yazar</p>
            <p className="page-metric-value">{authors.length}</p>
          </div>
        }
        description="Tüm yazarlar alfabetik olarak listelenir; her satırda koleksiyondaki kitap sayısı ve ortalama puan özetlenir."
        kicker="Yazarlar"
        title="Kütüphanendeki yazarlar"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Tüm yazarlar</CardTitle>
          <CardDescription>Alfabetik sıra ile listelenir.</CardDescription>
        </CardHeader>
        <CardContent>
          {authors.length === 0 ? (
            <div className="empty-panel">
              <p className="text-sm leading-7 text-text-secondary">
                Henüz yazar kaydı oluşmadı.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Yazar</TableHead>
                  <TableHead className="w-40">Kitap sayısı</TableHead>
                  <TableHead className="w-40">Ort. puan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell>
                      <Link
                        className="group inline-flex items-center gap-3"
                        href={`/authors/${author.id}`}
                      >
                        <span className="rounded-[18px] border border-accent/25 bg-accent/10 p-3 text-accent">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="flex items-center gap-2 font-display text-2xl text-text-primary transition group-hover:text-text-secondary">
                          {author.name}
                          <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{author.bookCount}</TableCell>
                    <TableCell>{formatAverageRating(author.averageRating)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
