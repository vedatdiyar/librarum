"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type BooksViewState = {
  view: "list" | "grid";
  setView: (view: "list" | "grid") => void;
};

export const useBooksViewStore = create<BooksViewState>()(
  persist(
    (set) => ({
      view: "list",
      setView: (view) => set({ view })
    }),
    {
      name: "librarum-books-view"
    }
  )
);
