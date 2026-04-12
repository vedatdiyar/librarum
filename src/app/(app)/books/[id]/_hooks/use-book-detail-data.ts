"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJsonResponse } from "@/lib/helpers";
import type { BookDetail } from "@/types";

export function useBookDetailData(bookSlug: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const bookQuery = useQuery({
    queryKey: ["book-detail", bookSlug],
    queryFn: async () => readJsonResponse<BookDetail>(await fetch(`/api/books/${bookSlug}`))
  });

  const invalidateBookQueries = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["book-detail", bookSlug] });
    void queryClient.invalidateQueries({ queryKey: ["books"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
  }, [bookSlug, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async () =>
      readJsonResponse<{ message: string }>(
        await fetch(`/api/books/${bookSlug}`, {
          method: "DELETE"
        })
      ),
    onSuccess: () => {
      invalidateBookQueries();
      React.startTransition(() => {
        router.push("/books");
        router.refresh();
      });
    }
  });

  return {
    bookQuery,
    deleteMutation,
    invalidateBookQueries
  };
}
