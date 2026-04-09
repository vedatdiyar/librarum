"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { BooksPageClientContent } from "./books-page-client-content";

export function BooksPageClient() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <BooksPageClientContent />
    </React.Suspense>
  );
}
