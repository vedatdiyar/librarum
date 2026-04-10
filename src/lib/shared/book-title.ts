export type DisplayBookTitle = {
  title: string;
  subtitle: string | null;
};

function normalizeTitleText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function splitBookDisplayTitle(
  titleValue: string | null | undefined,
  subtitleValue?: string | null
): DisplayBookTitle {
  if (!titleValue) {
    return {
      title: "",
      subtitle: null
    };
  }

  const normalizedTitle = normalizeTitleText(titleValue);
  const normalizedSubtitle = subtitleValue ? normalizeTitleText(subtitleValue) : "";

  if (normalizedSubtitle) {
    return {
      title: normalizedTitle,
      subtitle: normalizedSubtitle
    };
  }

  const volumeMatch = normalizedTitle.match(/^(.*?)\s+((?:Cilt|Bölüm|Sayı)\s*:?\s*\d+(?:\s*[:\-]\s*.+)?)$/i);

  if (!volumeMatch) {
    return {
      title: normalizedTitle,
      subtitle: null
    };
  }

  const volumeLabel = normalizeTitleText(volumeMatch[2] ?? "").replace(/^((?:Cilt|Bölüm|Sayı))\s*:?(\s*\d+)$/i, "$1$2");

  return {
    title: normalizeTitleText(volumeMatch[1] ?? ""),
    subtitle: volumeLabel || null
  };
}

export function buildBookSlugSource(
  titleValue: string | null | undefined,
  subtitleValue?: string | null
) {
  const displayTitle = splitBookDisplayTitle(titleValue, subtitleValue);
  return [displayTitle.title, displayTitle.subtitle].filter(Boolean).join(" ");
}
