import type { IsbnMetadata } from "@/types";
import {
  buildGoogleFrontCoverUrl,
  extractAuthors,
  extractPublicationYear,
  fetchJson,
  normalizePublisher,
  normalizeWhitespace,
  normalizeTitleParts,
  normalizeDescription,
  pickBestGoogleCover,
  scoreGoogleVolume
} from "./isbn-normalizers";

export async function fetchGoogleBooksMetadata(normalizedIsbn: string) {
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
