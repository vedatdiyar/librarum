import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { authors, bookAuthors, books, createDb } from "@/db";
import { normalizeIsbn } from "@/lib/shared";
export { normalizeIsbn };
import type {
  CreateBookResponse,
  DuplicateBookSummary,
  DuplicateCheckInput,
  DuplicateCheckResponse,
  IsbnCoverOption,
  DuplicateReason,
  DuplicateSuggestion,
  IsbnMetadata,
  IsbnMetadataResponse,
  IsbnMetadataSource
} from "@/types";
import { ApiError } from "@/server/api";

const DUPLICATE_SUGGESTIONS: DuplicateSuggestion[] = [
  "increase_copy",
  "new_edition",
  "ignore"
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeTextKey(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSentenceCaseTr(value: string) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return normalized;
  }

  const [firstChar, ...restChars] = normalized;
  return `${firstChar.toLocaleUpperCase("tr-TR")}${restChars.join("")}`;
}

function toTitleCaseTr(value: string) {
  return normalizeWhitespace(value)
    .split(" ")
    .map((part) => {
      if (!part) {
        return part;
      }

      const [firstChar, ...restChars] = part;
      return `${firstChar.toLocaleUpperCase("tr-TR")}${restChars
        .join("")
        .toLocaleLowerCase("tr-TR")}`;
    })
    .join(" ");
}

function normalizeTitleParts(title: string | null, subtitle?: string | null) {
  if (!title) {
    return {
      title: null,
      subtitle: null
    };
  }

  const titleLines = title
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const baseTitleSource = titleLines[0] ?? title;
  const subtitleFromTitleLines = titleLines.length > 1 ? titleLines.slice(1).join(" ") : "";

  const normalizedTitle = toTitleCaseTr(baseTitleSource);
  const normalizedSubtitle = toTitleCaseTr(
    (subtitle && subtitle.trim().length > 0 ? subtitle : subtitleFromTitleLines) ?? ""
  );

  return {
    title: normalizedTitle || null,
    subtitle: normalizedSubtitle || null
  };
}

function buildOpenLibraryIsbnCover(normalizedIsbn: string) {
  const key = normalizeIsbnToken(normalizedIsbn);
  if (!key) {
    return null;
  }

  return `https://covers.openlibrary.org/b/isbn/${key}-L.jpg`;
}

function forceOpenLibraryLargeCover(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  const httpsUrl = url.replace(/^http:/, "https:");

  if (!httpsUrl.includes("covers.openlibrary.org")) {
    return httpsUrl;
  }

  const match = httpsUrl.match(/\/b\/id\/(\d+)-[SML]\.jpg/i);
  if (!match) {
    return httpsUrl;
  }

  return `https://covers.openlibrary.org/b/id/${match[1]}-L.jpg`;
}

function scoreOpenLibraryEdition(
  edition: {
    title?: string;
    subtitle?: string;
    publishers?: string[];
    publish_date?: string;
    number_of_pages?: number;
    covers?: number[];
    isbn_13?: string[];
    languages?: Array<{ key?: string }>;
  },
  titleHint: string,
  normalizedIsbn: string
) {
  const normalizedTarget = normalizeIsbnToken(normalizedIsbn);

  const hasTurkishLanguage = (edition.languages ?? []).some(
    (language) => language.key === "/languages/tur"
  );

  const hasIsbnMatch = (edition.isbn_13 ?? []).some((isbn13) => {
    const token = normalizeIsbnToken(isbn13);
    if (!token || !normalizedTarget) {
      return false;
    }

    return token === normalizedTarget || token.startsWith(normalizedTarget) || normalizedTarget.startsWith(token);
  });

  const titleSimilarity = edition.title
    ? calculateTitleSimilarity(edition.title, titleHint)
    : 0;

  let score = 0;
  if (hasTurkishLanguage) score += 40;
  if (hasIsbnMatch) score += 35;
  if (Array.isArray(edition.publishers) && edition.publishers.length > 0) score += 12;
  if (edition.subtitle) score += 10;
  if (Array.isArray(edition.covers) && edition.covers.length > 0) score += 8;
  if (typeof edition.number_of_pages === "number") score += 4;
  score += titleSimilarity * 20;

  return score;
}

function normalizePublisher(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = normalizeWhitespace(value);
  const normalizedKey = normalizeTextKey(normalized);

  const canonicalMap: Record<string, string> = {
    "is bankasi kultur yayinlari": "İş Bankası Kültür Yayınları",
    "is bankasi kultur yayinlari a s": "İş Bankası Kültür Yayınları",
    "bankas kltr yaynlar": "İş Bankası Kültür Yayınları"
  };

  return canonicalMap[normalizedKey] ?? toTitleCaseTr(normalized);
}

