import "server-only";
import { formatPromptDataSection, type PromptContextInput } from "./shared";

export function buildManualChatPrompt(input: PromptContextInput, message: string) {
  const dataSection = formatPromptDataSection(input);

  return [
    dataSection,
    "",
    "---",
    "",
    "Based on the data above:",
    "- Answer in Turkish.",
    "- Use only the provided collection data.",
    "- Respect the blocklist strictly.",
    "- If the subset is insufficient, say that clearly instead of inventing details.",
    "- Be concise, practical, and collection-aware.",
    "",
    `User question: ${message.trim()}`
  ].join("\n");
}
