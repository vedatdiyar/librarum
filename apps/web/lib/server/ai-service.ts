import { desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  EXLIBRIS_GEMINI_MODEL,
  EXLIBRIS_GEMINI_TEMPERATURE,
  buildManualChatPrompt,
  buildMonthlySuggestionsPrompt,
  monthlySuggestionsResponseSchema
} from "@exlibris/ai";
import {
  aiSuggestions,
  authors,
  bookAuthors,
  bookSeries,
  books,
  categories,
  createDb,
  recommendationPreferences,
  series,
  tags,
  bookTags
} from "@exlibris/db";
import type {
  AiSuggestionPayload,
  AiSuggestionRecord
} from "@exlibris/types";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { ApiError } from "@/lib/server/api";
import { monthlySuggestionModelSchema } from "@/lib/server/ai-schemas";
import { searchBooks } from "@/lib/server/search-service";
import { normalizeText } from "@exlibris/lib";

type Blocklist = {
  authors: string[];
  categories: string[];
  tags: string[];
};

type AiBookSummary = {
  id: string;
  title: string;
  authors: string[];
  category: string | null;
  tags: string[];
  status: string;
  rating: number | null;
  donatable: boolean;
  series: string | null;
  seriesOrder: number | null;
  createdAt: string;
};

type SeriesGapSummary = {
  series: string;
  totalVolumes: number;
  ownedVolumes: number[];
  missingVolumes: number[];
};

const APPROX_CHARS_PER_TOKEN = 4;
const SUMMARY_BUDGET = 500 * APPROX_CHARS_PER_TOKEN;
const SUBSET_BUDGET = 1500 * APPROX_CHARS_PER_TOKEN;
const TOTAL_CONTEXT_BUDGET = 2000 * APPROX_CHARS_PER_TOKEN;
const STOPWORDS = new Set([
  "acaba",
  "ama",
  "bana",
  "ben",
  "bir",
  "bu",
  "da",
  "de",
  "daha",
  "en",
  "gibi",
  "hangi",
  "icin",
  "için",
  "ile",
  "mi",
  "mu",
  "mü",
  "ne",
  "neler",
  "neleri",
  "olan",
  "olarak",
  "onu",
  "ve",
  "ya",
  "yada"
]);

let cachedClient: GoogleGenAI | null = null;

function getAiClient() {
  const apiKey = process.env.EXLIBRIS_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("EXLIBRIS_GEMINI_API_KEY is not set.");
  }

  cachedClient ??= new GoogleGenAI({ apiKey });
  return cachedClient;
}


function truncateText(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function formatBookLine(book: AiBookSummary) {
  const bits = [
    `- ${book.title}`,
    `yazar: ${book.authors.join(", ") || "belirtilmedi"}`,
    `kategori: ${book.category ?? "belirtilmedi"}`,
    `etiketler: ${book.tags.join(", ") || "yok"}`,
    `durum: ${book.status}`,
    `puan: ${book.rating ?? "yok"}`,
    `bagislanabilir: ${book.donatable ? "evet" : "hayir"}`
  ];

  if (book.series) {
    bits.push(`seri: ${book.series}${book.seriesOrder ? ` #${book.seriesOrder}` : ""}`);
  }

  return bits.join(" | ");
}

function formatSeriesGapLine(item: SeriesGapSummary) {
  return `- ${item.series} | toplam cilt: ${item.totalVolumes} | sahip olunan: ${item.ownedVolumes.join(", ")} | eksik: ${item.missingVolumes.join(", ")}`;
}

function buildBoundedContext(collectionSummary: string, subset: string) {
  const boundedSummary = truncateText(collectionSummary, SUMMARY_BUDGET);
  const remaining = Math.max(0, TOTAL_CONTEXT_BUDGET - boundedSummary.length);
  const maxSubsetChars = Math.min(SUBSET_BUDGET, remaining);

  return {
    collectionSummary: boundedSummary,
    subset: truncateText(subset, maxSubsetChars)
  };
}

async function fetchBooksByIds(ids: string[]) {
  const db = createDb();

  if (ids.length === 0) {
    return [];
  }

  const [bookRows, authorRows, tagRows] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        category: categories.name,
        status: books.status,
        rating: books.rating,
        donatable: books.donatable,
        series: series.name,
        seriesOrder: bookSeries.seriesOrder,
        createdAt: books.createdAt
      })
      .from(books)
      .leftJoin(categories, eq(categories.id, books.categoryId))
      .leftJoin(bookSeries, eq(bookSeries.bookId, books.id))
      .leftJoin(series, eq(series.id, bookSeries.seriesId))
      .where(inArray(books.id, ids)),
    db
      .select({
        bookId: bookAuthors.bookId,
        author: authors.name
      })
      .from(bookAuthors)
      .innerJoin(authors, eq(authors.id, bookAuthors.authorId))
      .where(inArray(bookAuthors.bookId, ids)),
    db
      .select({
        bookId: bookTags.bookId,
        tag: tags.name
      })
      .from(bookTags)
      .innerJoin(tags, eq(tags.id, bookTags.tagId))
      .where(inArray(bookTags.bookId, ids))
  ]);

  const authorsByBookId = new Map<string, string[]>();
  const tagsByBookId = new Map<string, string[]>();

  authorRows.forEach((row) => {
    const current = authorsByBookId.get(row.bookId) ?? [];
    current.push(row.author);
    authorsByBookId.set(row.bookId, current);
  });

  tagRows.forEach((row) => {
    const current = tagsByBookId.get(row.bookId) ?? [];
    current.push(row.tag);
    tagsByBookId.set(row.bookId, current);
  });

  const order = new Map(ids.map((id, index) => [id, index]));

  return bookRows
    .map((row) => ({
      id: row.id,
      title: row.title,
      authors: authorsByBookId.get(row.id) ?? [],
      category: row.category ?? null,
      tags: tagsByBookId.get(row.id) ?? [],
      status: row.status,
      rating: row.rating,
      donatable: row.donatable,
      series: row.series ?? null,
      seriesOrder: row.seriesOrder ?? null,
      createdAt: row.createdAt.toISOString()
    }))
    .sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
}

