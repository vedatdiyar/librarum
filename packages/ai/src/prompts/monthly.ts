import "server-only";
import { formatPromptDataSection, type PromptContextInput } from "./shared";

export const monthlySuggestionsResponseSchema = {
  type: "object",
  required: ["summary", "sections"],
  properties: {
    summary: {
      type: "string"
    },
    sections: {
      type: "object",
      required: ["readingList", "missingVolumes", "favoriteAuthors", "backlog"],
      properties: {
        readingList: {
          type: "object",
          required: ["title", "description", "items"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["title", "author", "reason", "score"],
                properties: {
                  title: { type: "string" },
                  author: { type: "string" },
                  reason: { type: "string" },
                  score: { type: "number" }
                }
              }
            }
          }
        },
        missingVolumes: {
          type: "object",
          required: ["title", "description", "items"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["series", "missingVolumes", "reason", "score"],
                properties: {
                  series: { type: "string" },
                  missingVolumes: {
                    type: "array",
                    items: { type: "number" }
                  },
                  reason: { type: "string" },
                  score: { type: "number" }
                }
              }
            }
          }
        },
        favoriteAuthors: {
          type: "object",
          required: ["title", "description", "items"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["author", "suggestedTitles", "reason", "score"],
                properties: {
                  author: { type: "string" },
                  suggestedTitles: {
                    type: "array",
                    items: { type: "string" }
                  },
                  reason: { type: "string" },
                  score: { type: "number" }
                }
              }
            }
          }
        },
        backlog: {
          type: "object",
          required: ["title", "description", "items"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["title", "author", "reason", "score"],
                properties: {
                  title: { type: "string" },
                  author: { type: "string" },
                  reason: { type: "string" },
                  score: { type: "number" }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;

export function buildMonthlySuggestionsPrompt(input: PromptContextInput) {
  const dataSection = formatPromptDataSection(input);

  return [
    dataSection,
    "",
    "---",
    "",
    "Based on the data above:",
    "- Return valid JSON only.",
    "- Write all natural-language fields in Turkish.",
    "- Respect the blocklist strictly.",
    "- Recommend books only from the provided subset unless you are describing missing volumes.",
    "- Keep each reason concise but specific.",
    "- Use a 0-100 confidence score for every item.",
    "- Fill all four sections even if some have fewer items.",
    "- Prioritize diversity, avoid repetition, and optimize for long-term engagement."
  ].join("\n");
}
