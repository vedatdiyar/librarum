"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import type { ButtonProps } from "@/components/ui";
import type { BookDetail } from "@/types";
import { readJsonResponse } from "@/lib/shared";
import { BookForm } from "../../_components/book-form";
import { BookFormShell } from "../../_components/book-form-shell";

type EditBookFormTriggerProps = {
  bookSlug: string;
  buttonLabel?: string;
  buttonProps?: Omit<ButtonProps, "children">;
  onSuccess?: (book: BookDetail, action?: "created" | "increase_copy" | "updated") => void;
};

export function EditBookFormTrigger({
  bookSlug,
  buttonLabel = "Düzenle",
  buttonProps,
  onSuccess
}: EditBookFormTriggerProps) {
  const [open, setOpen] = React.useState(false);
  const bookQuery = useQuery({
    enabled: open,
    queryKey: ["book-detail", bookSlug],
    queryFn: async () => readJsonResponse<BookDetail>(await fetch(`/api/books/${bookSlug}`))
  });

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)} variant={buttonProps?.variant ?? "secondary"}>
        {buttonLabel}
      </Button>
      <BookFormShell
        description="Arşivdeki eser kaydını güncelleyin."
        onOpenChange={setOpen}
        open={open}
        title="Eseri Düzenle"
      >
        {bookQuery.isLoading || !bookQuery.data ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-secondary">
            Eser detayları yükleniyor...
          </div>
        ) : (
          <BookForm
            initialBook={bookQuery.data}
            mode="edit"
            onOpenChange={setOpen}
            onSuccess={onSuccess}
          />
        )}
      </BookFormShell>
    </>
  );
}
