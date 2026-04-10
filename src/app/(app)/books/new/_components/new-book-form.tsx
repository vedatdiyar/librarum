"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { appPageTitles } from "@/lib/navigation";
import { BookForm } from "../../_components/book-form";

export function NewBookForm() {
  const router = useRouter();

  return (
    <section className="space-y-10 pb-24">
      <PageHero
        action={
          <Button
            className="rounded-2xl border-white/10 bg-white/5 px-5 text-sm transition-all hover:bg-white/10"
            onClick={() => router.push("/books")}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kitaplara Dön
          </Button>
        }
        description="Yeni kitabı tüm temel bibliyografik alanlarıyla ekleyin. ISBN kontrolüyle yayınevi, yıl, kapak ve yazar bilgilerini tek adımda doldurabilirsiniz."
        kicker="Katalog"
        title={appPageTitles.newBook}
      />

      <BookForm
        layout="page"
        mode="add"
        onCancel={() => router.push("/books")}
      />
    </section>
  );
}
