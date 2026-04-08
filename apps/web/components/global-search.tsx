"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@exlibris/ui";
import { cn } from "@exlibris/ui";
import type { SearchResultItem } from "@exlibris/types";
import { readJsonResponse } from "@exlibris/lib";

async function fetchSearchResults(query: string) {
  return readJsonResponse<SearchResultItem[]>(
    await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  );
}

function BookThumb({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative h-14 w-10 overflow-hidden rounded-[8px] border border-border bg-surface-raised">
        <Image alt={`${title} kapagi`} className="object-cover" fill sizes="40px" src={coverUrl} />
      </div>
    );
  }

  return (
    <div className="book-placeholder h-14 w-10 rounded-[8px] p-1.5">
      <span className="line-clamp-3 font-display text-[9px] leading-3 text-text-primary">
        {title}
      </span>
    </div>
  );
}

type GlobalSearchProps = {
  compact?: boolean;
  className?: string;
};

export function GlobalSearch({ compact = false, className }: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  React.useEffect(() => {
    setIsFocused(false);
  }, [pathname]);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const searchQuery = useQuery({
    enabled: debouncedQuery.length >= 2,
    queryKey: ["search", debouncedQuery],
    queryFn: () => fetchSearchResults(debouncedQuery)
  });

  const shouldShowDropdown =
    isFocused &&
    debouncedQuery.length >= 2 &&
    (searchQuery.isLoading || searchQuery.isError || (searchQuery.data?.length ?? 0) >= 0);

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-[18px] border border-border/80 bg-surface-raised px-4 py-3 transition focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/15",
          compact ? "min-w-0" : ""
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-text-secondary" />
        <input
          aria-label="Arama yap"
          className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary/70"
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 120);
          }}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsFocused(false);
            }
          }}
          placeholder="Kitap, yazar, seri veya Türkçe komut ara..."
          value={query}
        />
        {searchQuery.isLoading && debouncedQuery.length >= 2 ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-text-secondary" />
        ) : null}
      </div>

      {shouldShowDropdown ? (
        <div
          className={cn(
            "absolute z-50 mt-2 w-full overflow-hidden rounded-[22px] border border-border/80 bg-surface shadow-shell",
            compact ? "left-0 right-0" : ""
          )}
        >
          <Command shouldFilter={false}>
            <CommandInput className="hidden" value={query} />
            <CommandList>
              {searchQuery.isLoading ? (
                <div className="px-4 py-6 text-sm text-text-secondary">Yükleniyor...</div>
              ) : searchQuery.isError ? (
                <div className="px-4 py-6 text-sm text-destructive">
                  {searchQuery.error instanceof Error
                    ? searchQuery.error.message
                    : "Arama tamamlanamadı."}
                </div>
              ) : (
                <>
                  <CommandEmpty>Sonuç bulunamadı</CommandEmpty>
                  <CommandGroup heading="Sonuçlar">
                    {(searchQuery.data ?? []).map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => {
                          setIsFocused(false);
                          router.push(`/books/${result.id}`);
                        }}
                        value={result.id}
                      >
                        <BookThumb coverUrl={result.coverUrl} title={result.title} />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-display text-lg text-text-primary">
                            {result.title}
                          </p>
                          <p className="line-clamp-1 text-sm text-text-secondary">
                            {result.authors.join(", ") || "Yazar belirtilmedi"}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      ) : null}
    </div>
  );
}
