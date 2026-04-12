import { eq, inArray } from "drizzle-orm";
import type {
  PublisherOption,
  PublisherResolutionResponse
} from "@/types";
import { publishers, publisherAliases, createDb } from "@/db";
import { buildUniqueSlug, normalizeText } from "@/lib/helpers";
import { ApiError } from "@/server/api";

type DbClient = ReturnType<typeof createDb>;
type TransactionClient = Parameters<DbClient["transaction"]>[0] extends (
  tx: infer T
) => Promise<unknown>
  ? T
  : never;
type DbExecutor = DbClient | TransactionClient;

type PublisherCandidate = {
  publisher: PublisherOption;
  sourceName: string;
  normalizedName: string;
};

// Common publisher suffixes that should be treated as minor tokens
const PUBLISHER_STOP_WORDS = [
  "yayinlari",
  "yayin",
  "yayinevi",
  "kultur",
  "cocuk",
  "klasikler",
  "klasikleri",
  "basim",
  "dagitim"
];

export function normalizePublisherNameKey(name: string) {
  // Use Turkish-aware lowercase for transliteration/normalization
  const lower = name.toLocaleLowerCase("tr-TR");
  let normalized = normalizeText(lower)
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();

  // Remove common suffixes to match "İş Bankası Yayınları" with "İş Bankası"
  const tokens = normalized.split(" ");
  const cleanTokens = tokens.filter(t => !PUBLISHER_STOP_WORDS.includes(t));
  
  // If we stripped everything, revert to original tokens
  if (cleanTokens.length === 0) return normalized;
  
  return cleanTokens.join(" ");
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

export function isAutoMergeMatch(leftName: string, rightName: string) {
  const leftNorm = normalizePublisherNameKey(leftName);
  const rightNorm = normalizePublisherNameKey(rightName);

  if (leftNorm === rightNorm) {
    return true;
  }

  // Handle tiny typos (1 char difference for names > 5 chars)
  if (leftNorm.length > 5 && rightNorm.length > 5) {
    if (levenshteinDistance(leftNorm, rightNorm) <= 1) {
      return true;
    }
  }

  // Token pool matching
  const leftTokens = leftNorm.split(" ");
  const rightTokens = rightNorm.split(" ");
  
  const common = leftTokens.filter(t => rightTokens.includes(t));
  const minRequired = Math.min(leftTokens.length, rightTokens.length);

  // If at least 80% or 2 major tokens match, it's likely the same
  if (common.length >= minRequired && common.length >= 1) {
    return true;
  }

  return false;
}

async function loadPublisherCandidates(db: DbExecutor) {
  const [publisherRows, aliasRows] = await Promise.all([
    db
      .select({
        id: publishers.id,
        name: publishers.name,
        slug: publishers.slug
      })
      .from(publishers),
    db
      .select({
        publisherId: publisherAliases.publisherId,
        name: publisherAliases.name,
        normalizedName: publisherAliases.normalizedName
      })
      .from(publisherAliases)
  ]);

  const publishersById = new Map<string, PublisherOption>();
  const candidates: PublisherCandidate[] = [];

  publisherRows.forEach((row) => {
    const publisher = {
      id: row.id,
      name: row.name,
      slug: row.slug
    };

    publishersById.set(row.id, publisher);
    candidates.push({
      publisher,
      sourceName: row.name,
      normalizedName: normalizePublisherNameKey(row.name)
    });
  });

  aliasRows.forEach((row) => {
    const publisher = publishersById.get(row.publisherId);
    if (!publisher) {
      return;
    }

    candidates.push({
      publisher,
      sourceName: row.name,
      normalizedName: row.normalizedName
    });
  });

  return candidates;
}

async function publisherSlugExists(db: DbExecutor, slug: string, excludedId?: string) {
  const rows = await db
    .select({
      id: publishers.id
    })
    .from(publishers)
    .where(eq(publishers.slug, slug));

  if (!excludedId) {
    return rows.length > 0;
  }

  return rows.some((row) => row.id !== excludedId);
}

async function computePublisherSlug(db: DbExecutor, name: string, publisherId: string) {
  const baseSlug = buildUniqueSlug(name, publisherId, "publisher", () => false);

  if (!(await publisherSlugExists(db, baseSlug, publisherId))) {
    return baseSlug;
  }

  return buildUniqueSlug(name, publisherId, "publisher", () => true);
}

export async function resolvePublisherIdentity(
  db: DbExecutor,
  name: string
): Promise<PublisherResolutionResponse | null> {
  const trimmedName = name.trim();
  const normalizedName = normalizePublisherNameKey(trimmedName);

  if (!normalizedName) {
    return null;
  }

  const candidates = await loadPublisherCandidates(db);

  // 1. Exact match on normalized keys
  const exactMatch = candidates.find(c => c.normalizedName === normalizedName);
  if (exactMatch) {
    return {
      status: "auto-merge",
      inputName: trimmedName,
      publisher: exactMatch.publisher
    };
  }

  // 2. Fuzzy match
  const fuzzyMatch = candidates.find(c => isAutoMergeMatch(c.normalizedName, normalizedName));
  if (fuzzyMatch) {
    return {
      status: "auto-merge",
      inputName: trimmedName,
      publisher: fuzzyMatch.publisher
    };
  }

  return null;
}

export async function resolveOrCreatePublisher(
  db: DbExecutor,
  name: string
): Promise<PublisherResolutionResponse> {
  const trimmedName = name.trim();
  const resolution = await resolvePublisherIdentity(db, trimmedName);

  if (resolution) {
    // Sync the alias if it's a new variation
    const publisher = resolution.status === "suggested-merge" 
      ? resolution.suggestedPublisher 
      : resolution.publisher;
      
    await syncPublisherAliases(db, publisher.id, publisher.name, [trimmedName]);
    return resolution;
  }

  // Create new publisher
  const publisherId = crypto.randomUUID();
  const slug = await computePublisherSlug(db, trimmedName, publisherId);
  const created = await db
    .insert(publishers)
    .values({
      id: publisherId,
      name: trimmedName,
      slug
    })
    .returning({
      id: publishers.id,
      name: publishers.name,
      slug: publishers.slug
    });

  await syncPublisherAliases(db, created[0].id, trimmedName);

  return {
    status: "created",
    inputName: trimmedName,
    publisher: created[0]
  };
}

export async function syncPublisherAliases(
  db: DbExecutor,
  publisherId: string,
  primaryName: string,
  extraNames: string[] = []
) {
  const aliasCandidates = new Map<string, string>();
  const registerAlias = (value: string | null | undefined) => {
    if (!value) return;
    const trimmed = value.trim();
    const normalized = normalizePublisherNameKey(trimmed);
    if (!trimmed || !normalized) return;
    aliasCandidates.set(normalized, trimmed);
  };

  registerAlias(primaryName);
  extraNames.forEach(registerAlias);

  if (aliasCandidates.size === 0) return;

  const normalizedNames = Array.from(aliasCandidates.keys());
  const existingAliases = await db
    .select({
      normalizedName: publisherAliases.normalizedName,
      publisherId: publisherAliases.publisherId
    })
    .from(publisherAliases)
    .where(inArray(publisherAliases.normalizedName, normalizedNames));

  const blockedNames = new Set(
    existingAliases
      .filter(a => a.publisherId !== publisherId)
      .map(a => a.normalizedName)
  );

  const rowsToInsert = normalizedNames
    .filter(name => !blockedNames.has(name))
    .map(name => ({
      publisherId,
      name: aliasCandidates.get(name) ?? name,
      normalizedName: name
    }));

  if (rowsToInsert.length > 0) {
    await db.insert(publisherAliases).values(rowsToInsert).onConflictDoNothing();
  }
}
