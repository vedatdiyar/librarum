export type BookStatus = "owned" | "completed" | "abandoned" | "loaned" | "lost";

export type BookListItem = {
  id: string;
  title: string;
  authors: string[];
  category: string | null;
  status: BookStatus;
  rating: number | null;
  location: string | null;
  series: string | null;
  tags: string[];
  coverUrl: string | null;
};

export type BooksFilters = {
  status: string;
  category: string;
  tag: string;
  location: string;
  author: string;
  series: string;
};

export type BooksResponse = {
  items: BookListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  filters: BooksFilters;
};

export type EntityOption = {
  id: string;
  name: string;
};

export type AuthorOption = EntityOption & {
  bookCount?: number;
  averageRating?: number | null;
};

export type CategoryOption = EntityOption & {
  bookCount?: number;
};

export type TagOption = EntityOption & {
  bookCount?: number;
};

export type SeriesOption = EntityOption & {
  totalVolumes: number | null;
  bookCount?: number;
  ownedCount?: number;
  completionPercentage?: number | null;
};

export type AuthorListItem = EntityOption & {
  bookCount: number;
  averageRating: number | null;
};

export type AuthorDetailBook = {
  id: string;
  title: string;
  coverUrl: string | null;
  status: BookStatus;
  rating: number | null;
  series: BookSeriesReference | null;
};

export type AuthorRelatedSeries = {
  id: string;
  name: string;
  totalVolumes: number | null;
  ownedCount: number;
};

export type AuthorDetail = {
  id: string;
  name: string;
  bookCount: number;
  averageRating: number | null;
  books: AuthorDetailBook[];
  categoryDistribution: CategoryDistributionPoint[];
  relatedSeries: AuthorRelatedSeries[];
};

export type SeriesListItem = EntityOption & {
  totalVolumes: number | null;
  ownedCount: number;
  completionPercentage: number | null;
};

export type SeriesOwnedVolume = {
  bookId: string;
  title: string;
  coverUrl: string | null;
  seriesOrder: number | null;
  status: BookStatus;
};

export type SeriesDetail = {
  id: string;
  name: string;
  totalVolumes: number | null;
  ownedVolumes: SeriesOwnedVolume[];
  missingVolumes: number[];
  completionPercentage: number | null;
};

export type SearchResultItem = {
  id: string;
  title: string;
  coverUrl: string | null;
  authors: string[];
};

export type BookLocation = {
  locationName: string | null;
  shelfRow: string | null;
  shelfColumn: number | null;
  display: string | null;
};

export type BookSeriesReference = {
  id: string;
  name: string;
  totalVolumes: number | null;
  seriesOrder: number | null;
};

