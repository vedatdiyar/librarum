"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { normalizeText, readJsonResponse } from "@/lib/helpers";
import type {
  AuthorOption,
  BookDetail,
  CategoryOption,
  PublisherOption,
  SeriesOption
} from "@/types";
import { toOptionalInteger } from "./use-book-form";

type PaginatedResponse<T> = {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
};


interface UseBookFormDataOptions {
  initialBook?: BookDetail | null;
  values: {
    authorIds?: string[];
    authorNames?: string[];
    seriesId?: string | null;
    seriesTotalVolumes?: string;
    publisher?: { id: string } | { name: string } | null;
  };
  setValue: (name: any, value: any, options?: any) => void;
  invalidateCollections: () => void;
}

type PendingAuthorSuggestion = {
  inputName: string;
  suggestedAuthor: AuthorOption;
};

function normalizeAuthorKey(value: string) {
  return normalizeText(value);
}

export function useBookFormData({
  initialBook,
  values,
  setValue,
  invalidateCollections
}: UseBookFormDataOptions) {
  const [queries, setQueries] = React.useState({
    authorQuery: "",
    seriesQuery: "",
    categoryQuery: "",
    publisherQuery: ""
  });
  const [authorState, setAuthorState] = React.useState<{
    pendingAuthorSuggestions: PendingAuthorSuggestion[];
    resolvedAuthors: AuthorOption[];
  }>({
    pendingAuthorSuggestions: [],
    resolvedAuthors: []
  });

  const setAuthorQuery = React.useCallback((value: string) => {
    setQueries((current) => ({ ...current, authorQuery: value }));
  }, []);

  const setSeriesQuery = React.useCallback((value: string) => {
    setQueries((current) => ({ ...current, seriesQuery: value }));
  }, []);

  const setCategoryQuery = React.useCallback((value: string) => {
    setQueries((current) => ({ ...current, categoryQuery: value }));
  }, []);

  const setPublisherQuery = React.useCallback((value: string) => {
    setQueries((current) => ({ ...current, publisherQuery: value }));
  }, []);

  const authorQuery = queries.authorQuery;
  const seriesQuery = queries.seriesQuery;
  const categoryQuery = queries.categoryQuery;
  const publisherQuery = queries.publisherQuery;
  const pendingAuthorSuggestions = authorState.pendingAuthorSuggestions;
  const resolvedAuthors = authorState.resolvedAuthors;

  const deferredAuthorQuery = React.useDeferredValue(queries.authorQuery);
  const deferredPublisherQuery = React.useDeferredValue(queries.publisherQuery);

  const publishersQuery = useQuery({
    queryKey: ["book-form", "publishers", deferredPublisherQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (deferredPublisherQuery.trim()) {
        params.set("q", deferredPublisherQuery.trim());
      }
      return readJsonResponse<PublisherOption[]>(
        await fetch(`/api/publishers${params.toString() ? `?${params.toString()}` : ""}`)
      );
    },
    staleTime: 60_000
  });

  const categoriesQuery = useQuery({
    queryKey: ["book-form", "categories"],
    queryFn: async () => readJsonResponse<CategoryOption[]>(await fetch("/api/categories")),
    staleTime: 60_000
  });

  const seriesQueryResult = useQuery({
    queryKey: ["book-form", "series"],
    queryFn: async () => readJsonResponse<PaginatedResponse<SeriesOption>>(await fetch("/api/series")),
    staleTime: 60_000
  });

  const authorsQuery = useQuery({
    queryKey: ["book-form", "authors", deferredAuthorQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (deferredAuthorQuery.trim()) {
        params.set("q", deferredAuthorQuery.trim());
      }
      return readJsonResponse<PaginatedResponse<AuthorOption>>(
        await fetch(`/api/authors${params.toString() ? `?${params.toString()}` : ""}`)
      );
    },
    staleTime: 20_000
  });


  const rememberResolvedAuthor = React.useCallback((author: AuthorOption) => {
    setAuthorState((current) => {
      const exists = current.resolvedAuthors.some((item) => item.id === author.id);
      if (exists) {
        return {
          ...current,
          resolvedAuthors: current.resolvedAuthors.map((item) =>
            item.id === author.id ? author : item
          )
        };
      }

      return {
        ...current,
        resolvedAuthors: [...current.resolvedAuthors, author]
      };
    });
  }, []);

  const selectedAuthors = React.useMemo(() => {
    const authorMap = new Map<string, AuthorOption>();
    (initialBook?.authors ?? []).forEach((author) => authorMap.set(author.id, author));
    (authorsQuery.data?.items ?? []).forEach((author) => authorMap.set(author.id, author));
    resolvedAuthors.forEach((author) => authorMap.set(author.id, author));
    pendingAuthorSuggestions.forEach((suggestion) =>
      authorMap.set(suggestion.suggestedAuthor.id, suggestion.suggestedAuthor)
    );

    return (values.authorIds ?? [])
      .map((authorId) => authorMap.get(authorId))
      .filter((author): author is AuthorOption => Boolean(author));
  }, [authorsQuery.data?.items, initialBook, pendingAuthorSuggestions, resolvedAuthors, values.authorIds]);


  const draftAuthorNames = React.useMemo(
    () => Array.from(new Set((values.authorNames ?? []).map((name) => name.trim()).filter(Boolean))),
    [values.authorNames]
  );

  const availableAuthors = React.useMemo(
    () => {
      const mergedAuthors = [...(authorsQuery.data?.items ?? []), ...resolvedAuthors].filter(
        (author, index, list) => list.findIndex((item) => item.id === author.id) === index
      );

      return mergedAuthors.filter(
        (author) => !(values.authorIds ?? []).includes(author.id)
      );
    },
    [authorsQuery.data?.items, resolvedAuthors, values.authorIds]
  );


  const selectedSeries = React.useMemo(() => {
    if (!values.seriesId) return null;
    return (
      (seriesQueryResult.data?.items ?? []).find((series) => series.id === values.seriesId) ??
      (initialBook?.series && initialBook.series.id === values.seriesId
        ? {
            id: initialBook.series.id,
            name: initialBook.series.name,
            totalVolumes: initialBook.series.totalVolumes
          }
        : null)
    );
  }, [initialBook, seriesQueryResult.data?.items, values.seriesId]);


  function addAuthorById(authorId: string) {
    setValue("authorIds", [...new Set([...(values.authorIds || []), authorId])], {
      shouldDirty: true,
      shouldValidate: true
    });

    if ((values.authorNames ?? []).length > 0) {
      const selected = [...(authorsQuery.data?.items ?? []), ...resolvedAuthors].find(
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
  
  function updateDraftAuthorName(oldName: string, newName: string) {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    
    if (!trimmedNew || normalizeAuthorKey(trimmedOld) === normalizeAuthorKey(trimmedNew)) {
      return;
    }

    setValue(
      "authorNames",
      (values.authorNames ?? []).map((name) =>
        normalizeAuthorKey(name) === normalizeAuthorKey(trimmedOld) ? trimmedNew : name
      ),
      { shouldDirty: true, shouldValidate: true }
    );

    // After manual edit, try to resolve again in case it now matches an existing DB record
    void resolveAuthorIdsFromNames([trimmedNew]);
  }

  function removePendingSuggestion(inputName: string) {
    setAuthorState((current) => ({
      ...current,
      pendingAuthorSuggestions: current.pendingAuthorSuggestions.filter(
        (item) => item.inputName !== inputName
      )
    }));
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

  async function resolveAuthorIdsFromNames(names: string[]): Promise<{
    resolvedIds: string[];
    unresolvedNames: string[];
  }> {
    const uniqueNames = Array.from(
      new Set(names.map((name) => name.trim()).filter((name) => name.length > 0))
    );

    if (uniqueNames.length === 0) {
      return { resolvedIds: [], unresolvedNames: [] };
    }

    const resolvedIds: string[] = [];
    const unresolvedNames: string[] = [];
    const nextSuggestions: PendingAuthorSuggestion[] = [];

    for (const name of uniqueNames) {
      const localExactMatch = [...(authorsQuery.data?.items ?? []), ...resolvedAuthors].find(
        (author) => normalizeAuthorKey(author.name) === normalizeAuthorKey(name)
      );


      if (localExactMatch) {
        resolvedIds.push(localExactMatch.id);
        continue;
      }

      const response = await fetch(`/api/authors?q=${encodeURIComponent(name)}`);
      const result = await readJsonResponse<PaginatedResponse<AuthorOption>>(response);
      const candidates = result.items;
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
        rememberResolvedAuthor(bestSuggestion);
        resolvedIds.push(bestSuggestion.id);
        continue;
      }

      unresolvedNames.push(name);
    }

    if (nextSuggestions.length > 0) {
      setAuthorState((current) => {
        const merged = [...current.pendingAuthorSuggestions];

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

        return {
          ...current,
          pendingAuthorSuggestions: merged
        };
      });
    }

    return { resolvedIds, unresolvedNames };
  }

  async function resolvePublisherIdFromName(name: string): Promise<string | null> {
    if (!name.trim()) return null;

    // Check backend resolution
    const response = await fetch(`/api/publishers?q=${encodeURIComponent(name.trim())}`);
    const candidates = await readJsonResponse<PublisherOption[]>(response);
    
    // Auto-resolve to first candidate if available (fuzzy matching already handled on backend)
    const bestMatch = candidates[0];
    if (bestMatch) {
      return bestMatch.id;
    }

    return null;
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

  async function createPublisher(name: string) {
    const response = await fetch("/api/publishers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });
    const publisher = await readJsonResponse<PublisherOption>(response);
    setValue("publisher", { id: publisher.id }, { shouldDirty: true, shouldValidate: true });
    setPublisherQuery("");
    void publishersQuery.refetch();
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
    !(seriesQueryResult.data?.items ?? []).some(
      (series) =>
        series.name.toLocaleLowerCase("tr-TR") === seriesQuery.trim().toLocaleLowerCase("tr-TR")
    );


  const canCreateCategory =
    categoryQuery.trim().length > 0 &&
    !(categoriesQuery.data ?? []).some(
      (cat) =>
        cat.name.toLocaleLowerCase("tr-TR") === categoryQuery.trim().toLocaleLowerCase("tr-TR")
    );

  const canCreatePublisher =
    publisherQuery.trim().length > 0 &&
    !(publishersQuery.data ?? []).some(
      (pub) =>
        pub.name.toLocaleLowerCase("tr-TR") === publisherQuery.trim().toLocaleLowerCase("tr-TR")
    );

  return {
    publisherQuery,
    setPublisherQuery,
    publishersQuery,
    createPublisher,
    resolvePublisherIdFromName,
    canCreatePublisher,
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
    updateDraftAuthorName,
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
