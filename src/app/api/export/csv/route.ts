import { withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { CSV_BOOK_COLUMNS } from "@/lib/import-export";
import { exportAllBooks } from "@/server/books-service";

export const dynamic = "force-dynamic";

import { PublisherOption } from "@/types";

function escapeCSV(value: string | number | boolean | PublisherOption | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = typeof value === "object" ? value.name : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const GET = withApiHandler(async () => {
  await requireSession();
  const allBooks = await exportAllBooks();

  const rows = allBooks.map((book) => {
    return [
      book.title,
      book.authors.map((author) => author.name).join("; "),
      book.isbn,
      book.publisher,
      book.publicationYear,
      book.pageCount,
      book.status,
      book.rating,
      book.copyCount,
      book.donatable,
      book.readMonth,
      book.readYear,
      book.loanedTo,
      book.loanedAt,
      book.category?.name ?? "",
      book.series?.name ?? "",
      book.series?.seriesOrder ?? "",
      book.location?.locationName ?? "",
      book.location?.shelfRow ?? "",
      book.personalNote
    ].map(escapeCSV).join(",");
  });

  const csvContent = [CSV_BOOK_COLUMNS.join(","), ...rows].join("\n");

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="librarum_export.csv"'
    }
  });
});
