"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJsonResponse } from "@exlibris/lib";
import type { BookDetail } from "@exlibris/types";

export function useBookDetailData(bookId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const bookQuery = useQuery({
    queryKey: ["book-detail", bookId],
    queryFn: async () => readJsonResponse<BookDetail>(await fetch(`/api/books/${bookId}`))
  });

  const invalidateBookQueries = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["book-detail", bookId] });
    void queryClient.invalidateQueries({ queryKey: ["books"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
  }, [bookId, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async () =>
      readJsonResponse<{ message: string }>(
        await fetch(`/api/books/${bookId}`, {
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
