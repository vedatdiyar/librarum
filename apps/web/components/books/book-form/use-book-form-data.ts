import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { readJsonResponse } from "@exlibris/lib";
import type {
  AuthorOption,
  BookDetail,
  CategoryOption,
  SeriesOption,
  TagOption
} from "@exlibris/types";
import { toOptionalInteger } from "./use-book-form";

interface UseBookFormDataOptions {
  initialBook?: BookDetail | null;
  values: {
    authorIds?: string[];
    tagIds?: string[];
    seriesId?: string | null;
    seriesTotalVolumes?: string;
  };
  setValue: (name: any, value: any, options?: any) => void;
  invalidateCollections: () => void;
}

export function useBookFormData({
  initialBook,
  values,
  setValue,
  invalidateCollections
}: UseBookFormDataOptions) {
  const [authorQuery, setAuthorQuery] = React.useState("");
  const [tagQuery, setTagQuery] = React.useState("");
  const [seriesQuery, setSeriesQuery] = React.useState("");

  const deferredAuthorQuery = React.useDeferredValue(authorQuery);
  const deferredTagQuery = React.useDeferredValue(tagQuery);
  const deferredSeriesQuery = React.useDeferredValue(seriesQuery);

  const categoriesQuery = useQuery({
    queryKey: ["book-form", "categories"],
    queryFn: async () => readJsonResponse<CategoryOption[]>(await fetch("/api/categories")),
    staleTime: 60_000
  });

  const tagsQuery = useQuery({
    queryKey: ["book-form", "tags"],
    queryFn: async () => readJsonResponse<TagOption[]>(await fetch("/api/tags")),
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

  const selectedAuthors = React.useMemo(() => {
    const authorMap = new Map<string, AuthorOption>();
    (initialBook?.authors ?? []).forEach((author) => authorMap.set(author.id, author));
    (authorsQuery.data ?? []).forEach((author) => authorMap.set(author.id, author));
    return (values.authorIds ?? [])
      .map((authorId) => authorMap.get(authorId))
      .filter((author): author is AuthorOption => Boolean(author));
  }, [values.authorIds, authorsQuery.data, initialBook]);

  const selectedTags = React.useMemo(() => {
    const tagMap = new Map((tagsQuery.data ?? []).map((tag) => [tag.id, tag]));
    return (values.tagIds ?? [])
      .map((tagId) => tagMap.get(tagId))
      .filter((tag): tag is TagOption => Boolean(tag));
  }, [values.tagIds, tagsQuery.data]);

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

  const filteredTags = React.useMemo(() => {
    const query = deferredTagQuery.trim().toLocaleLowerCase("tr-TR");
    return (tagsQuery.data ?? [])
      .filter((tag) => !(values.tagIds ?? []).includes(tag.id))
      .filter((tag) => !query || tag.name.toLocaleLowerCase("tr-TR").includes(query))
      .slice(0, 8);
  }, [deferredTagQuery, values.tagIds, tagsQuery.data]);

  const filteredSeries = React.useMemo(() => {
    const query = deferredSeriesQuery.trim().toLocaleLowerCase("tr-TR");
    return (seriesQueryResult.data ?? [])
      .filter((series) => !query || series.name.toLocaleLowerCase("tr-TR").includes(query))
      .slice(0, 8);
  }, [deferredSeriesQuery, seriesQueryResult.data]);

  async function createAuthor(name: string) {
    const response = await fetch("/api/authors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });
    const author = await readJsonResponse<AuthorOption>(response);
    setValue("authorIds", [...new Set([...(values.authorIds || []), author.id])], {
      shouldDirty: true,
      shouldValidate: true
    });
    setAuthorQuery("");
    invalidateCollections();
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

  const canCreateAuthor =
    authorQuery.trim().length > 0 &&
    !(authorsQuery.data ?? []).some(
      (author) =>
        author.name.toLocaleLowerCase("tr-TR") === authorQuery.trim().toLocaleLowerCase("tr-TR")
    );

  const canCreateSeries =
    seriesQuery.trim().length > 0 &&
    !(seriesQueryResult.data ?? []).some(
      (series) =>
        series.name.toLocaleLowerCase("tr-TR") === seriesQuery.trim().toLocaleLowerCase("tr-TR")
    );

  return {
    authorQuery,
    setAuthorQuery,
    tagQuery,
    setTagQuery,
    seriesQuery,
    setSeriesQuery,
    categoriesQuery,
    tagsQuery,
    seriesQueryResult,
    authorsQuery,
    selectedAuthors,
    selectedTags,
    selectedSeries,
    filteredTags,
    filteredSeries,
    createAuthor,
    createSeries,
    canCreateAuthor,
    canCreateSeries
  };
}
