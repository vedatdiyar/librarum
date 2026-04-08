import * as React from "react";
import { normalizeIsbn } from "@librarum/lib";
import type { IsbnMetadata, IsbnMetadataResponse } from "@librarum/types";
import { readJsonResponse } from "@librarum/lib";

export type MetadataState = {
  status: "idle" | "loading" | "success" | "not_found" | "error";
  source: "open_library" | "google_books" | null;
  message: string | null;
  description: string | null;
};

export function useIsbnMetadata(options: {
  onMetadataFound: (metadata: IsbnMetadata, source: "open_library" | "google_books") => void;
}) {
  const metadataAbortRef = React.useRef<AbortController | null>(null);
  const metadataTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedIsbnRef = React.useRef<string | null>(null);

  const [metadataState, setMetadataState] = React.useState<MetadataState>({
    status: "idle",
    source: null,
    message: null,
    description: null
  });

  React.useEffect(() => {
    return () => {
      metadataAbortRef.current?.abort();
      if (metadataTimeoutRef.current) {
        clearTimeout(metadataTimeoutRef.current);
      }
    };
  }, []);

  const resetMetadataState = React.useCallback(() => {
    setMetadataState({
      status: "idle",
      source: null,
      message: null,
      description: null
    });
    lastFetchedIsbnRef.current = null;
  }, []);

  const fetchMetadata = React.useCallback(
    async (rawIsbn: string, immediate = false) => {
      const normalizedIsbn = normalizeIsbn(rawIsbn);

      if (metadataTimeoutRef.current) {
        clearTimeout(metadataTimeoutRef.current);
        metadataTimeoutRef.current = null;
      }

      if (!normalizedIsbn) {
        if (!rawIsbn.trim()) {
          setMetadataState({
            status: "idle",
            source: null,
            message: null,
            description: null
          });
        }
        return;
      }

      if (lastFetchedIsbnRef.current === normalizedIsbn && !immediate) {
        return;
      }

      const execute = async () => {
        metadataAbortRef.current?.abort();
        metadataAbortRef.current = new AbortController();
        setMetadataState({
          status: "loading",
          source: null,
          message: "ISBN metadata aranıyor...",
          description: null
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
              message: "Bu ISBN icin metadata bulunamadi.",
              description: null
            });
            return;
          }

          options.onMetadataFound(result.metadata, result.source);
          setMetadataState({
            status: "success",
            source: result.source,
            message: "Metadata alanlari guncellendi.",
            description: result.metadata.description ?? null
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setMetadataState({
            status: "error",
            source: null,
            message: error instanceof Error ? error.message : "Metadata alinamadi.",
            description: null
          });
        }
      };

      if (immediate) {
        void execute();
        return;
      }

      metadataTimeoutRef.current = setTimeout(() => {
        void execute();
      }, 300);
    },
    [options]
  );

  return {
    metadataState,
    fetchMetadata,
    resetMetadataState
  };
}
