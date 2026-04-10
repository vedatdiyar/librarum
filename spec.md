**LIBRARUM**

Personal Book Archive & Library Management System

**Product Specification Document**

Version 1.0 - Final Stack & Feature Decisions

# **1\. Product Overview**

Librarum is a single-user, modern web-based personal book archive and library management system.

### **Goals**

- Manage physical book collection digitally
- Track reading status across all books
- Organize shelf locations by named area, row, and column
- Analyze collection by series and author
- Prevent duplicate records with smart detection
- Generate AI-powered monthly reading recommendations
- Enable data backup and portability via import/export

_Librarum is a real-time system requiring an internet connection._

# **2\. Target User Model**

| **User type**      | Single user, private system         |
| ------------------ | ----------------------------------- |
| **Registration**   | No public signup                    |
| **Authentication** | Email + password login              |
| **Roles**          | None - no role or permission system |
| **Admin panel**    | None                                |
| **Username**       | Profile display field only          |

# **3\. Platform Architecture**

## **3.1 Frontend Stack**

| **Framework** | Next.js (App Router)                                      |
| ------------- | --------------------------------------------------------- |
| **Language**  | TypeScript + React                                        |
| **Styling**   | TailwindCSS + shadcn/ui                                   |
| **State**     | Zustand (client state) + TanStack Query v5 (server state) |
| **Forms**     | React Hook Form + Zod                                     |

## **3.2 Backend Stack**

| **Database**   | Neon PostgreSQL (serverless)                             |
| -------------- | -------------------------------------------------------- |
| **ORM**        | Drizzle ORM + drizzle-kit (migrations)                   |
| **Auth**       | NextAuth.js v5 (Credentials provider - email + password) |
| **Storage**    | Cloudflare R2 (cover images)                             |
| **Functions**  | Vercel Functions (API routes)                            |
| **Scheduling** | Vercel Cron Jobs                                         |

## **3.3 Deployment**

| **Hosting**      | Vercel (free tier)                      |
| ---------------- | --------------------------------------- |
| **Database**     | Neon (free tier - no project limit)     |
| **Storage**      | Cloudflare R2 (free tier - 10 GB/month) |
| **Cost target**  | 0 USD/month                             |
| **Environments** | Development, Production                 |
| **Env prefix**   | ARCHIVUM\_                              |

## **3.4 Project Layout**

_The root project is the sole Vercel deployment target. AI prompt code runs exclusively inside Vercel API Routes - never in the browser bundle. No Supabase dependency anywhere in the stack._

