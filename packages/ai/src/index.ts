import "server-only";

export type PromptTemplate = {
  id: string;
  system: string;
  user: string;
};

export const monthlyRecommendationsPrompt: PromptTemplate = {
  id: "monthly-recommendations",
  system:
    "You generate concise monthly reading recommendations for a personal library.",
  user:
    "Summarize the collection and propose the next set of books to prioritize this month."
};
