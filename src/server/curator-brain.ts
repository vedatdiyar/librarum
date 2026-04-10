/**
 * Curator Brain - Hybrid Model Orchestration
 * Uses a fixed Gemma research stage and a fixed Gemini formatter stage.
 */

import "server-only";

import {
  GoogleGenAI,
  ThinkingLevel,
  type GenerateContentResponse,
  type GroundingMetadata,
} from "@google/genai";
import { eq, sql } from "drizzle-orm";
import { createDb, authors, bookAuthors, books } from "@/db";
import type {
  LibraryDNA,
  CuratorMonthlyReport,
  CuratedBookRecommendation,
  NextMonthRoute,
} from "@/types/curator";
import { z } from "zod";

const db = createDb();

// ============================================================
// Model Configuration
// ============================================================

const RESEARCH_MODEL = "gemma-4-31b-it";
const FORMATTER_MODEL = "gemini-3.1-flash-lite-preview";
const DEFAULT_THINKING_MODE = "high";
const GEMINI_TEMPERATURE = 1.0;

type CuratorThinkingMode = "minimal" | "low" | "medium" | "high";

const initializeGeminiClient = () => {
  const apiKey = process.env.LIBRARUM_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("LIBRARUM_GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey });
};

function isRetryableGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: string })?.status;
  const code = (error as { code?: number })?.code;

  return (
    status === "UNAVAILABLE" ||
    code === 503 ||
    status === "RESOURCE_EXHAUSTED" ||
    code === 429 ||
    /high demand|Too Many Requests|rate-limits|try again later|spike in demand/i.test(message)
  );
}

