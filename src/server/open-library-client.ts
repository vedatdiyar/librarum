import type { IsbnMetadata } from "@/types";
import {
  buildOpenLibraryIsbnCover,
  calculateTitleSimilarity,
  extractAuthors,
  extractPublicationYear,
  fetchJson,
  forceOpenLibraryLargeCover,
  hasEnrichment,
  mergeMetadata,
  normalizeAuthorName,
  normalizeDescription,
  normalizeIsbnToken,
  normalizePublisher,
  normalizeTitleParts,
  scoreOpenLibraryEdition
} from "./isbn-normalizers";

async function fetchOpenLibraryAuthorNamesByKeys(authorKeys: string[] | undefined) {
  const normalizedKeys = Array.from(
    new Set(
      (authorKeys ?? [])
        .map((key) => key.trim())
        .filter((key) => key.startsWith("/authors/"))
        .slice(0, 5)
    )
  );

  if (normalizedKeys.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    normalizedKeys.map(async (key) => {
      const payload = (await fetchJson(`https://openlibrary.org${key}.json`)) as {
        name?: unknown;
      };

      return normalizeAuthorName(payload.name);
    })
  );

  return Array.from(
    new Set(
      results
        .map((result) => (result.status === "fulfilled" ? result.value : null))
        .filter((value): value is string => Boolean(value))
    )
  );
}

async function fetchOpenLibraryMetadata(normalizedIsbn: string) {
  const payload = (await fetchJson(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=data`
  )) as Record<string, unknown>;
  const result = payload[`ISBN:${normalizedIsbn}`] as Record<string, unknown> | undefined;

  if (!result) {
    return null;
  }

  const publisher =
    Array.isArray(result.publishers) && result.publishers[0]
      ? normalizeDescription(result.publishers[0])
      : null;
  const coverRecord =
    result.cover && typeof result.cover === "object"
      ? (result.cover as Record<string, string>)
      : null;

  const metadata: IsbnMetadata = {
    ...(typeof result.title === "string"
      ? normalizeTitleParts(
          result.title,
          typeof result.subtitle === "string"
            ? result.subtitle
            : typeof result.full_title === "string"
              ? result.full_title.replace(new RegExp(`^${result.title}[:\\\\s-]*`, "i"), "")
              : null
        )
      : { title: null, subtitle: null }),
    authors: extractAuthors(result.authors),
    publisher: normalizePublisher(publisher),
    publicationYear: extractPublicationYear(
      typeof result.publish_date === "string" ? result.publish_date : null
    ),
    pageCount:
      typeof result.number_of_pages === "number" ? result.number_of_pages : null,
    coverMetadataUrl:
      buildOpenLibraryIsbnCover(normalizedIsbn) ??
      forceOpenLibraryLargeCover(
        coverRecord?.large ?? coverRecord?.medium ?? coverRecord?.small ?? null
      ),
    description: normalizeDescription(result.description)
  };

  return metadata.title && hasEnrichment(metadata) ? metadata : null;
}

async function fetchOpenLibraryIsbnRecord(normalizedIsbn: string) {
  const result = (await fetchJson(
    `https://openlibrary.org/isbn/${normalizedIsbn}.json`
  )) as {
    title?: string;
    subtitle?: string;
    full_title?: string;
    publishers?: unknown[];
    publish_date?: string;
    number_of_pages?: number;
    covers?: number[];
    authors?: Array<{ key?: string; name?: string }>;
  };

  if (!result) {
    return null;
  }

  const publisher =
    Array.isArray(result.publishers) && result.publishers[0]
      ? normalizeDescription(result.publishers[0])
      : null;
  const firstCoverId = Array.isArray(result.covers) ? result.covers[0] : null;
  const inlineAuthors = extractAuthors(result.authors);
  const authorNamesFromKeys = await fetchOpenLibraryAuthorNamesByKeys(
    (result.authors ?? []).flatMap((author) =>
      typeof author?.key === "string" ? [author.key] : []
    )
  );

  const metadata: IsbnMetadata = {
    ...(typeof result.title === "string"
      ? normalizeTitleParts(
          result.title,
          result.subtitle ??
            (typeof result.full_title === "string"
              ? result.full_title.replace(new RegExp(`^${result.title}[:\\\\s-]*`, "i"), "")
              : null)
        )
      : { title: null, subtitle: null }),
    authors: inlineAuthors.length > 0 ? inlineAuthors : authorNamesFromKeys,
    publisher: normalizePublisher(publisher),
    publicationYear: extractPublicationYear(
      typeof result.publish_date === "string" ? result.publish_date : null
    ),
    pageCount:
      typeof result.number_of_pages === "number" ? result.number_of_pages : null,
    coverMetadataUrl: forceOpenLibraryLargeCover(
      buildOpenLibraryIsbnCover(normalizedIsbn) ??
        (typeof firstCoverId === "number"
          ? `https://covers.openlibrary.org/b/id/${firstCoverId}-L.jpg`
          : null)
    ),
    description: null
  };

  return hasEnrichment(metadata) ? metadata : null;
}