export type ApiBookListItem = {
  id: string;
  title: string;
  isbn: string | null;
  status: BookStatus;
  rating: number | null;
  coverUrl: string | null;
  copyCount: number;
  donatable: boolean;
  authors: AuthorOption[];
  category: CategoryOption | null;
  tags: TagOption[];
  series: BookSeriesReference | null;
  location: BookLocation | null;
  isSeries: boolean;
  loanedTo: string | null;
  loanedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookDetail = ApiBookListItem & {
  publisher: string | null;
  publicationYear: number | null;
  pageCount: number | null;
  personalNote: string | null;
  readMonth: number | null;
  readYear: number | null;
  loanedTo: string | null;
  loanedAt: string | null;
  coverCustomUrl: string | null;
  coverMetadataUrl: string | null;
};

export type BooksListFilters = {
  status: BookStatus | null;
  category: string | null;
  tag: string | null;
  author: string | null;
  series: string | null;
  location: string | null;
};

export type BookListResponse = {
  items: ApiBookListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  filters: BooksListFilters;
};

export type EntityReferenceInput =
  | {
      id: string;
    }
  | {
      name: string;
    };

export type SeriesReferenceInput =
  | {
      id: string;
    }
  | {
      name: string;
      totalVolumes?: number | null;
    };

export type BookWriteLocationInput = {
  locationName?: string | null;
  shelfRow?: string | null;
  shelfColumn?: number | null;
};

export type BookWriteInput = {
  title: string;
  authors: EntityReferenceInput[];
  isbn?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  pageCount?: number | null;
  status: BookStatus;
  location?: BookWriteLocationInput | null;
  copyCount?: number;
  donatable?: boolean;
  rating?: number | null;
  personalNote?: string | null;
  readMonth?: number | null;
  readYear?: number | null;
  loanedTo?: string | null;
  loanedAt?: string | null;
  coverCustomUrl?: string | null;
  coverMetadataUrl?: string | null;
  category?: EntityReferenceInput | null;
  tags?: EntityReferenceInput[];
  series?: SeriesReferenceInput | null;
  seriesOrder?: number | null;
  duplicateResolution?: DuplicateResolution;
};

export type BulkBooksPatchInput = {
  bookIds: string[];
  category?: EntityReferenceInput | null;
  tags?: EntityReferenceInput[];
  location?: BookWriteLocationInput | null;
  status?: Exclude<BookStatus, "loaned">;
  donatable?: boolean;
  series?: SeriesReferenceInput | null;
  seriesOrder?: number | null;
};

export type StatsTotals = {
  totalBooks: number;
  totalCopies: number;
  completedBooks: number;
  unreadBooks: number;
  loanedBooks: number;
  abandonedBooks: number;
  lostBooks: number;
  favoriteAuthorsCount: number;
};

export type StatusBreakdownPoint = {
  status: BookStatus;
  count: number;
};

export type TimeSeriesPoint = {
  period: string;
  count: number;
};

export type CategoryDistributionPoint = {
  id: string | null;
  name: string;
  count: number;
};

export type AuthorDistributionPoint = {
  id: string;
  name: string;
  count: number;
};

export type FavoriteAuthor = {
  id: string;
  name: string;
  averageRating: number;
  ratedBooks: number;
};

export type StatsSnapshot = {
  totals: StatsTotals;
  statusBreakdown: StatusBreakdownPoint[];
  recentAdditions: ApiBookListItem[];
  completedByYear: TimeSeriesPoint[];
  completedByMonth: TimeSeriesPoint[];
  categoryDistribution: CategoryDistributionPoint[];
  authorDistribution: AuthorDistributionPoint[];
  collectionGrowth: TimeSeriesPoint[];
};

export type IsbnMetadata = {
  title: string | null;
  publisher: string | null;
  publicationYear: number | null;
  pageCount: number | null;
  coverMetadataUrl: string | null;
  description: string | null;
};

export type IsbnMetadataResponse =
  | {
      found: false;
    }
  | {
      found: true;
      source: "open_library" | "google_books";
      metadata: IsbnMetadata;
    };

export type DuplicateSuggestion = "increase_copy" | "new_edition" | "ignore";

export type DuplicateResolution =
  | "block"
  | "increase_copy"
  | "new_edition"
  | "ignore";

export type DuplicateReason = "isbn_exact" | "title_author_match";

export type DuplicateCheckInput = {
  isbn?: string | null;
  title: string;
  authorIds: string[];
  excludeBookId?: string;
};

export type BookFormMode = "add" | "edit";

export type CoverUploadResponse = {
  url: string;
  key: string;
};

export type DuplicateBookSummary = {
  id: string;
  title: string;
  authors: AuthorOption[];
  isbn: string | null;
  copyCount: number;
  status: BookStatus;
  coverUrl: string | null;
};

export type DuplicateCheckResponse =
  | {
      isDuplicate: false;
    }
  | {
      isDuplicate: true;
      reason: DuplicateReason;
      confidence: number;
      existingBook: DuplicateBookSummary;
      suggestions: DuplicateSuggestion[];
    };

export type CreateBookResponse = {
  action: "created" | "increase_copy";
  book: BookDetail;
};
