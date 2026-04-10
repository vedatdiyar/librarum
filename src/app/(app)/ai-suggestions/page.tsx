import type { Metadata } from "next";
import { appPageTitles } from "@/lib/navigation";
import { AiSuggestionsPageClient } from "./_components/ai-suggestions-page-client";

export const metadata: Metadata = {
  title: appPageTitles.aiSuggestions,
};

export default function AiSuggestionsPage() {
  return <AiSuggestionsPageClient />;
}
