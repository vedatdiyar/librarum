import type { Metadata } from "next";
import { appPageTitles } from "@/lib/navigation";
import { NewBookForm } from "./_components/new-book-form";

export const metadata: Metadata = {
  title: appPageTitles.newBook,
};

export default function NewBookPage() {
  return <NewBookForm />;
}
