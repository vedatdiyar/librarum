import "server-only";

import {
  GoogleGenAI,
  type GenerateContentResponse,
  type GroundingMetadata,
} from "@google/genai";
import { z } from "zod";
import type { IsbnMetadata, IsbnMetadataSource } from "@/types";

const BIBLIOGRAPHIC_NORMALIZER_MODEL = "gemma-4-31b-it";
const MIN_CONFIDENCE = 0.85;
const MAX_AUTHOR_COUNT = 5;
const MAX_TITLE_LENGTH = 255;
const MAX_SUBTITLE_LENGTH = 255;
const MAX_PUBLISHER_LENGTH = 255;

const bibliographicNormalizationSchema = z.object({
  found: z.boolean(),
  confidence: z.number().min(0).max(1),
  title: z.string().trim().max(MAX_TITLE_LENGTH).nullable(),
  subtitle: z.string().trim().max(MAX_SUBTITLE_LENGTH).nullable(),
  authors: z.array(z.string().trim().min(1).max(120)).max(MAX_AUTHOR_COUNT),
  publisher: z.string().trim().max(MAX_PUBLISHER_LENGTH).nullable(),
});

const BIBLIOGRAPHIC_NORMALIZATION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    found: { type: "boolean" },
    confidence: { type: "number" },
    title: { type: ["string", "null"] },
    subtitle: { type: ["string", "null"] },
    authors: {
      type: "array",
      items: { type: "string" },
      maxItems: MAX_AUTHOR_COUNT,
    },
    publisher: { type: ["string", "null"] },
  },
  required: ["found", "confidence", "title", "subtitle", "authors", "publisher"],
} as const;

function initializeGeminiClient() {
  const apiKey = process.env.LIBRARUM_GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

function getResponseText(response: GenerateContentResponse): string {
  return response.text?.trim() ?? "";
}

function hasGroundingEvidence(groundingMetadata?: GroundingMetadata): boolean {
  return Boolean(
    groundingMetadata?.groundingChunks?.length &&
      (groundingMetadata.webSearchQueries?.length || groundingMetadata.groundingSupports?.length)
  );
}

function sanitizeOptionalText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function sanitizeAuthors(authors: string[]) {
  return Array.from(
    new Set(
      authors
        .map((author) => author.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, MAX_AUTHOR_COUNT)
    )
  );
}

function applyNormalizationPatch(
  metadata: IsbnMetadata,
  normalization: z.infer<typeof bibliographicNormalizationSchema>
): IsbnMetadata {
  if (!normalization.found || normalization.confidence < MIN_CONFIDENCE) {
    return metadata;
  }

  const title = sanitizeOptionalText(normalization.title);
  const subtitle = sanitizeOptionalText(normalization.subtitle);
  const authors = sanitizeAuthors(normalization.authors);
  const publisher = sanitizeOptionalText(normalization.publisher);

  return {
    ...metadata,
    title: title ?? metadata.title,
    subtitle: subtitle ?? metadata.subtitle,
    authors: authors.length > 0 ? authors : metadata.authors,
    publisher: publisher ?? metadata.publisher,
  };
}

function createSystemPrompt() {
  return `
Rol: Sen yalnızca bibliyografik normalizasyon yapan bir motorusun.

Kurallar:
- Sadece geçerli JSON döndür.
- Türkçe karakterleri doğru kullan: ç, ğ, ı, İ, ö, ş, ü.
- ISBN'i asla değiştirme, yeni ISBN üretme, ISBN çıkarımı yapma.
- Farklı baskı, farklı eser, farklı çeviri veya farklı yayın seçme.
- Sadece yazım hatalarını, canonical başlık biçimini, yazar adlarını ve yayınevi adlarını düzelt.
- Kimlik eşleştirme yapma. Yalnızca metni normalize et.
- Emin değilsen veya kaynaklar çelişiyorsa found=false döndür.
- Sadece şu alanları doldurabilirsin: title, subtitle, authors, publisher.
- publicationYear, pageCount, cover, açıklama gibi alanlar hakkında karar verme.
`.trim();
}

function createUserPrompt(input: {
  isbn: string;
  metadata: IsbnMetadata;
  source: IsbnMetadataSource;
}) {
  return `
Görev: Aşağıdaki ISBN metadata kaydını Google Search ile doğrula ve yalnızca bibliyografik metinleri normalize et.

Kısıtlar:
- ISBN sabittir: ${input.isbn}
- Kaynak etiketi: ${input.source}
- Yalnızca title, subtitle, authors, publisher alanlarını düzelt.
- Yazım düzeltmesi, Türkçe karakter düzeltmesi, canonical büyük/küçük harf düzeni ve kurumsal yayınevi adı standardizasyonu yap.
- Emin değilsen found=false döndür.

Girdi metadata:
${JSON.stringify(
    {
      isbn: input.isbn,
      source: input.source,
      title: input.metadata.title,
      subtitle: input.metadata.subtitle,
      authors: input.metadata.authors,
      publisher: input.metadata.publisher,
      publicationYear: input.metadata.publicationYear,
      pageCount: input.metadata.pageCount,
    },
    null,
    2
  )}

Çıktı şeması:
{
  "found": true,
  "confidence": 0.0,
  "title": "string | null",
  "subtitle": "string | null",
  "authors": ["string"],
  "publisher": "string | null"
}
`.trim();
}

export async function normalizeBibliographicMetadata(input: {
  isbn: string;
  metadata: IsbnMetadata;
  source: IsbnMetadataSource;
}): Promise<IsbnMetadata> {
  const client = initializeGeminiClient();

  if (!client) {
    return input.metadata;
  }

  try {
    const response = await client.models.generateContent({
      model: BIBLIOGRAPHIC_NORMALIZER_MODEL,
      contents: [{ role: "user", parts: [{ text: createUserPrompt(input) }] }],
      config: {
        systemInstruction: createSystemPrompt(),
        temperature: 1.0,
        topP: 0.95,
        topK: 64,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseJsonSchema: BIBLIOGRAPHIC_NORMALIZATION_RESPONSE_SCHEMA as unknown,
      },
    });

    const rawJson = getResponseText(response);

    if (!rawJson) {
      return input.metadata;
    }

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (!hasGroundingEvidence(groundingMetadata)) {
      return input.metadata;
    }

    const parsed = bibliographicNormalizationSchema.parse(JSON.parse(rawJson));
    return applyNormalizationPatch(input.metadata, parsed);
  } catch (error) {
    console.warn(
      "[Bibliographic Normalizer] Gemma normalization failed, using deterministic metadata.",
      error instanceof Error ? error.message : String(error)
    );
    return input.metadata;
  }
}
