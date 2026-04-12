"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJsonResponse } from "@/lib/helpers";
import type {
  ApiBookListItem,
  AuthorListItem,
  BookListResponse,
  BooksListFilters,
  BulkBooksPatchInput,
  CategoryOption,
  SeriesListItem
} from "@/types";

export type BooksPageFilterState = Record<keyof BooksListFilters, string>;

export const EMPTY_FILTERS: BooksPageFilterState = {
  status: "",
  category: "",
  location: "",
  author: "",
  series: ""
};

export function parsePage(searchParams: URLSearchParams | ReadonlyURLSearchParams) {
  const rawPage = searchParams.get("page");
  if (!rawPage) return 1;
  const parsedPage = Number.parseInt(rawPage, 10);
  return Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
}

export function parseFilters(searchParams: URLSearchParams | ReadonlyURLSearchParams): BooksPageFilterState {
  return {
    status: searchParams.get("status") ?? "",
    category: searchParams.get("category") ?? "",
    location: searchParams.get("location") ?? "",
    author: searchParams.get("author") ?? "",
    series: searchParams.get("series") ?? ""
  };
}

function buildBooksQueryString(filters: BooksPageFilterState, page: number) {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("page", String(page));
  }
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return params.toString();
}

function buildBooksApiUrl(filters: BooksPageFilterState, page: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "25");
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return `/api/books?${params.toString()}`;
}

export function useSelection(items: ApiBookListItem[]) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const visibleIds = React.useMemo(() => items.map((item) => item.id), [items]);

  React.useEffect(() => {
    setSelectedIds((current) => {
      const nextSelectedIds = current.filter((id) => visibleIds.includes(id));
      return nextSelectedIds.length === current.length ? current : nextSelectedIds;
    });
  }, [visibleIds]);

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleRow(id: string, index: number, withShift: boolean) {
    setSelectedIds((current) => {
      if (
        withShift &&
        lastSelectedIndexRef.current !== null &&
        items[lastSelectedIndexRef.current]
      ) {
        const start = Math.min(lastSelectedIndexRef.current, index);
        const end = Math.max(lastSelectedIndexRef.current, index);
        const rangeIds = items.slice(start, end + 1).map((item) => item.id);
        const merged = new Set(current);

        rangeIds.forEach((rangeId) => merged.add(rangeId));
        lastSelectedIndexRef.current = index;

        return Array.from(merged);
      }

      lastSelectedIndexRef.current = index;

      if (current.includes(id)) {
        return current.filter((selectedId) => selectedId !== id);
      }

      return [...current, id];
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds(checked ? visibleIds : []);
  }

  return {
    selectedIds,
    allVisibleSelected,
    toggleRow,
    toggleAllVisible,
    clearSelection: () => setSelectedIds([])
  };
}

export function useBooksPageData(searchParams: URLSearchParams | ReadonlyURLSearchParams) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const page = React.useMemo(() => parsePage(searchParams), [searchParams]);
  const filters = React.useMemo(() => parseFilters(searchParams), [searchParams]);

  const booksQuery = useQuery({
    queryKey: ["books", page, filters],
    queryFn: async () => readJsonResponse<BookListResponse>(await fetch(buildBooksApiUrl(filters, page)))
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => readJsonResponse<CategoryOption[]>(await fetch("/api/categories"))
  });

  const authorsQuery = useQuery({
    queryKey: ["authors"],
    queryFn: async () => readJsonResponse<AuthorListItem[]>(await fetch("/api/authors"))
  });

  const seriesQuery = useQuery({
    queryKey: ["series"],
    queryFn: async () => readJsonResponse<SeriesListItem[]>(await fetch("/api/series"))
  });

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: async () => readJsonResponse<string[]>(await fetch("/api/locations"))
  });

  const syncFiltersToUrl = React.useCallback(
    (nextFilters: BooksPageFilterState, nextPage = 1) => {
      const queryString = buildBooksQueryString(nextFilters, nextPage);
      router.replace(queryString ? `/books?${queryString}` : "/books", {
        scroll: false
      });
    },
    [router]
  );

  const bulkUpdateMutation = useMutation({
    mutationFn: async (payload: BulkBooksPatchInput) =>
      readJsonResponse<{ message: string; updatedCount: number }>(
        await fetch("/api/books/bulk", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    }
  });

  return {
    page,
    filters,
    booksQuery,
    categoriesQuery,
    authorsQuery,
    seriesQuery,
    locationsQuery,
    syncFiltersToUrl,
    bulkUpdateMutation
  };
}