async function fetchOpenLibraryWorkEditionMetadata(
  normalizedIsbn: string,
  titleHint: string,
  firstAuthorHint: string | null
) {
  const searchQuery = [titleHint, firstAuthorHint ?? ""].filter(Boolean).join(" ").trim();

  if (!searchQuery) {
    return null;
  }

  const searchParams = new URLSearchParams({
    q: searchQuery,
    limit: "5"
  });

  const searchPayload = (await fetchJson(
    `https://openlibrary.org/search.json?${searchParams.toString()}`
  )) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
    }>;
  };

  const workCandidates = (searchPayload.docs ?? [])
    .filter((doc) => typeof doc.key === "string" && doc.key.startsWith("/works/"))
    .sort((left, right) => {
      const leftScore = left.title ? calculateTitleSimilarity(left.title, titleHint) : 0;
      const rightScore = right.title ? calculateTitleSimilarity(right.title, titleHint) : 0;
      return rightScore - leftScore;
    });

  const bestWork = workCandidates[0];

  if (!bestWork?.key) {
    return null;
  }

  const editionsPayload = (await fetchJson(
    `https://openlibrary.org${bestWork.key}/editions.json?limit=50`
  )) as {
    entries?: Array<{
      title?: string;
      subtitle?: string;
      publishers?: string[];
      publish_date?: string;
      number_of_pages?: number;
      covers?: number[];
      isbn_13?: string[];
      languages?: Array<{ key?: string }>;
      authors?: Array<{ key?: string; name?: string }>;
    }>;
  };

  const bestEdition = (editionsPayload.entries ?? [])
    .sort(
      (left, right) =>
        scoreOpenLibraryEdition(right, titleHint, normalizedIsbn) -
        scoreOpenLibraryEdition(left, titleHint, normalizedIsbn)
    )[0];

  if (!bestEdition?.title) {
    return null;
  }

  const firstCoverId = Array.isArray(bestEdition.covers) ? bestEdition.covers[0] : null;
  const publisher =
    Array.isArray(bestEdition.publishers) && bestEdition.publishers[0]
      ? normalizeDescription(bestEdition.publishers[0])
      : null;
  const inlineAuthors = extractAuthors(bestEdition.authors);
  const authorNamesFromKeys = await fetchOpenLibraryAuthorNamesByKeys(
    (bestEdition.authors ?? []).flatMap((author) =>
      typeof author?.key === "string" ? [author.key] : []
    )
  );

  const metadata: IsbnMetadata = {
    ...normalizeTitleParts(bestEdition.title, bestEdition.subtitle ?? null),
    authors: inlineAuthors.length > 0 ? inlineAuthors : authorNamesFromKeys,
    publisher: normalizePublisher(publisher),
    publicationYear: extractPublicationYear(bestEdition.publish_date),
    pageCount:
      typeof bestEdition.number_of_pages === "number" ? bestEdition.number_of_pages : null,
    coverMetadataUrl: forceOpenLibraryLargeCover(
      typeof firstCoverId === "number"
        ? `https://covers.openlibrary.org/b/id/${firstCoverId}-L.jpg`
        : null
    ),
    description: null
  };

  return hasEnrichment(metadata) ? metadata : null;
}

export async function loadOpenLibraryEnrichment(
  normalizedIsbn: string,
  titleHint: string,
  firstAuthorHint: string | null
) {
  const [booksApiResult, isbnResult, workEditionResult] = await Promise.allSettled([
    fetchOpenLibraryMetadata(normalizedIsbn),
    fetchOpenLibraryIsbnRecord(normalizedIsbn),
    fetchOpenLibraryWorkEditionMetadata(normalizedIsbn, titleHint, firstAuthorHint)
  ]);

  const candidates = [booksApiResult, isbnResult, workEditionResult]
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter((value): value is IsbnMetadata => Boolean(value));

  if (candidates.length === 0) {
    return null;
  }

  const [base, ...rest] = candidates;
  return rest.reduce((merged, next) => mergeMetadata(merged, next), base);
}