export function assertValidNormalizedIsbn(value: string | null | undefined) {
  const normalizedIsbn = normalizeIsbn(value);

  if (!normalizedIsbn) {
    throw new ApiError(400, "ISBN must be a valid ISBN-10 or ISBN-13.");
  }

  return normalizedIsbn;
}

function normalizeTitleForComparison(value: string) {
  return normalizeWhitespace(
    value
      .toLocaleLowerCase("tr-TR")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/gi, " ")
  );
}

function levenshteinDistance(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1;

      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + substitutionCost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function calculateTitleSimilarity(left: string, right: string) {
  const normalizedLeft = normalizeTitleForComparison(left);
  const normalizedRight = normalizeTitleForComparison(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const maxLength = Math.max(normalizedLeft.length, normalizedRight.length);

  if (maxLength === 0) {
    return 0;
  }

  const distance = levenshteinDistance(normalizedLeft, normalizedRight);
  return Number(((maxLength - distance) / maxLength).toFixed(2));
}

function normalizeDescription(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    return normalized.length > 0 ? normalized : null;
  }

  if (value && typeof value === "object") {
    if ("value" in value && typeof value.value === "string") {
      return normalizeDescription(value.value);
    }

    if ("text" in value && typeof value.text === "string") {
      return normalizeDescription(value.text);
    }
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((part) => normalizeDescription(part))
      .filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join("\n\n") : null;
  }

  return null;
}

function normalizeAuthorName(value: unknown): string | null {
  const name = normalizeDescription(value);
  return name ? toTitleCaseTr(name) : null;
}

function extractAuthors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => {
          if (typeof item === "string") {
            return normalizeAuthorName(item);
          }

          if (item && typeof item === "object") {
            if ("name" in item) {
              return normalizeAuthorName(item.name);
            }

            if ("author" in item) {
              return normalizeAuthorName(item.author);
            }
          }

          return null;
        })
        .filter((name): name is string => Boolean(name))
    )
  );
}

function extractPublicationYear(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/(18|19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function normalizeIsbnToken(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function toHighResGoogleImageUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  // Keep the provider URL intact; rewriting Google cover URLs can surface a page scan
  // instead of the actual cover image.
  return value.replace(/^http:/, "https:");
}

function buildGoogleFrontCoverUrl(volumeId: string | undefined) {
  if (!volumeId) {
    return null;
  }

  return `https://books.google.com/books/publisher/content/images/frontcover/${volumeId}?fife=w1000`;
}

function pickBestGoogleCover(imageLinks: {
  extraLarge?: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
  smallThumbnail?: string;
} | undefined) {
  return (
    toHighResGoogleImageUrl(imageLinks?.extraLarge) ??
    toHighResGoogleImageUrl(imageLinks?.large) ??
    toHighResGoogleImageUrl(imageLinks?.medium) ??
    toHighResGoogleImageUrl(imageLinks?.small) ??
    toHighResGoogleImageUrl(imageLinks?.thumbnail) ??
    toHighResGoogleImageUrl(imageLinks?.smallThumbnail)
  );
}

function mergeMetadata(primary: IsbnMetadata, fallback: IsbnMetadata): IsbnMetadata {
  const primaryCover = primary.coverMetadataUrl;
  const fallbackCover = fallback.coverMetadataUrl;

  // Field strategy:
  // - title/subtitle/cover: prefer Google Books title and cover, Open Library only as fallback
  // - authors/publisher/publicationYear/pageCount: prefer Google (primary)
  const mergedAuthors = primary.authors.length > 0 ? primary.authors : fallback.authors;

  return {
    title: primary.title ?? fallback.title,
    subtitle: primary.subtitle ?? fallback.subtitle,
    authors: mergedAuthors,
    publisher: primary.publisher ?? fallback.publisher,
    publicationYear: primary.publicationYear ?? fallback.publicationYear,
    pageCount: primary.pageCount ?? fallback.pageCount,
    coverMetadataUrl: primaryCover ?? fallbackCover,
    description: primary.description ?? fallback.description
  };
}

function sourceLabel(source: IsbnMetadataSource) {
  return source === "google_books" ? "Google Books" : "Open Library";
}

function buildCoverOptions(input: {
  googleMetadata?: IsbnMetadata | null;
  openLibraryMetadata?: IsbnMetadata | null;
  selectedSource: IsbnMetadataSource;
  selectedCoverUrl: string | null | undefined;
}) {
  const options: IsbnCoverOption[] = [];
  const seen = new Set<string>();

  const addOption = (
    source: IsbnMetadataSource,
    url: string | null | undefined
  ) => {
    if (!url) {
      return;
    }

    const normalizedUrl = url.replace(/^http:/, "https:").trim();
    if (!normalizedUrl || seen.has(normalizedUrl)) {
      return;
    }

    seen.add(normalizedUrl);
    options.push({
      source,
      label: sourceLabel(source),
      url: normalizedUrl
    });
  };

  addOption("google_books", input.googleMetadata?.coverMetadataUrl);
  addOption("open_library", input.openLibraryMetadata?.coverMetadataUrl);
  addOption(input.selectedSource, input.selectedCoverUrl);

  return options;
}

function scoreGoogleVolume(
  volume: {
    title?: string;
    authors?: string[];
    publisher?: string;
    pageCount?: number;
    description?: string;
    imageLinks?: {
      extraLarge?: string;
      large?: string;
      medium?: string;
      small?: string;
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      identifier?: string;
    }>;
  },
  normalizedIsbn: string
) {
  const normalizedTarget = normalizeIsbnToken(normalizedIsbn);
  const hasExactIsbn = (volume.industryIdentifiers ?? []).some(
    (identifier) => normalizeIsbnToken(identifier.identifier) === normalizedTarget
  );

  let score = 0;
  if (hasExactIsbn) score += 100;
  if (volume.publisher) score += 20;
  if (Array.isArray(volume.authors) && volume.authors.length > 0) score += 12;
  if (pickBestGoogleCover(volume.imageLinks)) score += 8;
  if (typeof volume.pageCount === "number") score += 6;
  if (volume.description) score += 4;
  if (volume.title) score += 2;

  return score;
}

function hasEnrichment(metadata: IsbnMetadata) {
  return Boolean(
    metadata.authors.length > 0 ||
    metadata.publisher ||
      metadata.publicationYear ||
      metadata.pageCount ||
      metadata.coverMetadataUrl ||
      metadata.description
  );
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`External fetch failed with status ${response.status}`);
  }

  return response.json();
}

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
              ? result.full_title.replace(new RegExp(`^${result.title}[:\\s-]*`, "i"), "")
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
              ? result.full_title.replace(new RegExp(`^${result.title}[:\\s-]*`, "i"), "")
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