async function listUnreadCandidateBooks(limit = 20) {
  const db = createDb();
  const rows = await db
    .select({
      id: books.id
    })
    .from(books)
    .where(eq(books.status, "owned"))
    .orderBy(sql`${books.rating} desc nulls last`, desc(books.createdAt))
    .limit(limit);

  return fetchBooksByIds(rows.map((row) => row.id));
}

async function listDonatableBooks(limit = 20) {
  const db = createDb();
  const rows = await db
    .select({
      id: books.id
    })
    .from(books)
    .where(eq(books.donatable, true))
    .orderBy(sql`${books.rating} asc nulls last`, desc(books.updatedAt))
    .limit(limit);

  return fetchBooksByIds(rows.map((row) => row.id));
}

async function listSeriesBooks(limit = 20) {
  const db = createDb();
  const rows = await db
    .select({
      id: books.id
    })
    .from(books)
    .innerJoin(bookSeries, eq(bookSeries.bookId, books.id))
    .orderBy(desc(books.updatedAt))
    .limit(limit);

  return fetchBooksByIds(rows.map((row) => row.id));
}

async function listRecentBooksForAi(limit = 20) {
  const db = createDb();
  const rows = await db
    .select({
      id: books.id
    })
    .from(books)
    .orderBy(desc(books.createdAt))
    .limit(limit);

  return fetchBooksByIds(rows.map((row) => row.id));
}

async function getFavoriteAuthorSummary(limit = 3) {
  const db = createDb();
  const rows = await db.execute(sql`
    with author_ratings as (
      select
        ${authors.id} as id,
        ${authors.name} as name,
        round(avg(${books.rating})::numeric, 2) as average_rating,
        count(distinct ${books.id}) as rated_books
      from ${authors}
      inner join ${bookAuthors} on ${bookAuthors.authorId} = ${authors.id}
      inner join ${books} on ${books.id} = ${bookAuthors.bookId}
      where ${books.rating} is not null
      group by ${authors.id}, ${authors.name}
    )
    select id, name, average_rating, rated_books
    from author_ratings
    order by average_rating desc, rated_books desc, name asc
    limit ${limit}
  `);

  return rows.rows.map((row) => ({
    name: String(row.name),
    averageRating: Number(row.average_rating ?? 0),
    ratedBooks: Number(row.rated_books ?? 0)
  }));
}

async function getTopCategories(limit = 5) {
  const db = createDb();
  const rows = await db.execute(sql`
    select
      coalesce(${categories.name}, 'Uncategorized') as name,
      count(distinct ${books.id}) as count
    from ${books}
    left join ${categories} on ${categories.id} = ${books.categoryId}
    group by ${categories.name}
    order by count(distinct ${books.id}) desc, coalesce(${categories.name}, 'Uncategorized') asc
    limit ${limit}
  `);

  return rows.rows.map((row) => ({
    name: String(row.name),
    count: Number(row.count ?? 0)
  }));
}

async function getRecentAdditionsCount(months = 6) {
  const db = createDb();
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const rows = await db
    .select({
      count: sql<number>`count(distinct ${books.id})`
    })
    .from(books)
    .where(sql`${books.createdAt} >= ${since}`);

  return Number(rows[0]?.count ?? 0);
}

