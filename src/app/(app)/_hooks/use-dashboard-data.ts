"use client";

import { useQuery } from "@tanstack/react-query";
import { readJsonResponse } from "@/lib/helpers";
import type {
  BookListResponse,
  CategoryDistributionPoint,
  FavoriteAuthor,
  StatsSnapshot
} from "@/types";

async function fetchStats() {
  return readJsonResponse<StatsSnapshot>(await fetch("/api/stats"));
}

async function fetchUnreadBacklog() {
  return readJsonResponse<BookListResponse>(
    await fetch("/api/books?status=owned&limit=5")
  );
}

async function fetchRecentBooks() {
  return readJsonResponse<BookListResponse>(
    await fetch("/api/books?sort=created_at&limit=5")
  );
}

async function fetchFavoriteAuthors() {
  return readJsonResponse<FavoriteAuthor[]>(
    await fetch("/api/authors/favorites")
  );
}

async function fetchCategoryDistribution() {
  return readJsonResponse<CategoryDistributionPoint[]>(
    await fetch("/api/stats/categories")
  );
}

export function useDashboardData() {
  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchStats,
    staleTime: 5 * 60_000
  });

  const unreadBacklogQuery = useQuery({
    queryKey: ["dashboard", "books", "owned", 5],
    queryFn: fetchUnreadBacklog,
    staleTime: 5 * 60_000
  });

  const recentBooksQuery = useQuery({
    queryKey: ["dashboard", "books", "recent", 5],
    queryFn: fetchRecentBooks,
    staleTime: 5 * 60_000
  });

  const favoriteAuthorsQuery = useQuery({
    queryKey: ["dashboard", "favorite-authors"],
    queryFn: fetchFavoriteAuthors,
    staleTime: 5 * 60_000
  });

  const categoryDistributionQuery = useQuery({
    queryKey: ["dashboard", "category-distribution"],
    queryFn: fetchCategoryDistribution,
    staleTime: 5 * 60_000
  });

  return {
    statsQuery,
    unreadBacklogQuery,
    recentBooksQuery,
    favoriteAuthorsQuery,
    categoryDistributionQuery
  };
}
