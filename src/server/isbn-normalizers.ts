import { normalizeIsbn } from "@/lib/helpers";
import type { IsbnCoverOption, IsbnMetadata, IsbnMetadataSource } from "@/types";

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeTextKey(value: string) {
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

export function toTitleCaseTr(value: string) {
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

export function normalizeTitleParts(title: string | null, subtitle?: string | null) {
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

export function normalizeIsbnToken(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function buildOpenLibraryIsbnCover(normalizedIsbn: string) {
  const key = normalizeIsbnToken(normalizedIsbn);
  if (!key) {
    return null;
  }

  return `https://covers.openlibrary.org/b/isbn/${key}-L.jpg`;
}

export function forceOpenLibraryLargeCover(url: string | null | undefined) {
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

export function normalizePublisher(value: string | null) {
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

export function calculateTitleSimilarity(left: string, right: string) {
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

export function normalizeDescription(value: unknown): string | null {
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

export function normalizeAuthorName(value: unknown): string | null {
  const name = normalizeDescription(value);
  return name ? toTitleCaseTr(name) : null;
}

export function extractAuthors(value: unknown): string[] {
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

export function extractPublicationYear(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/(18|19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function toHighResGoogleImageUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  // Keep the provider URL intact; rewriting Google cover URLs can surface a page scan
  // instead of the actual cover image.
  return value.replace(/^http:/, "https:");
}

export function buildGoogleFrontCoverUrl(volumeId: string | undefined) {
  if (!volumeId) {
    return null;
  }

  return `https://books.google.com/books/publisher/content/images/frontcover/${volumeId}?fife=w1000`;
}

export function pickBestGoogleCover(imageLinks: {
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

export function mergeMetadata(primary: IsbnMetadata, fallback: IsbnMetadata): IsbnMetadata {
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

export function buildCoverOptions(input: {
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

export function scoreGoogleVolume(
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

export function scoreOpenLibraryEdition(
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

export function hasEnrichment(metadata: IsbnMetadata) {
  return Boolean(
    metadata.authors.length > 0 ||
    metadata.publisher ||
      metadata.publicationYear ||
      metadata.pageCount ||
      metadata.coverMetadataUrl ||
      metadata.description
  );
}

export async function fetchJson(url: string, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`External fetch failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("External fetch timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