async function runWithRetry<T>(
  fn: (modelName: string) => Promise<T>,
  primaryModel: string,
  fallbackModel?: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: unknown;
  let currentModel = primaryModel;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(
          `[Curator Brain] ${currentModel} için ${attempt}. tekrar denemesi ${delay}ms sonra yapılacak...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      return await fn(currentModel);
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error)) {
        throw error;
      }

      console.warn(
        `[Curator Brain] ${currentModel} geçici hata verdi:`,
        error instanceof Error ? error.message : String(error)
      );

      if (
        attempt >= Math.floor(maxRetries / 2) &&
        fallbackModel &&
        currentModel !== fallbackModel
      ) {
        console.warn(`[Curator Brain] Yedek modele geçiliyor: ${fallbackModel}`);
        currentModel = fallbackModel;
      }
    }
  }

  throw lastError;
}

function getResponseText(response: GenerateContentResponse): string {
  return response.text?.trim() ?? "";
}

function buildGeminiThinkingConfig(modelName: string, thinkingMode: CuratorThinkingMode) {
  if (modelName.includes("gemini-3")) {
    const level =
      thinkingMode === "minimal"
        ? ThinkingLevel.MINIMAL
        : thinkingMode === "low"
          ? ThinkingLevel.LOW
          : thinkingMode === "medium"
            ? ThinkingLevel.MEDIUM
            : ThinkingLevel.HIGH;

    return { thinkingLevel: level };
  }

  if (modelName.includes("gemini-2.5")) {
    const thinkingBudget =
      thinkingMode === "minimal"
        ? 1024
        : thinkingMode === "low"
          ? 4096
          : thinkingMode === "medium"
            ? 8192
            : -1;

    return { thinkingBudget };
  }

  return undefined;
}

// ============================================================
// Schemas
// ============================================================

const LibraryPanoramaSchema = z.object({
  summary: z.string().describe("Kütüphane hakkında 2-3 cümlelik akıcı bir küratör özeti"),
  categoryBreakdown: z.array(
    z.object({
      category: z.string(),
      count: z.number().int(),
      percentage: z.number(),
      avgRating: z.number().nullable(),
    })
  ),
  authorNetwork: z.array(
    z.object({
      author: z.string(),
      bookCount: z.number().int(),
      avgRating: z.number().nullable(),
      completionRate: z.number(),
    })
  ),
  unreadStats: z.object({
    totalUnread: z.number().int(),
    percentageUnread: z.number(),
    trendDescription: z.string(),
  }),
  growthMetrics: z.object({
    booksAddedLastMonth: z.number().int(),
    booksAddedLastQuarter: z.number().int(),
    estimatedReadingPace: z.string(),
  }),
});

const CuratedBookRecommendationSchema = z.object({
  bookId: z.string(),
  title: z.string(),
  author: z.string(),
  series: z.string().optional(),
  seriesPosition: z.string().optional(),
  reason: z.string(),
  scoringExplanation: z.string(),
  category: z.enum(["gap-filling", "series-completion", "discovery", "user-interest"]),
  score: z.number().min(0).max(100),
});

const NextMonthRouteSchema = z.object({
  theme: z.string(),
  thematicJustification: z.string(),
  connectedBooks: z.array(
    z.object({
      bookId: z.string(),
      title: z.string(),
      author: z.string(),
      connectionReason: z.string(),
    })
  ),
  suggestedActions: z.array(z.string()),
});

export const CuratorMonthlyReportSchema = z.object({
  libraryPanorama: LibraryPanoramaSchema,
  curatedSelection: z.array(CuratedBookRecommendationSchema).min(1).max(5),
  nextMonthRoute: NextMonthRouteSchema,
});

const CuratorNarrativeSchema = z.object({
  libraryPanorama: z.object({
    summary: z.string(),
    unreadStats: z.object({
      trendDescription: z.string(),
    }),
    growthMetrics: z.object({
      estimatedReadingPace: z.string(),
    }),
  }),
  curatedSelection: z.array(
    z.object({
      title: z.string(),
      author: z.string(),
      reason: z.string(),
      scoringExplanation: z.string(),
      category: z.string(),
      score: z.number(),
      series: z.string().optional(),
      seriesPosition: z.string().optional(),
    })
  ).min(1).max(5),
  nextMonthRoute: z.object({
    theme: z.string(),
    thematicJustification: z.string(),
    connectedBooks: z.array(
      z.object({
        title: z.string(),
        author: z.string(),
        connectionReason: z.string(),
      })
    ),
    suggestedActions: z.array(z.string()),
  }),
});

const CURATOR_NARRATIVE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    libraryPanorama: {
      type: "object",
      properties: {
        summary: { type: "string" },
        unreadStats: {
          type: "object",
          properties: {
            trendDescription: { type: "string" },
          },
          required: ["trendDescription"],
        },
        growthMetrics: {
          type: "object",
          properties: {
            estimatedReadingPace: { type: "string" },
          },
          required: ["estimatedReadingPace"],
        },
      },
      required: ["summary", "unreadStats", "growthMetrics"],
    },
    curatedSelection: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          series: { type: "string" },
          seriesPosition: { type: "string" },
          reason: { type: "string" },
          scoringExplanation: { type: "string" },
          category: { type: "string" },
          score: { type: "number" },
        },
        required: ["title", "author", "reason", "scoringExplanation", "category", "score"],
      },
      minItems: 1,
      maxItems: 5,
    },
    nextMonthRoute: {
      type: "object",
      properties: {
        theme: { type: "string" },
        thematicJustification: { type: "string" },
        connectedBooks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              author: { type: "string" },
              connectionReason: { type: "string" },
            },
            required: ["title", "author", "connectionReason"],
          },
        },
        suggestedActions: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["theme", "thematicJustification", "connectedBooks", "suggestedActions"],
    },
  },
  required: ["libraryPanorama", "curatedSelection", "nextMonthRoute"],
} as const;

// ============================================================
// Prompt Factories
// ============================================================

function createCuratorPromptContext(libraryDNA: LibraryDNA): string {
  return `
## Kütüphane DNA Profili

- Toplam Kitap: ${libraryDNA.totalBooks}
- Okunmamış: ${libraryDNA.unreadCount} (${libraryDNA.unreadPercentage.toFixed(1)}%)
- Okuma Eğilimi: ${libraryDNA.readingTrend}
- Son 30 Günde Eklenen: ${libraryDNA.growthVelocity.last30Days} kitap

Başlıca Kategoriler:
${libraryDNA.topCategories
  .map(
    (c) =>
      `- ${c.category}: ${c.count} kitap, %${c.percentage.toFixed(1)}, ortalama puan ${c.avgRating ? c.avgRating.toFixed(1) : "N/A"}`
  )
  .join("\n")}

Sevilen Yazarlar:
${libraryDNA.topAuthors
  .map(
    (a) =>
      `- ${a.author}: ${a.bookCount} kitap, tamamlanma oranı %${(a.completionRate * 100).toFixed(0)}, ortalama puan ${a.avgRating ? a.avgRating.toFixed(1) : "N/A"}`
  )
  .join("\n")}

Seri Tamamlanma:
- Tamamlanan seri oranı: %${(libraryDNA.seriesCompletion.completionRate * 100).toFixed(0)}
- Son 90 günde eklenen kitap: ${libraryDNA.growthVelocity.last90Days}
`;
}

function createGemmaResearchSystemPrompt(
  libraryDNA: LibraryDNA,
  thinkingMode: CuratorThinkingMode
): string {
  const thinkingPrefix = thinkingMode === "minimal" ? "" : "<|think|>\n";

  return `${thinkingPrefix}
Rol: Sen, disiplinli bir araştırmacı küratörsün.
Görevin, bu kütüphane için doğrulanmış ve JSON'a dönüştürülebilir bir araştırma notu hazırlamaktır.

${createCuratorPromptContext(libraryDNA)}

Araştırma ilkeleri:
- Google Search kullanmak zorundasın.
- Kitap adı, yazar adı ve eser-yazar eşleşmesini doğrulamadan spesifik öneri verme.
- Doğrulayamıyorsan genel öneri ver.
- Gerçek olmayan bibliyografik bilgi uydurma.
- Kütüphane içgörüsü ile dış dünya bulgularını açık biçimde ayır.
- Yanıtın yalnızca araştırma notu olsun; JSON üretme.

Çıktı bölümleri:
1. Mevcut Durum Analizi
2. İlgi Alanı ve Yazar Profili
3. Öneriler
4. Genel Değerlendirme

Öneriler bölümünde her öneri için:
- Kitap Adı
- Yazar
- Neden Önerildi
- Kategori Mantığı
- Puan Mantığı
`;
}

function createGeminiFormatterSystemPrompt(
  libraryDNA: LibraryDNA,
  thinkingMode: CuratorThinkingMode
): string {
  return `
Rol: Sen, yalnızca verilen araştırma notundan yapılandırılmış anlatı çıkaran bir veri mimarısın.
${createCuratorPromptContext(libraryDNA)}

Thinking modu: ${thinkingMode}.

Kurallar:
- Yeni araştırma yapma.
- Yalnızca verilen araştırma notunu kullan.
- Citation, dipnot, kaynak listesi, markdown ve arama önerilerini içerik olarak alma.
- Şemada olmayan alan üretme.
- Desteklenmeyen spesifik bilgi uydurma.
- Çıktın yalnızca geçerli JSON olsun.
- Sayısal alanları yeniden tahmin etmeye çalışma; yalnızca anlatısal alanları doldur.
`;
}

// ============================================================
// Research Helpers
// ============================================================

function hasGroundingEvidence(groundingMetadata?: GroundingMetadata): boolean {
  return Boolean(
    groundingMetadata?.groundingChunks?.length &&
      (groundingMetadata.webSearchQueries?.length || groundingMetadata.groundingSupports?.length)
  );
}

export function sanitizeCuratorResearchNote(researchText: string): string {
  let cleaned = researchText;

  cleaned = cleaned.replace(/<\|channel\|>thought[\s\S]*?(?:<\|channel\|>|<channel\|>)/gi, "");
  cleaned = cleaned.replace(/\[\d+\]\([^)]+\)/g, "");
  cleaned = cleaned.replace(/\[\d+\]/g, "");

  const stopPatterns = [
    /^sources$/i,
    /^google search suggestions$/i,
    /^display of search suggestions/i,
    /^help$/i,
  ];

  const lines = cleaned.split("\n");
  const stopIndex = lines.findIndex((line) => stopPatterns.some((pattern) => pattern.test(line.trim())));
  const relevantLines = stopIndex >= 0 ? lines.slice(0, stopIndex) : lines;

  cleaned = relevantLines
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toStableExternalId(title: string, author: string): string {
  const slug = normalizeText(`${title} ${author}`).replace(/\s+/g, "-");
  return `external:${slug || "unknown"}`;
}

function normalizeCategory(
  rawCategory: string,
  author: string,
  favoriteAuthors: string[]
): CuratedBookRecommendation["category"] {
  const normalized = normalizeText(rawCategory);

  if (normalized === "gap filling") return "gap-filling";
  if (normalized === "series completion") return "series-completion";
  if (normalized === "discovery") return "discovery";
  if (normalized === "user interest") return "user-interest";
  if (normalized === "hidden gem") return "discovery";

  if (favoriteAuthors.some((name) => normalizeText(name) === normalizeText(author))) {
    return "user-interest";
  }

  return "discovery";
}

function formatReadingPace(avgPerMonth: number): string {
  return `${avgPerMonth.toFixed(1)} kitap/ay`;
}

type NarrativeReport = z.infer<typeof CuratorNarrativeSchema>;

async function resolveBookId(title: string, authorName: string): Promise<string> {
  const rows = await db
    .select({
      bookId: books.id,
      title: books.title,
      author: authors.name,
    })
    .from(books)
    .leftJoin(bookAuthors, eq(bookAuthors.bookId, books.id))
    .leftJoin(authors, eq(authors.id, bookAuthors.authorId))
    .where(sql`lower(${books.title}) = lower(${title})`);

  if (rows.length === 0) {
    return toStableExternalId(title, authorName);
  }

  const exactAuthor = rows.find(
    (row) => row.author && normalizeText(row.author) === normalizeText(authorName)
  );

  if (exactAuthor) {
    return exactAuthor.bookId;
  }

  const uniqueBookIds = [...new Set(rows.map((row) => row.bookId))];
  return uniqueBookIds.length === 1
    ? uniqueBookIds[0]
    : toStableExternalId(title, authorName);
}

async function mergeNarrativeWithDeterministicFields(
  libraryDNA: LibraryDNA,
  narrative: NarrativeReport
): Promise<CuratorMonthlyReport> {
  const favoriteAuthors = libraryDNA.topAuthors.map((author) => author.author);

  const curatedSelection = await Promise.all(
    narrative.curatedSelection.map(async (item) => ({
      bookId: await resolveBookId(item.title, item.author),
      title: item.title,
      author: item.author,
      series: item.series,
      seriesPosition: item.seriesPosition,
      reason: item.reason,
      scoringExplanation: item.scoringExplanation,
      category: normalizeCategory(item.category, item.author, favoriteAuthors),
      score: Math.max(0, Math.min(100, Math.round(item.score))),
    }))
  );

  const connectedBooks: NextMonthRoute["connectedBooks"] = await Promise.all(
    narrative.nextMonthRoute.connectedBooks.map(async (item) => ({
      bookId: await resolveBookId(item.title, item.author),
      title: item.title,
      author: item.author,
      connectionReason: item.connectionReason,
    }))
  );

  return {
    generatedAt: new Date(),
    libraryPanorama: {
      summary: narrative.libraryPanorama.summary,
      categoryBreakdown: libraryDNA.topCategories,
      authorNetwork: libraryDNA.topAuthors,
      unreadStats: {
        totalUnread: libraryDNA.unreadCount,
        percentageUnread: libraryDNA.unreadPercentage,
        trendDescription: narrative.libraryPanorama.unreadStats.trendDescription,
      },
      growthMetrics: {
        booksAddedLastMonth: libraryDNA.growthVelocity.last30Days,
        booksAddedLastQuarter: libraryDNA.growthVelocity.last90Days,
        estimatedReadingPace:
          narrative.libraryPanorama.growthMetrics.estimatedReadingPace ||
          formatReadingPace(libraryDNA.growthVelocity.avgPerMonth),
      },
    },
    curatedSelection,
    nextMonthRoute: {
      theme: narrative.nextMonthRoute.theme,
      thematicJustification: narrative.nextMonthRoute.thematicJustification,
      connectedBooks,
      suggestedActions: narrative.nextMonthRoute.suggestedActions,
    },
  };
}

export async function runGemmaResearch(libraryDNA: LibraryDNA): Promise<string> {
  const client = initializeGeminiClient();
  const systemPrompt = createGemmaResearchSystemPrompt(libraryDNA, DEFAULT_THINKING_MODE);
  const researchPrompt = `
Türkçe yaz.

Görev:
Verilen kütüphane verisini analiz et ve mutlaka Google Search kullanarak doğrulanmış bir araştırma notu üret.

Zorunlu kurallar:
- Google Search'ü kullanmak zorundasın.
- Kitap adı, yazar adı ve eser-yazar eşleşmesini Google Search ile doğrula.
- Doğrulayamadığın hiçbir kitabı veya yazarı spesifik öneri olarak yazma.
- Emin olmadığın durumda genel öneri ver.
- Gerçek olmayan kitap, yazar, eser, ödül, seri veya yayın bilgisi uydurma.
- Kütüphane verisi ile dış dünya bilgisini birbirine karıştırma.
- Çıktı JSON değil, araştırma notu olsun.
- Yalnızca araştırma notu üret; ekstra açıklama ekleme.

Kütüphane verisi:
${createCuratorPromptContext(libraryDNA)}
`;

  console.log("[Curator Brain] Hybrid Stage 1 başladı: Gemma research üretiliyor...");
  const response = await runWithRetry(
    (modelName) =>
      client.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: researchPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: GEMINI_TEMPERATURE,
          tools: [{ googleSearch: {} }],
        },
      }),
    RESEARCH_MODEL
  );

  const rawText = getResponseText(response);
  if (!rawText) {
    throw new Error("Gemma research aşamasında geçerli araştırma notu alınamadı.");
  }

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  if (!hasGroundingEvidence(groundingMetadata)) {
    throw new Error("Gemma research aşaması doğrulanmış Google Search kanıtı üretmedi.");
  }

  console.log("[Curator Brain] Hybrid Stage 1 tamamlandı.", {
    length: rawText.length,
    searchQueries: groundingMetadata?.webSearchQueries?.length ?? 0,
  });

  return rawText;
}

export async function runGeminiFormatter(
  sanitizedResearchNote: string,
  libraryDNA: LibraryDNA
): Promise<NarrativeReport> {
  const client = initializeGeminiClient();
  const systemPrompt = createGeminiFormatterSystemPrompt(libraryDNA, DEFAULT_THINKING_MODE);
  const formatterPrompt = `
Türkçe yaz.

Görev:
Aşağıdaki araştırma notunu al ve yalnızca tanımlı şemaya uygun JSON üret.

Kurallar:
- Yalnızca JSON üret.
- Şemaya harfiyen uy.
- Şemada olmayan alan ekleme.
- Alan adlarını değiştirme.
- Araştırma notunda olmayan bilgiyi uydurma.
- Citation, markdown, dipnot, kaynak listesi veya açıklama ekleme.
- İlk karakter { ve son karakter } olmalı.
- Score alanlarını 0-100 ölçeğinde sayısal üret.

Araştırma notu:
---
${sanitizedResearchNote}
---
`;

  console.log("[Curator Brain] Hybrid Stage 2 başladı: Gemini formatter narrative JSON üretiyor...");
  const response = await runWithRetry(
    (modelName) =>
      client.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: formatterPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: GEMINI_TEMPERATURE,
          thinkingConfig: buildGeminiThinkingConfig(modelName, DEFAULT_THINKING_MODE),
          responseMimeType: "application/json",
          responseJsonSchema: CURATOR_NARRATIVE_RESPONSE_SCHEMA as unknown,
        },
      }),
    FORMATTER_MODEL
  );

  const rawJson = getResponseText(response);
  if (!rawJson) {
    throw new Error("Gemini formatter aşamasında geçerli JSON alınamadı.");
  }

  const parsedData = JSON.parse(rawJson);
  const narrative = CuratorNarrativeSchema.parse(parsedData);
  console.log("[Curator Brain] Hybrid Stage 2 tamamlandı: narrative JSON doğrulandı.");
  return narrative;
}

// ============================================================
// Public Orchestrators
// ============================================================

export async function generateCuratorResearchMarkdown(libraryDNA: LibraryDNA): Promise<string> {
  return runGemmaResearch(libraryDNA);
}

export async function structureCuratorReportFromResearch(
  researchMarkdown: string,
  libraryDNA: LibraryDNA
): Promise<Omit<CuratorMonthlyReport, "generatedAt">> {
  const sanitizedResearch = sanitizeCuratorResearchNote(researchMarkdown);
  const narrative = await runGeminiFormatter(sanitizedResearch, libraryDNA);
  const mergedReport = await mergeNarrativeWithDeterministicFields(libraryDNA, narrative);
  return CuratorMonthlyReportSchema.parse(mergedReport);
}

export async function generateCuratorReport(
  libraryDNA: LibraryDNA
): Promise<CuratorMonthlyReport> {
  console.log("[Curator Brain] Rapor oluşturma başlatıldı. Pipeline: hybrid_v2");

  const rawResearch = await runGemmaResearch(libraryDNA);
  const sanitizedResearch = sanitizeCuratorResearchNote(rawResearch);
  console.log("[Curator Brain] Research sanitize tamamlandı.", {
    rawLength: rawResearch.length,
    sanitizedLength: sanitizedResearch.length,
  });

  const narrative = await runGeminiFormatter(sanitizedResearch, libraryDNA);
  const mergedReport = await mergeNarrativeWithDeterministicFields(libraryDNA, narrative);
  const validatedReport = CuratorMonthlyReportSchema.parse(mergedReport);

  console.log("[Curator Brain] Hybrid final rapor başarıyla oluşturuldu ve doğrulandı.");
  return {
    ...validatedReport,
    generatedAt: new Date(),
  };
}
