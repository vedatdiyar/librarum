"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpenText } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@librarum/ui";
import type { BookListResponse } from "@librarum/types";
import { readJsonResponse } from "@librarum/lib";
import { BookReturnDialog } from "@/components/books/book-return-dialog";
import { PageHero } from "@/components/page-hero";

async function fetchLoanedBooks() {
  return readJsonResponse<BookListResponse>(await fetch("/api/books?status=loaned"));
}

function formatLoanDate(value: string | null) {
  if (!value) {
    return "Tarih belirtilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function BookThumb({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative h-20 w-14 overflow-hidden rounded-[8px] border border-border bg-surface-raised">
        <Image alt={`${title} kapağı`} className="object-cover" fill sizes="56px" src={coverUrl} />
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

export function LoansPageClient() {
  const [selectedBookId, setSelectedBookId] = React.useState<string | null>(null);
  const loansQuery = useQuery({
    queryKey: ["books", "loans"],
    queryFn: fetchLoanedBooks
  });

  if (loansQuery.isLoading) {
    return (
      <section className="page-stack">
        <div className="page-hero rounded-[24px] p-8">
          <div className="h-4 w-24 animate-pulse rounded-full bg-surface-raised" />
          <div className="mt-6 h-14 w-72 animate-pulse rounded-2xl bg-surface-raised" />
        </div>
      </section>
    );
  }

  if (loansQuery.isError) {
    return (
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ödünç listesi yüklenemedi</CardTitle>
            <CardDescription>
              {loansQuery.error instanceof Error
                ? loansQuery.error.message
                : "Ödünçteki kitaplar alınamadı."}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const items = loansQuery.data?.items ?? [];

  return (
    <>
      <section className="page-stack">
        <PageHero
          aside={
            <div className="page-metric">
              <p className="page-metric-label">Aktif ödünç</p>
              <p className="page-metric-value">{items.length}</p>
            </div>
          }
          description="Şu anda kimde hangi kitap var ve ne zaman verildi, hepsi tek listede."
          kicker="Ödünç İşlemleri"
          title="Ödünç verdiğin kitaplar"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Ödünç listesi</CardTitle>
            <CardDescription>Tüm status=loaned kitaplar burada listelenir.</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="empty-panel min-h-[240px]">
                <p className="text-sm leading-7 text-text-secondary">
                  Şu an ödünç verilen kitabın yok.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Kapak</TableHead>
                    <TableHead>Başlık</TableHead>
                    <TableHead className="w-48">Kime Verildi</TableHead>
                    <TableHead className="w-52">Verilme Tarihi</TableHead>
                    <TableHead className="w-40">İade Et</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <BookThumb coverUrl={book.coverUrl} title={book.title} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Link
                            className="font-display text-2xl text-text-primary transition hover:text-text-secondary"
                            href={`/books/${book.id}`}
                          >
                            {book.title}
                          </Link>
                          <p className="text-sm text-text-secondary">
                            {book.authors.map((author) => author.name).join(", ") || "Yazar belirtilmedi"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{book.loanedTo ?? "Belirtilmedi"}</TableCell>
                      <TableCell>{formatLoanDate(book.loanedAt)}</TableCell>
                      <TableCell>
                        <Button onClick={() => setSelectedBookId(book.id)} variant="secondary">
                          <BookOpenText className="mr-2 h-4 w-4" />
                          İade Et
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {selectedBookId ? (
        <BookReturnDialog
          bookId={selectedBookId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedBookId(null);
            }
          }}
          open={Boolean(selectedBookId)}
        />
      ) : null}
    </>
  );
}
