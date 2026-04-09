import "server-only";

export const LIBRARUM_GEMINI_MODEL = "gemini-3-flash-preview";
export const LIBRARUM_GEMINI_TEMPERATURE = 1;
export const LIBRARUM_GEMINI_THINKING_LEVEL = "high";

type BlocklistContext = {
  authors: string[];
  categories: string[];
  tags: string[];
};

export type PromptContextInput = {
  collectionSummary: string;
  blocklist: BlocklistContext;
  subset: string;
};

function formatBlocklist(blocklist: BlocklistContext) {
  return [
    "Blocklist constraints:",
    `- Authors: ${blocklist.authors.length > 0 ? blocklist.authors.join(", ") : "none"}`,
    `- Categories: ${blocklist.categories.length > 0 ? blocklist.categories.join(", ") : "none"}`,
    `- Tags: ${blocklist.tags.length > 0 ? blocklist.tags.join(", ") : "none"}`
  ].join("\n");
}

export function formatPromptDataSection(input: PromptContextInput) {
  return [
    "COLLECTION SUMMARY",
    input.collectionSummary,
    "",
    "FILTERED COLLECTION SUBSET",
    input.subset,
    "",
    formatBlocklist(input.blocklist)
  ].join("\n");
}
