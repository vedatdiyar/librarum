"use client";

import * as React from "react";
import type {
  AuthorOption,
  BookFormMode,
  CategoryOption,
  IsbnCoverOption,
  IsbnMetadataSource,
  PublisherOption,
  SeriesOption
} from "@/types";
import type { MetadataState } from "./use-isbn-metadata";
import type { BookFormValues } from "./use-book-form";

export type BookFormContextValue = {
  // Form mode and values
  mode: BookFormMode;
  values: BookFormValues;

  // Submission state
  isSubmitting: boolean;

  // Author management
  addAuthorById: (authorId: string) => void;
  authorQuery: string;
  availableAuthors: AuthorOption[];
  canCreateAuthor: boolean;
  createAuthor: (name: string) => Promise<void>;
  draftAuthorNames: string[];
  pendingAuthorSuggestions: Array<{
    inputName: string;
    suggestedAuthor: AuthorOption;
  }>;
  removeDraftAuthorName: (name: string) => void;
  resolveSuggestedAuthor: (
    suggestion: { inputName: string; suggestedAuthor: AuthorOption },
    decision: "same_author" | "new_author"
  ) => Promise<void>;
  selectedAuthors: AuthorOption[];
  setAuthorQuery: (v: string) => void;
  updateDraftAuthorName: (oldName: string, newName: string) => void;

  // Publisher management
  canCreatePublisher: boolean;
  createPublisher: (name: string) => Promise<void>;
  publisherQuery: string;
  publishers: PublisherOption[];
  setPublisherQuery: (v: string) => void;

  // Category management
  canCreateCategory: boolean;
  categories: CategoryOption[];
  categoryQuery: string;
  createCategory: (name: string) => Promise<void>;
  setCategoryQuery: (v: string) => void;

  // Series management
  canCreateSeries: boolean;
  createSeries: (name: string) => Promise<void>;
  series: SeriesOption[];
  selectedSeries: SeriesOption | null;
  seriesQuery: string;
  setSeriesQuery: (v: string) => void;

  // ISBN metadata
  fetchMetadata: (isbn: string) => Promise<void>;
  metadataState: MetadataState;

  // Cover management
  coverPreviewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  hasCustomCover: boolean;
  isUploadingCover: boolean;
  metadataCoverOptions: IsbnCoverOption[];
  selectedMetadataCoverUrl: string | null;
  onSelectMetadataCover: (url: string) => void;
  onRevertClick: () => void;
  onUploadClick: () => void;
  uploadCover: (file: File) => Promise<void>;
};

const BookFormContext = React.createContext<BookFormContextValue | null>(null);

export function BookFormProvider({
  children,
  value
}: {
  children: React.ReactNode;
  value: BookFormContextValue;
}) {
  return (
    <BookFormContext.Provider value={value}>
      {children}
    </BookFormContext.Provider>
  );
}

export function useBookFormContext(): BookFormContextValue {
  const context = React.useContext(BookFormContext);
  if (!context) {
    throw new Error("useBookFormContext must be used within a BookFormProvider");
  }
  return context;
}