async function loadOpenLibraryEnrichment(
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

async function fetchGoogleBooksMetadata(normalizedIsbn: string) {
  const apiKey = process.env.LIBRARUM_GOOGLE_BOOKS_API_KEY;
  const searchParams = new URLSearchParams({
    q: `isbn:${normalizedIsbn}`,
    maxResults: "10",
    printType: "books",
    fields:
      "items(id,volumeInfo(title,subtitle,authors,publisher,publishedDate,pageCount,description,imageLinks(extraLarge,large,medium,small,thumbnail,smallThumbnail),industryIdentifiers(identifier)))"
  });

  if (apiKey) {
    searchParams.set("key", apiKey);
  }

  const payload = (await fetchJson(
    `https://www.googleapis.com/books/v1/volumes?${searchParams.toString()}`
  )) as {
    items?: Array<{
      id?: string;
      volumeInfo?: {
        title?: string;
        subtitle?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        pageCount?: number;
        description?: string;
        imageLinks?: {
          extraLarge?: string;
          large?: string;
          medium?: string;
          small?: string;
          thumbnail?: string;
          smallThumbnail?: string;
        };
        industryIdentifiers?: Array<{
          identifier?: string;
        }>;
      };
    }>;
  };

  const sortedVolumes = (payload.items ?? [])
    .flatMap((item) =>
      item.volumeInfo ? [{ id: item.id, volumeInfo: item.volumeInfo }] : []
    )
    .sort(
      (left, right) =>
        scoreGoogleVolume(right.volumeInfo, normalizedIsbn) -
        scoreGoogleVolume(left.volumeInfo, normalizedIsbn)
    );

  const volume = sortedVolumes[0];

  if (!volume?.volumeInfo?.title) {
    return null;
  }

  const volumeInfo = volume.volumeInfo;
  const primaryAuthors = extractAuthors(volumeInfo.authors);
  const fallbackAuthors = sortedVolumes
    .map((item) => extractAuthors(item.volumeInfo.authors))
    .find((authors) => authors.length > 0);

  const metadata: IsbnMetadata = {
    ...normalizeTitleParts(volumeInfo.title ?? null, volumeInfo.subtitle ?? null),
    authors: primaryAuthors.length > 0 ? primaryAuthors : (fallbackAuthors ?? []),
    publisher: normalizePublisher(
      volumeInfo.publisher ? normalizeWhitespace(volumeInfo.publisher) : null
    ),
    publicationYear: extractPublicationYear(volumeInfo.publishedDate),
    pageCount: typeof volumeInfo.pageCount === "number" ? volumeInfo.pageCount : null,
    coverMetadataUrl:
      buildGoogleFrontCoverUrl(volume.id) ?? pickBestGoogleCover(volumeInfo.imageLinks),
    description: normalizeDescription(volumeInfo.description)
  };

  return metadata;
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

      return {
        found: true,
        source: "google_books",
        metadata,
        coverOptions: buildCoverOptions({
          googleMetadata,
          openLibraryMetadata,
          selectedSource: "google_books",
          selectedCoverUrl: metadata.coverMetadataUrl
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
      return {
        found: true,
        source: "open_library",
        metadata: openLibraryMetadata,
        coverOptions: buildCoverOptions({
          googleMetadata,
          openLibraryMetadata,
          selectedSource: "open_library",
          selectedCoverUrl: openLibraryMetadata.coverMetadataUrl
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

async function loadDuplicateSummary(bookId: string): Promise<DuplicateBookSummary> {
  const db = createDb();
  const [bookRows, authorRows] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        isbn: books.isbn,
        copyCount: books.copyCount,
        status: books.status,
        coverUrl: sql<string | null>`coalesce(${books.coverCustomUrl}, ${books.coverMetadataUrl})`
      })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1),
    db
      .select({
        id: authors.id,
        name: authors.name,
        slug: authors.slug
      })
      .from(bookAuthors)
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(eq(bookAuthors.bookId, bookId))
      .orderBy(asc(authors.name))
  ]);

  const existingBook = bookRows[0];

  if (!existingBook) {
    throw new ApiError(404, "Book not found.");
  }

  return {
    id: existingBook.id,
    title: existingBook.title,
    authors: authorRows,
    isbn: existingBook.isbn,
    copyCount: existingBook.copyCount,
    status: existingBook.status,
    coverUrl: existingBook.coverUrl
  };
}

function buildDuplicateResponse(
  reason: DuplicateReason,
  confidence: number,
  existingBook: DuplicateBookSummary
): DuplicateCheckResponse {
  return {
    isDuplicate: true,
    reason,
    confidence,
    existingBook,
    suggestions: DUPLICATE_SUGGESTIONS
  };
}

export async function checkDuplicateBook(
  input: DuplicateCheckInput
): Promise<DuplicateCheckResponse> {
  const db = createDb();
  const normalizedIsbn = normalizeIsbn(input.isbn);

  if (normalizedIsbn) {
    const isbnMatches = await db
      .select({
        id: books.id
      })
      .from(books)
      .where(
        and(
          sql`regexp_replace(upper(coalesce(${books.isbn}, '')), '[^0-9X]', '', 'g') = ${normalizedIsbn}`,
          input.excludeBookId ? ne(books.id, input.excludeBookId) : undefined
        )
      )
      .orderBy(desc(books.createdAt))
      .limit(1);

    if (isbnMatches[0]) {
      return buildDuplicateResponse(
        "isbn_exact",
        1,
        await loadDuplicateSummary(isbnMatches[0].id)
      );
    }
  }

  const candidateIds = await db
    .selectDistinct({
      id: books.id,
      createdAt: books.createdAt
    })
    .from(books)
    .innerJoin(bookAuthors, eq(bookAuthors.bookId, books.id))
    .where(
      and(
        inArray(bookAuthors.authorId, input.authorIds),
        input.excludeBookId ? ne(books.id, input.excludeBookId) : undefined
      )
    )
    .orderBy(desc(books.createdAt));

  if (candidateIds.length === 0) {
    return {
      isDuplicate: false
    };
  }

  const candidateBooks = await db
    .select({
      id: books.id,
      title: books.title,
      subtitle: books.subtitle
    })
    .from(books)
    .where(
      inArray(
        books.id,
        candidateIds.map((candidate) => candidate.id)
      )
    );

  let bestCandidate: { id: string; confidence: number } | null = null;

  for (const candidateBook of candidateBooks) {
    const inputDisplayTitle = `${input.title} ${input.subtitle ?? ""}`.trim();
    const candidateDisplayTitle = `${candidateBook.title} ${candidateBook.subtitle ?? ""}`.trim();
    const confidence = calculateTitleSimilarity(inputDisplayTitle, candidateDisplayTitle);

    if (confidence < 0.85) {
      continue;
    }

    if (!bestCandidate || confidence > bestCandidate.confidence) {
      bestCandidate = {
        id: candidateBook.id,
        confidence
      };
    }
  }

  if (!bestCandidate) {
    return {
      isDuplicate: false
    };
  }

  return buildDuplicateResponse(
    "title_author_match",
    bestCandidate.confidence,
    await loadDuplicateSummary(bestCandidate.id)
  );
}

export function normalizeCreateBookResult(
  action: CreateBookResponse["action"],
  book: CreateBookResponse["book"]
): CreateBookResponse {
  return {
    action,
    book
  };
}
