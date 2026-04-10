"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { readJsonResponse } from "@/lib/shared";
import type {
  AuthorOption,
  BookDetail,
  CategoryOption,
  SeriesOption
} from "@/types";
import { toOptionalInteger } from "./use-book-form";

interface UseBookFormDataOptions {
  initialBook?: BookDetail | null;
  values: {
    authorIds?: string[];
    authorNames?: string[];
    seriesId?: string | null;
    seriesTotalVolumes?: string;
  };
  setValue: (name: any, value: any, options?: any) => void;
  invalidateCollections: () => void;
}

type PendingAuthorSuggestion = {
  inputName: string;
  suggestedAuthor: AuthorOption;
};

function normalizeAuthorKey(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function useBookFormData({
  initialBook,
  values,
  setValue,
  invalidateCollections
}: UseBookFormDataOptions) {
  const [authorQuery, setAuthorQuery] = React.useState("");
  const [seriesQuery, setSeriesQuery] = React.useState("");
  const [categoryQuery, setCategoryQuery] = React.useState("");
  const [pendingAuthorSuggestions, setPendingAuthorSuggestions] = React.useState<
    PendingAuthorSuggestion[]
  >([]);
  const [resolvedAuthors, setResolvedAuthors] = React.useState<AuthorOption[]>([]);

  const deferredAuthorQuery = React.useDeferredValue(authorQuery);

  const categoriesQuery = useQuery({
    queryKey: ["book-form", "categories"],
    queryFn: async () => readJsonResponse<CategoryOption[]>(await fetch("/api/categories")),
    staleTime: 60_000
  });

  const seriesQueryResult = useQuery({
    queryKey: ["book-form", "series"],
    queryFn: async () => readJsonResponse<SeriesOption[]>(await fetch("/api/series")),
    staleTime: 60_000
  });

  const authorsQuery = useQuery({
    queryKey: ["book-form", "authors", deferredAuthorQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (deferredAuthorQuery.trim()) {
        params.set("q", deferredAuthorQuery.trim());
      }
      return readJsonResponse<AuthorOption[]>(
        await fetch(`/api/authors${params.toString() ? `?${params.toString()}` : ""}`)
      );
    },
    staleTime: 20_000
  });

  const rememberResolvedAuthor = React.useCallback((author: AuthorOption) => {
    setResolvedAuthors((current) => {
      const exists = current.some((item) => item.id === author.id);
      if (exists) {
        return current.map((item) => (item.id === author.id ? author : item));
      }

      return [...current, author];
    });
  }, []);

  const selectedAuthors = React.useMemo(() => {
    const authorMap = new Map<string, AuthorOption>();
    (initialBook?.authors ?? []).forEach((author) => authorMap.set(author.id, author));
    (authorsQuery.data ?? []).forEach((author) => authorMap.set(author.id, author));
    resolvedAuthors.forEach((author) => authorMap.set(author.id, author));
    pendingAuthorSuggestions.forEach((suggestion) =>
      authorMap.set(suggestion.suggestedAuthor.id, suggestion.suggestedAuthor)
    );

    return (values.authorIds ?? [])
      .map((authorId) => authorMap.get(authorId))
      .filter((author): author is AuthorOption => Boolean(author));
  }, [authorsQuery.data, initialBook, pendingAuthorSuggestions, resolvedAuthors, values.authorIds]);

  const draftAuthorNames = React.useMemo(
    () => Array.from(new Set((values.authorNames ?? []).map((name) => name.trim()).filter(Boolean))),
    [values.authorNames]
  );

  const availableAuthors = React.useMemo(
    () => {
      const mergedAuthors = [...(authorsQuery.data ?? []), ...resolvedAuthors].filter(
        (author, index, list) => list.findIndex((item) => item.id === author.id) === index
      );

      return mergedAuthors.filter(
        (author) => !(values.authorIds ?? []).includes(author.id)
      );
    },
    [authorsQuery.data, resolvedAuthors, values.authorIds]
  );

  const selectedSeries = React.useMemo(() => {
    if (!values.seriesId) return null;
    return (
      (seriesQueryResult.data ?? []).find((series) => series.id === values.seriesId) ??
      (initialBook?.series && initialBook.series.id === values.seriesId
        ? {
            id: initialBook.series.id,
            name: initialBook.series.name,
            totalVolumes: initialBook.series.totalVolumes
          }
        : null)
    );
  }, [initialBook, seriesQueryResult.data, values.seriesId]);

  function addAuthorById(authorId: string) {
    setValue("authorIds", [...new Set([...(values.authorIds || []), authorId])], {
      shouldDirty: true,
      shouldValidate: true
    });

    if ((values.authorNames ?? []).length > 0) {
      const selected = [...(authorsQuery.data ?? []), ...resolvedAuthors].find(
        (author) => author.id === authorId
      );

      if (selected) {
        setValue(
          "authorNames",
          (values.authorNames ?? []).filter(
            (name) => normalizeAuthorKey(name) !== normalizeAuthorKey(selected.name)
          ),
          { shouldDirty: true, shouldValidate: true }
        );
      }
    }
  }

  function addDraftAuthorName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const existsAsSelected = selectedAuthors.some(
      (author) => normalizeAuthorKey(author.name) === normalizeAuthorKey(trimmed)
    );

    if (existsAsSelected) {
      return;
    }

    setValue(
      "authorNames",
      Array.from(new Set([...(values.authorNames ?? []), trimmed])),
      {
        shouldDirty: true,
        shouldValidate: true
      }
    );
  }

  function removeDraftAuthorName(name: string) {
    setValue(
      "authorNames",
      (values.authorNames ?? []).filter(
        (item) => normalizeAuthorKey(item) !== normalizeAuthorKey(name)
      ),
      {
        shouldDirty: true,
        shouldValidate: true
      }
    );
  }

  function removePendingSuggestion(inputName: string) {
    setPendingAuthorSuggestions((current) =>
      current.filter((item) => item.inputName !== inputName)
    );
  }

  async function createAuthor(name: string) {
    addDraftAuthorName(name);
    setAuthorQuery("");
  }

  async function resolveSuggestedAuthor(
    suggestion: PendingAuthorSuggestion,
    decision: "same_author" | "new_author"
  ) {
    if (decision === "same_author") {
      addAuthorById(suggestion.suggestedAuthor.id);
      rememberResolvedAuthor(suggestion.suggestedAuthor);
    } else {
      addDraftAuthorName(suggestion.inputName);
    }

    removePendingSuggestion(suggestion.inputName);
  }

  async function resolveAuthorIdsFromNames(names: string[]) {
    const uniqueNames = Array.from(
      new Set(names.map((name) => name.trim()).filter((name) => name.length > 0))
    );

    if (uniqueNames.length === 0) {
      return [];
    }

    const resolvedIds: string[] = [];
    const nextSuggestions: PendingAuthorSuggestion[] = [];

    for (const name of uniqueNames) {
      const localExactMatch = [...(authorsQuery.data ?? []), ...resolvedAuthors].find(
        (author) => normalizeAuthorKey(author.name) === normalizeAuthorKey(name)
      );

      if (localExactMatch) {
        resolvedIds.push(localExactMatch.id);
        continue;
      }

      const response = await fetch(`/api/authors?q=${encodeURIComponent(name)}`);
      const candidates = await readJsonResponse<AuthorOption[]>(response);
      const exactMatch = candidates.find(
        (author) => normalizeAuthorKey(author.name) === normalizeAuthorKey(name)
      );

      if (exactMatch) {
        rememberResolvedAuthor(exactMatch);
        resolvedIds.push(exactMatch.id);
        continue;
      }

      const bestSuggestion = candidates[0];
      if (bestSuggestion) {
        nextSuggestions.push({
          inputName: name,
          suggestedAuthor: bestSuggestion
        });
        continue;
      }

      addDraftAuthorName(name);
    }

    if (nextSuggestions.length > 0) {
      setPendingAuthorSuggestions((current) => {
        const merged = [...current];

        nextSuggestions.forEach((suggestion) => {
          const alreadyExists = merged.some(
            (item) =>
              item.inputName === suggestion.inputName &&
              item.suggestedAuthor.id === suggestion.suggestedAuthor.id
          );

          if (!alreadyExists) {
            merged.push(suggestion);
          }
        });

        return merged;
      });
    }

    return resolvedIds;
  }

  async function createSeries(name: string) {
    const response = await fetch("/api/series", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        totalVolumes: toOptionalInteger(values.seriesTotalVolumes)
      })
    });
    const series = await readJsonResponse<SeriesOption>(response);
    setValue("isSeries", true, { shouldDirty: true });
    setValue("seriesId", series.id, { shouldDirty: true, shouldValidate: true });
    setValue("seriesName", series.name, { shouldDirty: true });
    setSeriesQuery("");
    invalidateCollections();
  }

  async function createCategory(name: string) {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });
    const category = await readJsonResponse<CategoryOption>(response);
    setValue("categoryId", category.id, { shouldDirty: true, shouldValidate: true });
    setCategoryQuery("");
    void categoriesQuery.refetch();
    invalidateCollections();
  }

  const canCreateAuthor =
    authorQuery.trim().length > 0 &&
    ![...availableAuthors, ...selectedAuthors].some(
      (author) =>
        author.name.toLocaleLowerCase("tr-TR") === authorQuery.trim().toLocaleLowerCase("tr-TR")
    ) &&
    !draftAuthorNames.some(
      (name) => name.toLocaleLowerCase("tr-TR") === authorQuery.trim().toLocaleLowerCase("tr-TR")
    );

  const canCreateSeries =
    seriesQuery.trim().length > 0 &&
    !(seriesQueryResult.data ?? []).some(
      (series) =>
        series.name.toLocaleLowerCase("tr-TR") === seriesQuery.trim().toLocaleLowerCase("tr-TR")
    );

  const canCreateCategory =
    categoryQuery.trim().length > 0 &&
    !(categoriesQuery.data ?? []).some(
      (cat) =>
        cat.name.toLocaleLowerCase("tr-TR") === categoryQuery.trim().toLocaleLowerCase("tr-TR")
    );

  return {
    authorQuery,
    setAuthorQuery,
    seriesQuery,
    setSeriesQuery,
    categoryQuery,
    setCategoryQuery,
    categoriesQuery,
    seriesQueryResult,
    authorsQuery,
    availableAuthors,
    selectedAuthors,
    selectedSeries,
    draftAuthorNames,
    pendingAuthorSuggestions,
    addAuthorById,
    removeDraftAuthorName,
    createAuthor,
    createSeries,
    createCategory,
    resolveSuggestedAuthor,
    resolveAuthorIdsFromNames,
    canCreateAuthor,
    canCreateSeries,
    canCreateCategory
  };
}
