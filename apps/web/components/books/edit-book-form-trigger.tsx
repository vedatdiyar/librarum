"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@librarum/ui";
import type { ButtonProps } from "@librarum/ui";
import type { BookDetail } from "@librarum/types";
import { BookForm } from "@/components/books/book-form";
import { BookFormShell } from "@/components/books/book-form-shell";
import { readJsonResponse } from "@librarum/lib";


type EditBookFormTriggerProps = {
  bookId: string;
  buttonLabel?: string;
  buttonProps?: Omit<ButtonProps, "children">;
  onSuccess?: (book: BookDetail, action?: "created" | "increase_copy" | "updated") => void;
};

export function EditBookFormTrigger({
  bookId,
  buttonLabel = "Duzenle",
  buttonProps,
  onSuccess
}: EditBookFormTriggerProps) {
  const [open, setOpen] = React.useState(false);
  const bookQuery = useQuery({
    enabled: open,
    queryKey: ["book-detail", bookId],
    queryFn: async () => readJsonResponse<BookDetail>(await fetch(`/api/books/${bookId}`))
  });

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)} variant={buttonProps?.variant ?? "secondary"}>
        {buttonLabel}
      </Button>
      <BookFormShell
        description="Mevcut kitap kaydini ayni form uzerinden guncelleyin."
        onOpenChange={setOpen}
        open={open}
        title="Kitabi Duzenle"
      >
        {bookQuery.isLoading || !bookQuery.data ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-secondary">
            Kitap detaylari yukleniyor...
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
