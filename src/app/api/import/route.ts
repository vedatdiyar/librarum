import type { DuplicateResolution } from "@/types";
import { ApiError, apiSuccess, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { createBookSchema, type CreateBookInput } from "@/server/books-schemas";
import { createBook } from "@/server/books-service";
import { CSV_BOOK_COLUMNS } from "@/lib/import-export";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type ImportCandidate = {
  input: CreateBookInput;
  row: number;
};

const BOOK_STATUSES = new Set([
  "owned",
  "completed",
  "abandoned",
  "loaned",
  "lost"
] as const);

const DUPLICATE_RESOLUTIONS = new Set<DuplicateResolution>([
  "block",
  "increase_copy",
  "new_edition",
  "ignore"
]);

function parseCsv(csvText: string) {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (insideQuotes) {
      if (character === '"' && nextCharacter === '"') {
        currentField += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        currentField += character;
      }

      continue;
    }

    if (character === '"') {
      insideQuotes = true;
      continue;
    }

    if (character === ",") {
      currentLine.push(currentField);
      currentField = "";
      continue;
    }

    if (character === "\n" || character === "\r") {
      currentLine.push(currentField);
      lines.push(currentLine);
      currentLine = [];
      currentField = "";

      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      continue;
    }

    currentField += character;
  }

  if (currentField !== "" || currentLine.length > 0 || csvText.endsWith(",")) {
    currentLine.push(currentField);
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function parsePositiveInteger(value: string, fieldName: string, rowNumber: number) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value.trim(), 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    throw new ApiError(400, `${rowNumber}. satırdaki ${fieldName} alanı pozitif tam sayı olmalı.`);
  }

  return parsed;
}

function parseNullableInteger(value: string, fieldName: string, rowNumber: number) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value.trim(), 10);

  if (Number.isNaN(parsed)) {
    throw new ApiError(400, `${rowNumber}. satırdaki ${fieldName} alanı sayı olmalı.`);
  }

  return parsed;
}

function parseNullableFloat(value: string, fieldName: string, rowNumber: number) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number.parseFloat(value.trim());

  if (Number.isNaN(parsed)) {
    throw new ApiError(400, `${rowNumber}. satırdaki ${fieldName} alanı sayı olmalı.`);
  }

  return parsed;
}

function parseBoolean(value: string, fieldName: string, rowNumber: number) {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  throw new ApiError(400, `${rowNumber}. satırdaki ${fieldName} alanı true veya false olmalı.`);
}

function parseList(value: string) {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStatus(value: string, rowNumber: number) {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return "owned";
  }

  if (!BOOK_STATUSES.has(normalizedValue as CreateBookInput["status"])) {
    throw new ApiError(400, `${rowNumber}. satırdaki status alanı geçersiz.`);
  }

  return normalizedValue as CreateBookInput["status"];
}

function normalizeDuplicateResolution(value: unknown) {
  if (typeof value !== "string") {
    return "block";
  }

  return DUPLICATE_RESOLUTIONS.has(value as DuplicateResolution)
    ? (value as DuplicateResolution)
    : "block";
}

function validateCreateBookInput(input: CreateBookInput, rowNumber: number) {
  const result = createBookSchema.safeParse(input);

  if (!result.success) {
    const issue = result.error.issues[0];
    throw new ApiError(
      400,
      `${rowNumber}. satırdaki veri geçersiz: ${issue?.message ?? "Alanlar kontrol edilmeli."}`
    );
  }

  return result.data;
}

function normalizeCsvRow(headers: string[], row: string[], rowNumber: number): CreateBookInput {
  const record = Object.fromEntries(
    headers.map((header, index) => [header, (row[index] ?? "").trim()])
  );

  if (!record.title) {
    throw new ApiError(400, `${rowNumber}. satırda title zorunlu.`);
  }

  const authors = parseList(record.authors ?? "").map((name) => ({ name }));

  if (authors.length === 0) {
    throw new ApiError(400, `${rowNumber}. satırda authors zorunlu.`);
  }

  const locationName = record.locationName ?? "";
  const shelfRow = (record.shelfRow ?? "").toUpperCase();

  return validateCreateBookInput(
    {
      title: record.title,
      authors,
      isbn: record.isbn || undefined,
      publisher: record.publisher || undefined,
      publicationYear: parsePositiveInteger(
        record.publicationYear ?? "",
        "publicationYear",
        rowNumber
      ),
      pageCount: parsePositiveInteger(record.pageCount ?? "", "pageCount", rowNumber),
      status: normalizeStatus(record.status ?? "", rowNumber),
      rating: parseNullableFloat(record.rating ?? "", "rating", rowNumber),
      copyCount: parsePositiveInteger(record.copyCount ?? "", "copyCount", rowNumber) ?? 1,
      donatable: parseBoolean(record.donatable ?? "", "donatable", rowNumber),
      readMonth: parseNullableInteger(record.readMonth ?? "", "readMonth", rowNumber),
      readYear: parsePositiveInteger(record.readYear ?? "", "readYear", rowNumber),
      loanedTo: record.loanedTo || undefined,
      loanedAt: record.loanedAt || undefined,
      category: record.category ? { name: record.category } : undefined,
      series: record.series ? { name: record.series } : undefined,
      seriesOrder: parsePositiveInteger(record.seriesOrder ?? "", "seriesOrder", rowNumber),
      location:
        locationName || shelfRow
          ? {
              locationName: locationName || null,
              shelfRow: shelfRow || null
            }
          : undefined,
      personalNote: record.personalNote || undefined,
      duplicateResolution: "block"
    },
    rowNumber
  );
}

