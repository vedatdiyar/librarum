export type AiRecommendationItem = {
  title: string;
  author: string;
  reason: string;
  score: number;
};

export type AiMissingVolumeItem = {
  series: string;
  missingVolumes: number[];
  reason: string;
  score: number;
};

export type AiFavoriteAuthorItem = {
  author: string;
  suggestedTitles: string[];
  reason: string;
  score: number;
};

export type AiSuggestionSection<TItem> = {
  title: string;
  description: string;
  items: TItem[];
};

export type AiSuggestionPayload = {
  version: 1;
  model: string;
  generatedAt: string;
  summary: string;
  sections: {
    readingList: AiSuggestionSection<AiRecommendationItem>;
    missingVolumes: AiSuggestionSection<AiMissingVolumeItem>;
    favoriteAuthors: AiSuggestionSection<AiFavoriteAuthorItem>;
    backlog: AiSuggestionSection<AiRecommendationItem>;
  };
};

export type AiSuggestionRecord = {
  id: string;
  generatedAt: string;
  content: AiSuggestionPayload;
};

export type AiSuggestionsResponse = {
  suggestion: AiSuggestionRecord | null;
};

export type AiChatRequest = {
  message: string;
};
