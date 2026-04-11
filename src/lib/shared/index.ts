export function assertDefined<T>(
  value: T | null | undefined,
  message = "Expected value to be defined"
): T {
  if (value == null) {
    throw new Error(message);
  }

  return value;
}

export function normalizeIsbn(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase().replace(/[^0-9X]/g, "");

  if (normalized.length !== 10 && normalized.length !== 13) {
    return null;
  }

  if (normalized.length === 10 && !/^\d{9}[\dX]$/.test(normalized)) {
    return null;
  }

  if (normalized.length === 13 && !/^\d{13}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function getSafeRedirectTarget(callbackUrl?: string | string[] | null): string {
  if (typeof callbackUrl !== "string" || !callbackUrl.startsWith("/")) {
    return "/";
  }

  // Prevent redirect loops to login page
  if (callbackUrl.startsWith("/login")) {
    return "/";
  }

  return callbackUrl;
}

export function hasAuthenticatedUser(
  session:
    | {
        user?: {
          id?: string | null;
          email?: string | null;
        } | null;
      }
    | null
    | undefined
): boolean {
  return Boolean(session?.user?.id || session?.user?.email);
}

export function normalizeCount(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

export function normalizeFloat(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2019'`´]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function toSlugPart(value: string, fallback: string): string {
  const normalized = normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

export function buildUniqueSlug(
  value: string,
  id: string,
  fallback: string,
  hasConflict: (slug: string) => boolean
): string {
  const baseSlug = toSlugPart(value, fallback);

  if (!hasConflict(baseSlug)) {
    return baseSlug;
  }

  const shortId = id.replace(/-/g, "").slice(0, 6).toLowerCase();
  return `${baseSlug}-${shortId}`;
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const json = (await response.json()) as unknown;

  if (!response.ok) {
    if (
      json &&
      typeof json === "object" &&
      "error" in json &&
      json.error &&
      typeof json.error === "object" &&
      "message" in json.error &&
      typeof json.error.message === "string"
    ) {
      throw new Error(json.error.message);
    }

    throw new Error("İstek başarısız.");
  }

  return json as T;
}