async function getCollectionSummaryText() {
  const db = createDb();
  const [totalsResult, topCategories, favoriteAuthors, recentAdditions] = await Promise.all([
    db.execute(sql`
      select
        count(distinct ${books.id}) as total_books,
        round((avg(${books.rating}) filter (where ${books.rating} is not null))::numeric, 2) as average_rating,
        count(distinct case when ${books.status} = 'owned' then ${books.id} end) as unread_backlog
      from ${books}
    `),
    getTopCategories(),
    getFavoriteAuthorSummary(),
    getRecentAdditionsCount()
  ]);
  const totals = totalsResult.rows[0] ?? {};

  return [
    `Toplam kitap: ${Number(totals.total_books ?? 0)}`,
    `Top 5 kategori: ${topCategories.map((item) => `${item.name} (${item.count})`).join(", ") || "yok"}`,
    `Top 3 favori yazar: ${favoriteAuthors.map((item) => `${item.name} (${item.averageRating}/5, ${item.ratedBooks} kitap)`).join(", ") || "yok"}`,
    `Son 6 ayda eklenen kitap sayisi: ${recentAdditions}`,
    `Ortalama puan: ${totals.average_rating ?? "yok"}`,
    `Unread backlog sayisi: ${Number(totals.unread_backlog ?? 0)}`
  ].join("\n");
}

async function getBlocklist() {
  const db = createDb();
  const rows = await db
    .select({
      type: recommendationPreferences.type,
      value: recommendationPreferences.value
    })
    .from(recommendationPreferences);

  const blocklist: Blocklist = {
    authors: [],
    categories: [],
    tags: []
  };

  rows.forEach((row) => {
    if (row.type === "author") {
      blocklist.authors.push(row.value);
    }

    if (row.type === "category") {
      blocklist.categories.push(row.value);
    }

    if (row.type === "tag") {
      blocklist.tags.push(row.value);
    }
  });

  return blocklist;
}

async function getSeriesGapSummaries(limit = 8) {
  const db = createDb();
  const rows = await db
    .select({
      seriesName: series.name,
      totalVolumes: series.totalVolumes,
      seriesOrder: bookSeries.seriesOrder
    })
    .from(bookSeries)
    .innerJoin(series, eq(series.id, bookSeries.seriesId))
    .where(sql`${series.totalVolumes} is not null`)
    .orderBy(series.name);

  const bySeries = new Map<string, { totalVolumes: number; ownedVolumes: number[] }>();

  rows.forEach((row) => {
    if (!row.totalVolumes || !row.seriesOrder) {
      return;
    }

    const existing = bySeries.get(row.seriesName) ?? {
      totalVolumes: row.totalVolumes,
      ownedVolumes: []
    };

    existing.ownedVolumes.push(row.seriesOrder);
    bySeries.set(row.seriesName, existing);
  });

  return Array.from(bySeries.entries())
    .map(([seriesName, value]) => {
      const uniqueOwned = Array.from(new Set(value.ownedVolumes)).sort((left, right) => left - right);
      const missingVolumes = Array.from({ length: value.totalVolumes }, (_, index) => index + 1).filter(
        (volume) => !uniqueOwned.includes(volume)
      );

      return {
        series: seriesName,
        totalVolumes: value.totalVolumes,
        ownedVolumes: uniqueOwned,
        missingVolumes
      };
    })
    .filter((item) => item.missingVolumes.length > 0)
    .sort((left, right) => left.missingVolumes.length - right.missingVolumes.length)
    .slice(0, limit);
}

function inferChatIntent(message: string) {
  const normalized = normalizeText(message);

  if (normalized.includes("bagis")) {
    return "donation";
  }

  if (normalized.includes("eksik") || normalized.includes("cilt") || normalized.includes("seri")) {
    return "series";
  }

  if (
    normalized.includes("ne okumali") ||
    normalized.includes("oner") ||
    normalized.includes("tavsiye")
  ) {
    return "recommendation";
  }

  return "search";
}

function extractKeywords(message: string) {
  return Array.from(
    new Set(
      normalizeText(message)
        .split(" ")
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
    )
  );
}

async function selectManualChatBooks(message: string) {
  const intent = inferChatIntent(message);

  if (intent === "donation") {
    return listDonatableBooks();
  }

  if (intent === "series") {
    return listSeriesBooks();
  }

  if (intent === "recommendation") {
    return listUnreadCandidateBooks();
  }

  const keywords = extractKeywords(message);
  const searchResults = await searchBooks(keywords.join(" "), 20);

  if (searchResults.length > 0) {
    return fetchBooksByIds(searchResults.map((item) => item.id));
  }

  return listRecentBooksForAi();
}