function normalizeJsonItem(item: unknown, rowNumber: number): CreateBookInput {
  if (!item || typeof item !== "object") {
    throw new ApiError(400, `${rowNumber}. JSON kaydı nesne olmalı.`);
  }

  const record = item as Record<string, unknown>;

  const authors = Array.isArray(record.authors)
    ? record.authors
        .map((author) => {
          if (typeof author === "string") {
            return author.trim() ? { name: author.trim() } : null;
          }

          if (
            author &&
            typeof author === "object" &&
            "name" in author &&
            typeof author.name === "string" &&
            author.name.trim()
          ) {
            return { name: author.name.trim() };
          }

          return null;
        })
        .filter((author): author is { name: string } => Boolean(author))
    : [];

  if (authors.length === 0) {
    throw new ApiError(400, `${rowNumber}. JSON kaydında authors zorunlu.`);
  }

  const category =
    record.category &&
    typeof record.category === "object" &&
    "name" in record.category &&
    typeof record.category.name === "string" &&
    record.category.name.trim()
      ? { name: record.category.name.trim() }
      : undefined;

  const series =
    record.series &&
    typeof record.series === "object" &&
    "name" in record.series &&
    typeof record.series.name === "string" &&
    record.series.name.trim()
      ? {
          name: record.series.name.trim(),
          totalVolumes:
            "totalVolumes" in record.series &&
            typeof record.series.totalVolumes === "number"
              ? record.series.totalVolumes
              : null
        }
      : undefined;

  const nestedSeriesOrder =
    record.series &&
    typeof record.series === "object" &&
    "seriesOrder" in record.series &&
    typeof record.series.seriesOrder === "number"
      ? record.series.seriesOrder
      : undefined;

  const location =
    record.location &&
    typeof record.location === "object"
      ? {
          locationName:
            "locationName" in record.location &&
            typeof record.location.locationName === "string"
              ? record.location.locationName
              : null,
          shelfRow:
            "shelfRow" in record.location &&
            typeof record.location.shelfRow === "string"
              ? record.location.shelfRow
              : null,
        }
      : undefined;

  if (typeof record.title !== "string" || !record.title.trim()) {
    throw new ApiError(400, `${rowNumber}. JSON kaydında title zorunlu.`);
  }

  return validateCreateBookInput(
    {
      title: record.title.trim(),
      authors,
      isbn: typeof record.isbn === "string" ? record.isbn : undefined,
      publisher: typeof record.publisher === "string" ? record.publisher : undefined,
      publicationYear:
        typeof record.publicationYear === "number" ? record.publicationYear : undefined,
      pageCount: typeof record.pageCount === "number" ? record.pageCount : undefined,
      status: normalizeStatus(typeof record.status === "string" ? record.status : "", rowNumber),
      location,
      copyCount: typeof record.copyCount === "number" ? record.copyCount : 1,
      donatable: typeof record.donatable === "boolean" ? record.donatable : false,
      rating: typeof record.rating === "number" ? record.rating : undefined,
      personalNote:
        typeof record.personalNote === "string" ? record.personalNote : undefined,
      readMonth: typeof record.readMonth === "number" ? record.readMonth : undefined,
      readYear: typeof record.readYear === "number" ? record.readYear : undefined,
      loanedTo: typeof record.loanedTo === "string" ? record.loanedTo : undefined,
      loanedAt: typeof record.loanedAt === "string" ? record.loanedAt : undefined,
      coverCustomUrl:
        typeof record.coverCustomUrl === "string" ? record.coverCustomUrl : undefined,
      coverMetadataUrl:
        typeof record.coverMetadataUrl === "string" ? record.coverMetadataUrl : undefined,
      category,
      series,
      seriesOrder:
        typeof record.seriesOrder === "number" ? record.seriesOrder : nestedSeriesOrder,
      duplicateResolution: normalizeDuplicateResolution(record.duplicateResolution)
    },
    rowNumber
  );
}

function buildCsvCandidates(text: string) {
  const rows = parseCsv(text);

  if (rows.length < 2) {
    throw new ApiError(400, "CSV dosyasında başlık satırı ve en az bir veri satırı olmalı.");
  }

  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim()
  );

  if (
    headers.length !== CSV_BOOK_COLUMNS.length ||
    headers.some((header, index) => header !== CSV_BOOK_COLUMNS[index])
  ) {
    throw new ApiError(
      400,
      `CSV başlıkları tam olarak şu sırayla olmalı: ${CSV_BOOK_COLUMNS.join(", ")}`
    );
  }

  const candidates: ImportCandidate[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const isEmpty = row.every((value) => !value.trim());

    if (isEmpty) {
      continue;
    }

    candidates.push({
      input: normalizeCsvRow(headers, row, index + 1),
      row: index + 1
    });
  }

  return candidates;
}

function buildJsonCandidates(text: string) {
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(400, "JSON dosyası geçersiz.");
  }

  const list = Array.isArray(data) ? data : [data];

  return list.map((item, index) => ({
    input: normalizeJsonItem(item, index + 1),
    row: index + 1
  }));
}

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new ApiError(400, "İçe aktarım dosyası seçilmedi.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new ApiError(400, "İçe aktarım dosyası 2MB'dan büyük olamaz.");
  }

  const text = await file.text();
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const candidates = isCsv ? buildCsvCandidates(text) : buildJsonCandidates(text);

  if (candidates.length > 500) {
    throw new ApiError(400, "Tek seferde en fazla 500 kayıt içe aktarılabilir.");
  }

  let added = 0;
  let skipped = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (const candidate of candidates) {
    try {
      await createBook(candidate.input);
      added += 1;
    } catch (error) {
      skipped += 1;
      errors.push({
        row: candidate.row,
        error:
          error instanceof Error
            ? error.message
            : "Kayıt içe aktarılırken beklenmeyen bir hata oluştu."
      });
    }
  }

  return apiSuccess({
    added,
    skipped,
    errors
  });
});
