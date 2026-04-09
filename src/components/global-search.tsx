"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, cn } from "@/components/ui";
import type { SearchResultItem } from "@/types";
import { readJsonResponse } from "@/lib/shared";

async function fetchSearchResults(query: string) {
  return readJsonResponse<SearchResultItem[]>(await fetch(`/api/search?q=${encodeURIComponent(query)}`));
}

function BookThumb({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative h-14 w-10 overflow-hidden rounded-xl border border-border/70 bg-card">
        <Image alt={`${title} kapagi`} className="object-cover" fill sizes="40px" src={coverUrl} />
      </div>
    );
  }

  return (
    <div className="book-placeholder h-14 w-10 rounded-xl p-1.5">
      <span className="line-clamp-3 font-display text-[9px] leading-3 text-text-primary/45">{title}</span>
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
          "flex items-center gap-3 rounded-[22px] border border-border/70 bg-card/92 px-4 py-3 shadow-xs transition-all duration-200 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/12",
          compact ? "rounded-[18px] px-3 py-2.5" : ""
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-text-secondary">
          <Search className="h-4 w-4" />
        </span>

        <input
          aria-label="Arama yap"
          className="w-full bg-transparent text-[15px] font-medium text-text-primary outline-none placeholder:text-text-secondary/55"
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
          placeholder="Kitap, yazar veya seri ara..."
          value={query}
        />

        {searchQuery.isLoading && debouncedQuery.length >= 2 ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        ) : !compact ? (
          <span className="hidden rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary md:inline-flex">
            Ara
          </span>
        ) : null}
      </div>

      {shouldShowDropdown ? (
        <div className="absolute left-0 right-0 z-50 mt-3 overflow-hidden rounded-[26px] border border-border/70 bg-card/98 shadow-lg backdrop-blur-sm">
          <Command shouldFilter={false}>
            <CommandInput className="hidden" value={query} />
            <CommandList>
              {searchQuery.isLoading ? (
                <div className="px-4 py-6 text-sm text-text-secondary">Yukleniyor...</div>
              ) : searchQuery.isError ? (
                <div className="px-4 py-6 text-sm text-destructive">
                  {searchQuery.error instanceof Error
                    ? searchQuery.error.message
                    : "Arama tamamlanamadi."}
                </div>
              ) : (
                <>
                  <CommandEmpty>Sonuc bulunamadi</CommandEmpty>
                  <CommandGroup heading="Sonuclar">
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
                          <p className="line-clamp-1 text-base font-semibold tracking-[-0.03em] text-text-primary">
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