function formatBookSubset(booksForPrompt: AiBookSummary[]) {
  if (booksForPrompt.length === 0) {
    return "No relevant books found in the filtered subset.";
  }

  return booksForPrompt.map(formatBookLine).join("\n");
}

async function buildMonthlySubsetText() {
  const [candidateBooks, seriesGaps, favoriteAuthors] = await Promise.all([
    listUnreadCandidateBooks(14),
    getSeriesGapSummaries(6),
    getFavoriteAuthorSummary(3)
  ]);

  const sections = [
    "Aday kitaplar:",
    formatBookSubset(candidateBooks),
    "",
    "Seri bosluklari:",
    seriesGaps.length > 0 ? seriesGaps.map(formatSeriesGapLine).join("\n") : "- yok",
    "",
    "Favori yazar ozeti:",
    favoriteAuthors.length > 0
      ? favoriteAuthors
          .map((item) => `- ${item.name} | ort. puan: ${item.averageRating} | puanlanan kitap: ${item.ratedBooks}`)
          .join("\n")
      : "- yok"
  ].join("\n");

  return buildBoundedContext(await getCollectionSummaryText(), sections);
}

async function buildManualChatContext(message: string) {
  const [blocklist, booksForPrompt, collectionSummary] = await Promise.all([
    getBlocklist(),
    selectManualChatBooks(message),
    getCollectionSummaryText()
  ]);

  const bounded = buildBoundedContext(collectionSummary, formatBookSubset(booksForPrompt));

  return {
    blocklist,
    collectionSummary: bounded.collectionSummary,
    subset: bounded.subset
  };
}

function normalizeMonthlyPayload(payload: unknown): AiSuggestionPayload {
  const parsed = monthlySuggestionModelSchema.parse(payload);

  return {
    version: 1,
    model: EXLIBRIS_GEMINI_MODEL,
    generatedAt: new Date().toISOString(),
    summary: parsed.summary,
    sections: parsed.sections
  };
}

export async function getLatestAiSuggestion() {
  const db = createDb();
  const rows = await db
    .select({
      id: aiSuggestions.id,
      generatedAt: aiSuggestions.generatedAt,
      content: aiSuggestions.content
    })
    .from(aiSuggestions)
    .orderBy(desc(aiSuggestions.generatedAt))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    generatedAt: row.generatedAt.toISOString(),
    content: row.content as AiSuggestionPayload
  } satisfies AiSuggestionRecord;
}

export async function regenerateMonthlyAiSuggestion() {
  const [blocklist, context] = await Promise.all([
    getBlocklist(),
    buildMonthlySubsetText()
  ]);
  const prompt = buildMonthlySuggestionsPrompt({
    collectionSummary: context.collectionSummary,
    blocklist,
    subset: context.subset
  });
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: EXLIBRIS_GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: EXLIBRIS_GEMINI_TEMPERATURE,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
      },
      responseMimeType: "application/json",
      responseSchema: monthlySuggestionsResponseSchema
    }
  });
  const text = response.text?.trim();

  if (!text) {
    throw new ApiError(502, "AI did not return a monthly suggestion payload.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ApiError(502, "AI returned invalid JSON for monthly suggestions.");
  }

  const content = normalizeMonthlyPayload(parsed);
  const db = createDb();
  const inserted = await db
    .insert(aiSuggestions)
    .values({
      content
    })
    .returning({
      id: aiSuggestions.id,
      generatedAt: aiSuggestions.generatedAt
    });
  const insertedRow = inserted[0];

  await db.delete(aiSuggestions).where(ne(aiSuggestions.id, insertedRow.id));

  return {
    id: insertedRow.id,
    generatedAt: insertedRow.generatedAt.toISOString(),
    content
  } satisfies AiSuggestionRecord;
}

export async function createManualChatStream(message: string) {
  const context = await buildManualChatContext(message);
  const prompt = buildManualChatPrompt(
    {
      collectionSummary: context.collectionSummary,
      blocklist: context.blocklist,
      subset: context.subset
    },
    message
  );
  const ai = getAiClient();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await ai.models.generateContentStream({
          model: EXLIBRIS_GEMINI_MODEL,
          contents: prompt,
          config: {
            temperature: EXLIBRIS_GEMINI_TEMPERATURE,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH
            }
          }
        });

        for await (const chunk of response) {
          const text = typeof chunk.text === "string" ? chunk.text : "";

          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

export function assertCronAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    throw new Error("CRON_SECRET is not set.");
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token || token !== expectedSecret) {
    throw new ApiError(401, "Unauthorized cron request.");
  }
}