| **root app/**            | Next.js application (Vercel deploy target)                 |
| ------------------------ | ---------------------------------------------------------- |
| **root components/**     | App-specific UI components                                 |
| **root lib/**            | App-specific utilities, API helpers, and stores            |
| **root src/lib/ui**      | Shared UI primitives                                       |
| **root src/lib/types**   | Shared TypeScript types                                    |
| **root src/lib/shared**  | Shared utilities                                           |
| **root src/lib/ai**      | AI prompt templates - consumed by Vercel API Routes only   |
| **root src/lib/db**      | Drizzle schema, migrations, seed logic, and Neon client    |

# **4\. Book Entity Model**

## **4.1 Identity Fields**

| **title**            | Required. Display title.                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **authors\[\]**      | One or more authors via book_authors junction table. Entered via autocomplete + inline create. |
| **isbn**             | Optional. Primary trigger for metadata auto-fetch and duplicate detection.                     |
| **publisher**        | Auto-filled from metadata; editable. Plain text field - no separate publishers table.          |
| **publication_year** | Auto-filled from metadata; editable.                                                           |
| **page_count**       | Auto-filled from metadata; editable.                                                           |

_Multi-author support via book_authors junction table. No translator field. original_title and language fields removed. All auto-filled fields remain manually editable._

## **4.2 Classification Fields**

| **category_id**  | Single category per book (FK to categories table).                                     |
| ---------------- | -------------------------------------------------------------------------------------- |
| **is_series**    | Boolean checkbox. When checked, reveals series fields below.                           |
| **series_id**    | Optional FK to series table. Visible only when is_series = true.                       |
| **series_order** | Optional integer. Volume number within the series. Visible only when is_series = true. |

## **4.3 Library Status**

Each book carries one of the following 5 statuses:

| **Status**    | **Meaning**                                                 |
| ------------- | ----------------------------------------------------------- |
| **owned**     | In the collection, not yet read. (Sahibim - Henüz Okunmadı) |
| **completed** | Finished reading. (Okudum - Bitti)                          |
| **abandoned** | Started but stopped. (Yarım Bıraktım)                       |
| **loaned**    | Currently lent to someone. (Ödünç Verdim)                   |
| **lost**      | Physical copy is missing. (Kayıp)                           |

_"reading" (currently reading) and "unread" statuses removed. "owned" covers all unread books. The dashboard no longer shows a "currently reading" widget._

## **4.4 Location System**

Each book stores a two-part location:

| **location_name** | Named area e.g. "Salon", "Çalışma Odası", "Depo" |
| ----------------- | ------------------------------------------------ |
| **shelf_row**     | Letter A-Z                                       |

_Example: Salon / B_

## **4.5 Copy Management**

| **copy_count** | Integer. Default 1. Incremented instead of creating duplicate records. |
| -------------- | ---------------------------------------------------------------------- |
| **donatable**  | Boolean. Marks extra copies eligible for donation.                     |

## **4.6 Loan Tracking**

_RESOLVED: When a book is returned, the user manually sets the status back to "owned" (or "completed" / "abandoned"). The system does not track return dates or send reminders. loaned_to and loaned_at are cleared on status change._

| **loaned_to** | Free-text name of borrower. Cleared on return. |
| ------------- | ---------------------------------------------- |
| **loaned_at** | Timestamp of loan. Cleared on return.          |

## **4.7 Rating System**

| **rating**          | Decimal, 0.5 increments, range 0.5-5.0. Half-star UI (Letterboxd-style).           |
| ------------------- | ---------------------------------------------------------------------------------- |
| **favorite author** | Derived automatically from ratings - see Section 9.1. No per-book favorite toggle. |

## **4.8 Notes & Reading Date**

| **personal_note** | Free text. One note per book. No versioning.      |
| ----------------- | ------------------------------------------------- |
| **read_month**    | Optional integer 1-12. Stored with read_year.     |
| **read_year**     | Optional integer. Minimum granularity: year only. |

_Day-level precision is not supported. Statistics (books per month/year) are derived from read_month + read_year fields._

# **5\. Metadata Enrichment System**

## **5.1 Fetch Flow**

_RESOLVED: ISBN entry OR barcode scan triggers an automatic metadata fetch instantly. A loading spinner appears inline on the form. If no result is found, the form remains open for fully manual entry. All auto-filled fields are editable at any time._

| **Primary source**         | Open Library API                                     |
| -------------------------- | ---------------------------------------------------- |
| **Fallback source**        | Google Books API (if Open Library returns no result) |
| **No result**              | Form remains open for fully manual entry             |
| **Trigger - typed ISBN**   | Field blur / after typing stops (300ms debounce)     |
| **Trigger - barcode scan** | Instant fetch on scan completion                     |
| **Auto-filled fields**     | Publisher, Publication Year, Page Count, Cover Image |
| **User override**          | All auto-filled fields are editable after fetch      |

## **5.2 Cover Image Priority**

_RESOLVED: Metadata-sourced cover is used by default. The user can manually upload a replacement cover at any time. Once a custom cover is uploaded, it takes precedence permanently until deleted. Deleting reverts to the metadata cover if one exists._

| **1\. Custom upload**  | User-uploaded image in Cloudflare R2. Highest priority.                   |
| ---------------------- | ------------------------------------------------------------------------- |
| **2\. Metadata cover** | URL from Open Library or Google Books. Used when no custom upload exists. |
| **3\. No cover**       | Generic placeholder illustration shown in UI.                             |

## **5.3 Enriched Fields**

- Cover image
- Publisher
- Publication year
- Page count
- Description
- Series info
- ISBN variants (ISBN-10, ISBN-13)

# **6\. Duplicate Detection Engine**

## **6.1 Algorithm**

| **title similarity** | Fuzzy match (Levenshtein distance, threshold ≥ 85%) |
| -------------------- | --------------------------------------------------- |
| **author match**     | Exact match on author_id                            |
| **ISBN match**       | Exact match on isbn field (any variant)             |

## **6.2 Trigger Points**

- On book creation (manual or ISBN flow)
- On CSV/JSON import
- On metadata sync that updates title or author

## **6.3 User Actions on Duplicate Warning**

| **Action**          | **When to use**                 | **Result**                        |
| ------------------- | ------------------------------- | --------------------------------- |
| Increase copy count | Same physical edition           | copy_count + 1 on existing record |
| Create new edition  | Different edition / translation | New book record created           |
| Ignore warning      | User is certain it is different | Record saved as-is                |

# **7\. Series System**

## **8.1 Series Fields - Book**

| **series_id**    | FK to series table                                   |
| ---------------- | ---------------------------------------------------- |
| **series_order** | Integer - volume number within the series (1, 2, 3…) |

## **8.2 Series Table Fields**

| **name**          | Series name. Created inline from book form via autocomplete + create.                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **total_volumes** | Optional integer. Total number of volumes in the series. If empty, missing volume detection is disabled for this series. |

_Series are created directly from the book form - no separate series management page needed. Series name and total_volumes can be edited later from Settings → Series._

## **8.3 Series Detail Page Displays**

- Owned volumes in order
- Missing volumes (total_volumes minus owned - only shown when total_volumes is set)
- Completion ratio (owned / total_volumes - only shown when total_volumes is set)

# **9\. Author Management & Pages**

## **9.1 Author Entry**

_Authors are entered via autocomplete search on the book form. If the author does not exist, they are created inline. Author names are edited from the author detail page - changes propagate to all books automatically via FK._

## **9.2 Author Detail Page**

- All owned books by this author
- Average rating across author's books
- Related series
- Category distribution
- Edit author name (propagates to all books)

## **9.1 Favorite Author Logic**

_RESOLVED: Favorite author status is derived automatically - no manual toggle. The author with the highest average rating across their books is marked as favorite. This is computed at query time, not stored. In case of a tie, all tied authors receive favorite status._

# **10\. Loan System**

_RESOLVED: No due dates. No reminders. When the user gets a book back, they open the book detail page and change the status back to "owned", "completed", or "abandoned". This action automatically clears loaned_to and loaned_at fields. A single "Mark as Returned" button on the book detail page provides a one-tap shortcut for this action._

| **loaned_to**    | Free-text borrower name                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| **loaned_at**    | Timestamp                                                                    |
| **Return flow**  | "Mark as Returned" button → prompts user for new status → clears loan fields |
| **No due date**  | Intentional - keeps the system simple                                        |
| **No reminders** | Intentional - no notification system in scope                                |

# **11\. Search Engine**

## **11.1 Language**

_Search operates in Turkish. Natural language rule engine parses Turkish keywords. No English query support needed - single-owner Turkish-language system._

## **11.2 Keyword Search Fields**

- title\n- author\n- series\n- category\n- location\n- status

## **11.3 Structured Natural Language Queries**

_Parsed by a deterministic Turkish rule engine on the frontend. No AI dependency._

- okunmamış romanlar → status=owned, category=Roman
- A rafındaki kitaplar → shelf_row=A
- ödünç verilenler → status=loaned
- Dostoyevski kitapları → author contains "Dostoyevski"
- eksik Tolkien ciltleri → author="Tolkien", missing volumes in series

## **11.4 Search Results UI**

| **Display**         | Inline dropdown - no page navigation required |
| ------------------- | --------------------------------------------- |
| **On result click** | Navigates to book detail page                 |
| **Empty state**     | "Sonuç bulunamadı" message inline             |

# **12\. AI System**

## **12.1 Scope**

| **Monthly recommendations** | Cron-triggered, runs once per month, fully automated  |
| --------------------------- | ----------------------------------------------------- |
| **Manual AI chat panel**    | User-triggered, ad-hoc questions about the collection |

## **12.2 Monthly Recommendation Engine**

| **Frequency**        | Once per month via Vercel Cron                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**          | Vercel API Route (Node.js)                                                                                                                                                   |
| **Timeout handling** | Collection summarized to ≤2000 tokens before prompt. No full-table scan in prompt. Vercel Function timeout: 60s (Pro) / 10s (free) - summarization ensures well under limit. |
| **Output**           | Suggested reading list, missing series volumes, favorite author picks, unread backlog suggestions                                                                            |
| **Storage**          | Results stored in ai_suggestions table, not re-generated until next cycle                                                                                                    |

## **12.3 Manual AI Chat Panel**

_RESOLVED: The chat panel does NOT send the full collection to the AI. Instead, a collection summary (total counts, top categories, top authors, avg rating, current reads) is generated server-side and injected as context. For specific queries, relevant records are fetched first via deterministic search, then sent as a filtered subset. This keeps prompt size bounded regardless of collection size._

- Example queries: "What should I read next?", "Find donation candidates", "Show missing classics"
- Context window: collection summary (~500 tokens) + filtered subset (≤1500 tokens) = ≤2000 tokens per call

## **12.4 AI Preference Memory (Blocklist)**

| **Stored in**  | recommendation_preferences table          |
| -------------- | ----------------------------------------- |
| **Excludable** | Authors, categories                 |
| **Applied to** | Both monthly cron and manual chat context |

# **13\. Dashboard & Statistics**

## **13.1 Dashboard Widgets**

- Unread backlog (Bekleyenler)
- Recent additions (Son Eklenenler)
- Favorite authors
- Category distribution chart
- Monthly AI suggestions
- Statistics snapshot

_"Currently reading" widget removed. Status system no longer includes a "reading" state._

## **13.2 Statistics Engine**

_Statistics use read_month + read_year fields. Day-level granularity is not supported and is not needed for any displayed metric._

- Total books in collection
- Completed books
- Unread books
- Books completed per year
- Books completed per month (month/year granularity)
- Category distribution
- Author distribution
- Collection growth over time

_No streak tracking. No page-count tracking._

# **14\. Import / Export System**

| **Export formats**               | JSON (full backup), CSV (tabular view)                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Import formats**               | JSON (restore), CSV (bulk add)                                                                     |
| **CSV column names**             | Standardized - documented in Settings → Import. No mapping wizard.                                 |
| **Import error handling**        | Invalid rows are skipped. A summary report is shown after import listing skipped rows and reasons. |
| **Duplicate handling on import** | Duplicate detection engine runs on each imported record                                            |


# **16\. UI Architecture**

## **16.1 Navigation (Sidebar)**

- Dashboard
- Books
- Authors
- Series
- Loans
- AI Suggestions
- Settings

## **16.2 Responsive Design**

_Full responsive support required. Tailwind breakpoints cover mobile, tablet, and desktop. Barcode scanning is a mobile-only feature - the scan button is hidden on desktop (md: breakpoint)._

## **16.3 Book List Views**

| **List view**        | Default. Sortable, filterable table with pagination.            |
| -------------------- | --------------------------------------------------------------- |
| **Grid view**        | Cover image grid. Toggle from list view.                        |
| **Pagination**       | Standard pagination (not infinite scroll). Page size: 25 books. |
| **Shelf simulation** | Not supported.                                                  |

## **16.4 Book Detail Page Layout**

| **Left column**  | Cover image, title, author(s), publisher, year, page count, ISBN, series, category, location.                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Right column** | Personal note (textarea), star rating, reading date, status, loan info, action buttons (Edit, Mark as Returned, Delete). |
| **Form**         | Add and Edit share the same form component in two modes.                                                                 |

## **16.5 Empty State**

| **Trigger**   | Collection is empty (first use or after full delete)                     |
| ------------- | ------------------------------------------------------------------------ |
| **Display**   | "Kütüphaneniz boş" message + single large "İlk kitabını ekle" CTA button |
| **Dashboard** | Widgets hidden, only empty state shown                                   |

## **16.6 Theme**

| **Mode**          | Dark mode only - no light mode toggle |
| ----------------- | ------------------------------------- |
| **Style**         | Dark academic / editorial aesthetic   |
| **Typography**    | See Section 22 - Design System        |
| **Color palette** | See Section 22 - Design System        |

# **17\. Bulk Operations**

## **17.1 Selection Mechanism**

| **Checkbox**    | Each row has a checkbox for individual selection         |
| --------------- | -------------------------------------------------------- |
| **Shift+click** | Selects a range between two checkboxes                   |
| **Select all**  | Header checkbox selects all visible rows on current page |

## **17.2 Available Bulk Actions**

Applied to all selected books:

- Update category
- Update location
- Update status
- Toggle favorites
- Toggle donatable flag
- Assign to series

# **18\. Design System**

_Design system specification is included in the spec so that AI coding tools (Codex) produce consistent, on-brand UI without ambiguity._

## **18.1 Visual Direction**

| **Aesthetic** | Dark academic / editorial                                 |
| ------------- | --------------------------------------------------------- |
| **Mood**      | Quiet, typographic, intellectual - not gamified or flashy |
| **Mode**      | Dark only. No light mode.                                 |

## **18.2 Color Palette**

| **Token**             | **Hex** | **Usage**                              |
| --------------------- | ------- | -------------------------------------- |
| **\--background**     | #0F0F0F | Page background                        |
| **\--surface**        | #1A1A1A | Cards, sidebar, modals                 |
| **\--surface-raised** | #222222 | Hover states, dropdowns                |
| **\--border**         | #2E2E2E | Dividers, input borders                |
| **\--text-primary**   | #F0EDE8 | Main text - warm off-white             |
| **\--text-secondary** | #8A8578 | Labels, metadata, muted text           |
| **\--accent**         | #C8A96E | Gold - CTAs, active states, highlights |
| **\--accent-hover**   | #D4B87A | Accent hover state                     |
| **\--destructive**    | #C0392B | Delete, error states                   |
| **\--success**        | #2ECC71 | Import success, resolved states        |

## **18.3 Typography**

| **Primary font** | Inter - body text, UI labels, metadata                       |
| ---------------- | ------------------------------------------------------------ |
| **Display font** | Playfair Display - page titles, section headers, book titles |
| **Monospace**    | JetBrains Mono - ISBN, location codes                        |
| **Base size**    | 16px (1rem)                                                  |
| **Scale**        | Tailwind default type scale                                  |

## **18.4 Spacing & Layout**

| **Spacing system**      | Tailwind default (4px base unit)              |
| ----------------------- | --------------------------------------------- |
| **Page max-width**      | 1280px centered                               |
| **Sidebar width**       | 240px (desktop), hidden on mobile (hamburger) |
| **Content padding**     | 24px (desktop), 16px (mobile)                 |
| **Card border radius**  | 8px                                           |
| **Input border radius** | 6px                                           |

## **18.5 Component Notes**

- Buttons: Solid accent (#C8A96E) for primary actions. Ghost style for secondary. Destructive red for delete.
- Inputs: Dark surface background, subtle border, warm focus ring (accent color).
- Tables: Alternating row shading using --surface and --surface-raised.
- Star rating: Half-star increments, gold fill on active stars.
- Cover images: Consistent aspect ratio (2:3), rounded corners, subtle shadow.
- Modals / drawers: Backdrop blur, surface background, centered on desktop / bottom sheet on mobile.

# **19\. Scheduling System**

_RESOLVED: Monthly AI generation runs as a Vercel API Route triggered by Vercel Cron. The function summarizes the collection to a bounded prompt (≤2000 tokens) before calling the AI API. Expected runtime < 10s - within Vercel free-tier function limit. Results are written to ai_suggestions via Drizzle + Neon and served from there._

| **Cron schedule**  | 0 9 1 \* \* (9 AM on the 1st of each month)           |
| ------------------ | ----------------------------------------------------- |
| **Runtime**        | Vercel API Route (Node.js)                            |
| **Trigger**        | Vercel Cron Jobs (vercel.json)                        |
| **Prompt size**    | Bounded at ≤2000 tokens via server-side summarization |
| **Timeout budget** | < 10s expected; 60s hard limit on free tier           |
| **Output table**   | ai_suggestions (Neon)                                 |

# **20\. Storage Model**

| **Provider**        | Cloudflare R2                                                        |
| ------------------- | -------------------------------------------------------------------- |
| **Free tier**       | 10 GB storage + 1M Class A ops/month - far exceeds cover image needs |
| **Cover images**    | R2 bucket: archivum-covers                                           |
| **Custom uploads**  | Stored as {book_id}/custom.{ext}                                     |
| **Metadata covers** | URL reference only - not stored locally                              |
| **SDK**             | @aws-sdk/client-s3 (R2 is S3-compatible)                             |
| **Gallery**         | Not supported                                                        |

# **21\. Authentication Model**

| **Provider**         | NextAuth.js v5 - Credentials provider (email + password)       |
| -------------------- | -------------------------------------------------------------- |
| **Password hashing** | bcrypt via @auth/core                                          |
| **Session strategy** | JWT (stored in httpOnly cookie)                                |
| **Signup**           | Disabled - single user pre-seeded in DB                        |
| **Password reset**   | No email flow. Password forgotten = manual DB update by owner. |
| **Multi-user**       | Not supported                                                  |

_Password reset via email intentionally omitted for simplicity. This is a single-owner private system - recovery requires direct DB access via Neon console._

# **22\. Environment Model**

| **Development**        | Local Next.js dev server + Neon dev branch or local Postgres |
| ---------------------- | ------------------------------------------------------------ |
| **Production**         | Vercel + Neon + Cloudflare R2                                |
| **Env var prefix**     | ARCHIVUM\_                                                   |
| **Secrets management** | Vercel env vars (production), .env.local (development)       |
| **DB migrations**      | drizzle-kit push (dev) / drizzle-kit migrate (production)    |

# **Appendix: Resolved Design Decisions**

Complete log of all design decisions for Librarum v1.0.

| **Decision**                | **Resolution**                                                                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project name**            | Renamed from Archivum to Librarum.                                                                                                                                                                               |
| **Stack**                   | Supabase fully replaced: DB → Neon + Drizzle, Auth → NextAuth.js v5, Storage → Cloudflare R2, Functions → Vercel API Routes, pg_cron → Vercel Cron.                                                              |
| **ISBN lookup trigger**     | Auto-fetches on blur (300ms debounce) or instantly on barcode scan. No manual button. Falls through to manual entry if no result.                                                                                |
| **Barcode scanning**        | Mobile only (html5-qrcode). Scan button hidden on desktop via md: breakpoint.                                                                                                                                    |
| **Removed book fields**     | original_title, language, translator removed. ISBN fetch covers publisher, year, page count automatically.                                                                                                       |
| **Multi-author support**    | Supported via book_authors junction table. Entered via autocomplete + inline create on book form.                                                                                                                |
| **Publisher field**         | Plain text field only. No separate publishers table.                                                                                                                                                             |
| **Status simplification**   | 5 statuses: owned, completed, abandoned, loaned, lost. "reading" and "unread" removed.                                                                                                                           |
| **Series UX**               | "Bu bir seri mi?" checkbox reveals series fields inline. Autocomplete + create for series name. total_volumes optional - missing volume detection only runs when set. series_order is integer (no half-volumes). |
| **Cover image priority**    | Custom upload > Metadata URL > Placeholder. Custom upload persists until deleted.                                                                                                                                |
| **Favorite author logic**   | Fully automatic - highest average rating. Derived at query time. No manual toggle.                                                                                                                               |
| **Author entry & edit**     | Autocomplete + inline create on book form. Name edits on author detail page propagate to all books.                                                                                                              |
| **Category / deletion** | Sets field to null on affected books. Books are never deleted.                                                                                                                                                   |
| **Dashboard**               | "Currently reading" widget removed. Replaced with favorite authors + category distribution chart.                                                                                                                |
| **Empty state**             | "Kütüphaneniz boş" + single "İlk kitabını ekle" CTA. Widgets hidden until collection has entries.                                                                                                                |
| **Loan return flow**        | "Mark as Returned" button clears loan fields, prompts for new status. No due dates or reminders.                                                                                                                 |
| **Book form**               | Add and Edit share the same form component in two modes. Cover upload is a section within the form.                                                                                                              |
| **Book detail layout**      | Two-column: left = cover + bibliographic info, right = notes, rating, location, status, actions.                                                                                                                 |
| **List pagination**         | Standard pagination, 25 books per page. No infinite scroll.                                                                                                                                                      |
| **Bulk selection**          | Checkbox per row + shift+click range selection + select-all header checkbox.                                                                                                                                     |
| **Search language**         | Turkish only. Deterministic rule engine on frontend. No AI dependency.                                                                                                                                           |
| **Search results UI**       | Inline dropdown. No separate results page.                                                                                                                                                                       |
| **CSV import**              | Standard column names documented in Settings → Import. No mapping wizard. Invalid rows skipped with post-import report.                                                                                          |
| **Offline support**         | Removed.                                                                                                                                                                         |
| **Theme**                   | Dark mode only. Dark academic / editorial aesthetic. Design system in Section 18.                                                                                                                                |
| **AI chat context size**    | Collection summary (~500 tokens) + filtered subset (≤1500 tokens). Full collection never sent to AI.                                                                                                             |
| **Cron timeout**            | Collection summarized to ≤2000 tokens before AI call. Expected < 10s, within Vercel free-tier limit.                                                                                                             |
| **Password reset**          | No email flow. Recovery = manual DB update via Neon console.                                                                                                                                                     |
| **Stats granularity**       | read_month + read_year. No day-level precision.                                                                                                                                                                  |
| **Deployment layout**       | Single root Next.js app on Vercel. `src/lib/ai` runs only in Vercel API Routes, and `src/lib/db` contains the Drizzle schema plus Neon client.                                                                  |
