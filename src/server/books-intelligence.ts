import { normalizeIsbn } from "@/lib/helpers";
import { normalizeBibliographicMetadata } from "@/server/bibliographic-normalizer";
import type { IsbnMetadata, IsbnMetadataResponse } from "@/types";
import { ApiError } from "@/server/api";

import { buildCoverOptions, mergeMetadata } from "./isbn-normalizers";
import { loadOpenLibraryEnrichment } from "./open-library-client";
import { fetchGoogleBooksMetadata } from "./google-books-client";

// Re-export public API from sub-modules so existing consumers don't break.
export { checkDuplicateBook, normalizeCreateBookResult } from "./duplicate-detector";

export function assertValidNormalizedIsbn(value: string | null | undefined) {
  const normalizedIsbn = normalizeIsbn(value);

  if (!normalizedIsbn) {
    throw new ApiError(400, "ISBN must be a valid ISBN-10 or ISBN-13.");
  }

  return normalizedIsbn;
}

export async function fetchMetadataByIsbn(isbn: string): Promise<IsbnMetadataResponse> {
  const normalizedIsbn = assertValidNormalizedIsbn(isbn);

  let googleMetadata: IsbnMetadata | null = null;
  let openLibraryMetadata: IsbnMetadata | null = null;

  try {
    googleMetadata = await fetchGoogleBooksMetadata(normalizedIsbn);

    if (googleMetadata) {
      try {
        openLibraryMetadata = await loadOpenLibraryEnrichment(
          normalizedIsbn,
          googleMetadata.title ?? "",
          googleMetadata.authors[0] ?? null
        );

      } catch (error) {
        console.error("Open Library enrichment failed", error);
      }

      const metadata = openLibraryMetadata
        ? mergeMetadata(googleMetadata, openLibraryMetadata)
        : googleMetadata;
      const normalizedMetadata = await normalizeBibliographicMetadata({
        isbn: normalizedIsbn,
        metadata,
        source: "google_books"
      });

      return {
        found: true,
        source: "google_books",
        metadata: normalizedMetadata,
        coverOptions: buildCoverOptions({
          googleMetadata,
          openLibraryMetadata,
          selectedSource: "google_books",
          selectedCoverUrl: normalizedMetadata.coverMetadataUrl
        })
      };
    }
  } catch (error) {
    console.error("Google Books fetch failed", error);
  }

  try {
    openLibraryMetadata = await loadOpenLibraryEnrichment(
      normalizedIsbn,
      "",
      null
    );

    if (openLibraryMetadata) {
      const normalizedMetadata = await normalizeBibliographicMetadata({
        isbn: normalizedIsbn,
        metadata: openLibraryMetadata,
        source: "open_library"
      });

      return {
        found: true,
        source: "open_library",
        metadata: normalizedMetadata,
        coverOptions: buildCoverOptions({
          googleMetadata,
          openLibraryMetadata,
          selectedSource: "open_library",
          selectedCoverUrl: normalizedMetadata.coverMetadataUrl
        })
      };
    }
  } catch (error) {
    console.error("Open Library fetch failed", error);
  }

  return {
    found: false
  };
}
