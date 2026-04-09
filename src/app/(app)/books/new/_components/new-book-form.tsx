"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookForm } from "../../_components/book-form";
import { BookFormShell } from "../../_components/book-form-shell";

export function NewBookForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);

  return (
    <BookFormShell
      description="Yeni bir kitabi tum kutuphane alanlariyla birlikte ekleyin."
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          React.startTransition(() => {
            router.push("/books");
          });
        }
      }}
      open={open}
      title="Yeni Kitap"
    >
      <BookForm
        mode="add"
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (!nextOpen) {
            React.startTransition(() => {
              router.push("/books");
            });
          }
        }}
      />
    </BookFormShell>
  );
}
