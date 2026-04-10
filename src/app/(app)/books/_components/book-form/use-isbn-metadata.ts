"use client";

import * as React from "react";
import { normalizeIsbn } from "@/lib/shared";
import type {
  IsbnCoverOption,
  IsbnMetadata,
  IsbnMetadataResponse,
  IsbnMetadataSource
} from "@/types";
import { readJsonResponse } from "@/lib/shared";

export type MetadataState = {
  status: "idle" | "loading" | "success" | "not_found" | "error";
  source: IsbnMetadataSource | null;
  message: string | null;
  description: string | null;
  coverOptions: IsbnCoverOption[];
};

export function useIsbnMetadata(options: {
  onMetadataFound: (
    metadata: IsbnMetadata,
    source: IsbnMetadataSource,
    coverOptions: IsbnCoverOption[]
  ) => void;
}) {
  const metadataAbortRef = React.useRef<AbortController | null>(null);
  const lastFetchedIsbnRef = React.useRef<string | null>(null);

  const [metadataState, setMetadataState] = React.useState<MetadataState>({
    status: "idle",
    source: null,
    message: null,
    description: null,
    coverOptions: []
  });

  React.useEffect(() => {
    return () => {
      metadataAbortRef.current?.abort();
    };
  }, []);

  const resetMetadataState = React.useCallback(() => {
    setMetadataState({
      status: "idle",
      source: null,
      message: null,
      description: null,
      coverOptions: []
    });
    lastFetchedIsbnRef.current = null;
  }, []);

  const fetchMetadata = React.useCallback(
    async (rawIsbn: string) => {
      const normalizedIsbn = normalizeIsbn(rawIsbn);

      if (!normalizedIsbn) {
        if (!rawIsbn.trim()) {
          setMetadataState({
            status: "idle",
            source: null,
            message: null,
            description: null,
            coverOptions: []
          });
        }
        return;
      }

      if (lastFetchedIsbnRef.current === normalizedIsbn) {
        return;
      }

      metadataAbortRef.current?.abort();
      metadataAbortRef.current = new AbortController();
      setMetadataState({
        status: "loading",
        source: null,
        message: "ISBN metadata aranıyor...",
        description: null,
        coverOptions: []
      });

      try {
        const response = await fetch(`/api/books/isbn/${encodeURIComponent(normalizedIsbn)}`, {
          signal: metadataAbortRef.current.signal
        });
        const result = await readJsonResponse<IsbnMetadataResponse>(response);
        lastFetchedIsbnRef.current = normalizedIsbn;

        if (!result.found) {
          setMetadataState({
            status: "not_found",
            source: null,
            message: "Bu ISBN için metadata bulunamadı.",
            description: null,
            coverOptions: []
          });
          return;
        }

        options.onMetadataFound(result.metadata, result.source, result.coverOptions);
        const hasAuthors = result.metadata.authors.length > 0;

        setMetadataState({
          status: "success",
          source: result.source,
          message: hasAuthors
            ? "Kitap bilgileri güncellendi."
            : "Kitap bilgileri güncellendi, ancak bu ISBN kaynağında yazar bilgisi bulunamadı.",
          description: result.metadata.description ?? null,
          coverOptions: result.coverOptions
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMetadataState({
          status: "error",
          source: null,
          message: error instanceof Error ? error.message : "Metadata alınamadı.",
          description: null,
          coverOptions: []
        });
      }
    },
    [options]
  );

  return {
    metadataState,
    fetchMetadata,
    resetMetadataState
  };
}
