import { eq, inArray } from "drizzle-orm";
import type {
  AuthorOption,
  AuthorResolutionDecision,
  AuthorResolutionResponse
} from "@/types";
import { authorAliases, authors, createDb } from "@/db";
import { buildUniqueSlug, normalizeText } from "@/lib/shared";
import { ApiError } from "@/server/api";

type DbClient = ReturnType<typeof createDb>;
type TransactionClient = Parameters<DbClient["transaction"]>[0] extends (
  tx: infer T
) => Promise<unknown>
  ? T
  : never;
type DbExecutor = DbClient | TransactionClient;

type AuthorCandidate = {
  author: AuthorOption;
  sourceName: string;
  normalizedName: string;
};

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};

function transliterateCyrillic(value: string) {
  return Array.from(value)
    .map((char) => CYRILLIC_TO_LATIN_MAP[char] ?? char)
    .join("");
}

export function normalizeAuthorNameKey(name: string) {
  // Transliterate then perform robust normalization
  const transliterated = transliterateCyrillic(name.toLocaleLowerCase("tr-TR"));
  
  // Standardize Turkish characters before they get stripped or messed up by generic NFD
  // In TR locale: İ -> i, I -> ı. We want everything to be 'i' if possible for maximum matching
  return normalizeText(transliterated)
    .replace(/ı/g, "i") // Double check normalization side
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeAuthorName(name: string) {
  return normalizeAuthorNameKey(name)
    .split(" ")
    .filter(Boolean);
}

function buildCompactAuthorName(name: string) {
  const parts = tokenizeAuthorName(name);

  if (parts.length < 3) {
    return null;
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
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

function countSharedTokens(leftTokens: string[], rightTokens: string[]) {
  const rightPool = [...rightTokens];
  let matchCount = 0;

  leftTokens.forEach((token) => {
    const index = rightPool.findIndex((candidate) => candidate === token);
    if (index >= 0) {
      matchCount += 1;
      rightPool.splice(index, 1);
    }
  });

  return matchCount;
}

export function isAutoMergeMatch(leftName: string, rightName: string) {
  if (leftName === rightName) {
    return true;
  }

  const leftTokens = leftName.split(" ").filter(Boolean);
  const rightTokens = rightName.split(" ").filter(Boolean);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return false;
  }

  // Token weights: help distinguish between "Real Matches" and "Random common names"
  const isTokenMatch = (t1: string, t2: string) => {
    if (t1 === t2) return true;
    // Initial handling: "m" matches "mihaylovic"
    if (t1.length === 1 && t2.startsWith(t1)) return true;
    if (t2.length === 1 && t1.startsWith(t2)) return true;
    // Tiny typo handling for longer names
    if (t1.length > 4 && t2.length > 4 && levenshteinDistance(t1, t2) <= 1) return true;
    return false;
  };

  // If pairwise order matches (most common case)
  if (leftTokens.length === rightTokens.length) {
    const allMatch = leftTokens.every((token, i) => isTokenMatch(token, rightTokens[i]));
    if (allMatch) return true;
  }

  // Position-independent checks (e.g. "Dostoyevski, Fyodor" vs "Fyodor Dostoyevski")
  const findMatches = (source: string[], target: string[]) => {
    const tPool = [...target];
    let count = 0;
    source.forEach(sToken => {
      const idx = tPool.findIndex(tToken => isTokenMatch(sToken, tToken));
      if (idx !== -1) {
        count++;
        tPool.splice(idx, 1);
      }
    });
    return count;
  };

  const sharedCount = findMatches(leftTokens, rightTokens);
  const minRequired = Math.min(leftTokens.length, rightTokens.length);

  // If everything in the shorter name is found in the longer name, it's a match
  if (sharedCount >= minRequired && Math.abs(leftTokens.length - rightTokens.length) <= 1) {
    // Ensure the first and last "significant" parts match (avoiding false positives like "J. Doe" vs "A. Doe")
    const longestLeft = [...leftTokens].sort((a, b) => b.length - a.length)[0];
    const longestRight = [...rightTokens].sort((a, b) => b.length - a.length)[0];
    
    if (isTokenMatch(longestLeft, longestRight)) {
      return true;
    }
  }

  return false;
}

function isSuggestedMergeMatch(leftName: string, rightName: string) {
  const leftTokens = leftName.split(" ").filter(Boolean);
  const rightTokens = rightName.split(" ").filter(Boolean);

  if (leftTokens.length < 2 || rightTokens.length < 2) {
    return false;
  }

  // Helper for initial-aware token matching
  const isTokenMatch = (t1: string, t2: string) => {
    if (t1 === t2) return true;
    if (t1.length === 1 && t2.startsWith(t1)) return true;
    if (t2.length === 1 && t1.startsWith(t2)) return true;
    // Allow small typos in longer tokens
    if (t1.length > 3 && t2.length > 3 && levenshteinDistance(t1, t2) <= 1) return true;
    return false;
  };

  const countMatches = () => {
    const rightPool = [...rightTokens];
    let matchCount = 0;
    leftTokens.forEach((token) => {
      const index = rightPool.findIndex((candidate) => isTokenMatch(token, candidate));
      if (index >= 0) {
        matchCount += 1;
        rightPool.splice(index, 1);
      }
    });
    return matchCount;
  };

  const sharedCount = countMatches();
  const maxTokens = Math.max(leftTokens.length, rightTokens.length);
  const overlapRatio = sharedCount / maxTokens;
  
  const sharesBoundaryToken =
    isTokenMatch(leftTokens[0], rightTokens[0]) ||
    isTokenMatch(leftTokens[leftTokens.length - 1], rightTokens[rightTokens.length - 1]);

  return overlapRatio >= 0.6 && sharesBoundaryToken;
}

async function loadAuthorCandidates(db: DbExecutor) {
  const [authorRows, aliasRows] = await Promise.all([
    db
      .select({
        id: authors.id,
        name: authors.name,
        slug: authors.slug
      })
      .from(authors),
    db
      .select({
        authorId: authorAliases.authorId,
        name: authorAliases.name,
        normalizedName: authorAliases.normalizedName
      })
      .from(authorAliases)
  ]);

  const authorsById = new Map<string, AuthorOption>();
  const candidates: AuthorCandidate[] = [];

  authorRows.forEach((row) => {
    const author = {
      id: row.id,
      name: row.name,
      slug: row.slug
    };

    authorsById.set(row.id, author);
    candidates.push({
      author,
      sourceName: row.name,
      normalizedName: normalizeAuthorNameKey(row.name)
    });
  });

  aliasRows.forEach((row) => {
    const author = authorsById.get(row.authorId);
    if (!author) {
      return;
    }

    candidates.push({
      author,
      sourceName: row.name,
      normalizedName: row.normalizedName
    });
  });

  return candidates;
}

async function authorSlugExists(db: DbExecutor, slug: string, excludedId?: string) {
  const rows = await db
    .select({
      id: authors.id
    })
    .from(authors)
    .where(
      excludedId
        ? eq(authors.slug, slug)
        : eq(authors.slug, slug)
    );

  if (!excludedId) {
    return rows.length > 0;
  }

  return rows.some((row) => row.id !== excludedId);
}

async function computeAuthorSlug(db: DbExecutor, name: string, authorId: string) {
  const baseSlug = buildUniqueSlug(name, authorId, "author", () => false);

  if (!(await authorSlugExists(db, baseSlug, authorId))) {
    return baseSlug;
  }

  return buildUniqueSlug(name, authorId, "author", () => true);
}

export async function resolveAuthorIdentity(
  db: DbExecutor,
  name: string
): Promise<AuthorResolutionResponse | null> {
  const trimmedName = name.trim();
  const normalizedName = normalizeAuthorNameKey(trimmedName);

  if (!normalizedName) {
    return null;
  }

  const candidates = await loadAuthorCandidates(db);

  const exactCandidate = candidates.find(
    (candidate) => candidate.normalizedName === normalizedName
  );

  if (exactCandidate) {
    return {
      status: "auto-merge",
      inputName: trimmedName,
      author: exactCandidate.author
    };
  }

  const autoCandidate = candidates.find((candidate) =>
    isAutoMergeMatch(candidate.normalizedName, normalizedName)
  );

  if (autoCandidate) {
    return {
      status: "auto-merge",
      inputName: trimmedName,
      author: autoCandidate.author
    };
  }

  const suggestedCandidate = candidates.find((candidate) =>
    isSuggestedMergeMatch(candidate.normalizedName, normalizedName)
  );

  if (suggestedCandidate) {
    return {
      status: "auto-merge",
      inputName: trimmedName,
      author: suggestedCandidate.author
    };
  }

  return null;
}

async function createAuthorRecord(db: DbExecutor, name: string) {
  const authorId = crypto.randomUUID();
  const slug = await computeAuthorSlug(db, name, authorId);
  const createdAuthor = await db
    .insert(authors)
    .values({
      id: authorId,
      name,
      slug
    })
    .returning({
      id: authors.id,
      name: authors.name,
      slug: authors.slug
    });

  await syncAuthorAliases(db, createdAuthor[0].id, name);

  return {
    status: "created" as const,
    inputName: name,
    author: createdAuthor[0]
  };
}

export async function resolveOrCreateAuthor(
  db: DbExecutor,
  name: string,
  input?: {
    decision?: AuthorResolutionDecision;
    suggestedAuthorId?: string;
  }
): Promise<AuthorResolutionResponse> {
  const trimmedName = name.trim();
  const resolution = await resolveAuthorIdentity(db, trimmedName);

  if (!resolution) {
    return createAuthorRecord(db, trimmedName);
  }

  if (resolution.status === "auto-merge") {
    await syncAuthorAliases(db, resolution.author.id, resolution.author.name, [trimmedName]);
    return resolution;
  }

  if (resolution.status !== "suggested-merge") {
    return resolution;
  }

  if (!input?.decision) {
    return resolution;
  }

  if (
    input.suggestedAuthorId &&
    input.suggestedAuthorId !== resolution.suggestedAuthor.id
  ) {
    throw new ApiError(400, "Suggested author no longer matches.");
  }

  if (input.decision === "same_author") {
    await syncAuthorAliases(
      db,
      resolution.suggestedAuthor.id,
      resolution.suggestedAuthor.name,
      [trimmedName]
    );

    return {
      status: "auto-merge",
      inputName: trimmedName,
      author: resolution.suggestedAuthor
    };
  }

  return createAuthorRecord(db, trimmedName);
}

export async function syncAuthorAliases(
  db: DbExecutor,
  authorId: string,
  primaryName: string,
  extraNames: string[] = []
) {
  const aliasCandidates = new Map<string, string>();
  const registerAlias = (value: string | null | undefined) => {
    if (!value) {
      return;
    }

    const trimmedValue = value.trim();
    const normalizedValue = normalizeAuthorNameKey(trimmedValue);

    if (!trimmedValue || !normalizedValue) {
      return;
    }

    aliasCandidates.set(normalizedValue, trimmedValue);
  };

  registerAlias(primaryName);
  registerAlias(buildCompactAuthorName(primaryName));

  extraNames.forEach((name) => {
    registerAlias(name);
    registerAlias(buildCompactAuthorName(name));
  });

  if (aliasCandidates.size === 0) {
    return;
  }

  const normalizedNames = Array.from(aliasCandidates.keys());
  const existingAliases = await db
    .select({
      normalizedName: authorAliases.normalizedName,
      authorId: authorAliases.authorId
    })
    .from(authorAliases)
    .where(inArray(authorAliases.normalizedName, normalizedNames));

  const blockedNames = new Set(
    existingAliases
      .filter((alias) => alias.authorId !== authorId)
      .map((alias) => alias.normalizedName)
  );

  const rowsToInsert = normalizedNames
    .filter((normalizedName) => !blockedNames.has(normalizedName))
    .map((normalizedName) => ({
      authorId,
      name: aliasCandidates.get(normalizedName) ?? normalizedName,
      normalizedName
    }));

  if (rowsToInsert.length === 0) {
    return;
  }

  await db.insert(authorAliases).values(rowsToInsert).onConflictDoNothing();
}

export async function isAuthorNameAvailable(
  db: DbExecutor,
  name: string,
  excludedAuthorId?: string
) {
  const normalizedName = normalizeAuthorNameKey(name.trim());

  if (!normalizedName) {
    return false;
  }

  const existingAliases = await db
    .select({
      authorId: authorAliases.authorId
    })
    .from(authorAliases)
    .where(eq(authorAliases.normalizedName, normalizedName))
    .limit(1);

  if (!existingAliases[0]) {
    return true;
  }

  return excludedAuthorId ? existingAliases[0].authorId === excludedAuthorId : false;
}
