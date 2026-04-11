"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, cn } from "@/components/ui";
import type { SearchResultItem } from "@/types";
import { readJsonResponse } from "@/lib/shared";

async function fetchSearchResults(query: string, signal?: AbortSignal) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
  return readJsonResponse<SearchResultItem[]>(response);
}

function BookThumb({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/2 shadow-xl transition-transform duration-500 group-hover:scale-110">
        <Image alt={`${title} cover`} className="object-cover" fill sizes="36px" src={coverUrl} />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/2 p-1.5 transition-all duration-500">
      <span className="line-clamp-3 text-center text-[7px] font-bold tracking-tighter text-foreground uppercase">{title}</span>
    </div>
  );
}

type GlobalSearchProps = {
  compact?: boolean;
  expandable?: boolean;
  className?: string;
  preventAutoFocus?: boolean;
  mobile?: boolean;
};

export function GlobalSearch({ compact = false, expandable = false, className, preventAutoFocus = false, mobile = false }: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
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
        setIsExpanded(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const searchQuery = useQuery({
    enabled: debouncedQuery.length >= 2,
    queryKey: ["search", debouncedQuery],
    queryFn: ({ signal }) => fetchSearchResults(debouncedQuery, signal),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false
  });

  const shouldShowDropdown =
    isFocused &&
    debouncedQuery.length >= 2;

  const isSearchActive = !expandable || isExpanded || query.length > 0;
  const isCollapsedExpandable = expandable && !isExpanded && !query;

  return (
    <div className={cn("group relative", className)} ref={rootRef}>
      {isCollapsedExpandable ? (
        <button
          aria-label="Koleksiyonda ara"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-white/2 transition-all duration-300 hover:scale-105 hover:border-white/10 hover:bg-white/5 active:scale-95",
            compact ? "h-10 w-10" : ""
          )}
          onClick={() => {
            setIsExpanded(true);
            if (!preventAutoFocus) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          type="button"
        >
          <Search className="h-5 w-5 text-foreground/70 transition-colors duration-500" />
        </button>
      ) : (
        <div
          className={cn(
            "flex items-center rounded-xl border border-white/5 bg-white/2 transition-all duration-300 focus-within:border-primary/30 focus-within:bg-white/5 hover:border-white/10 hover:bg-white/5",
            "w-full min-w-[280px] px-4 py-3 md:min-w-[320px]",
            compact && (isExpanded || !expandable) ? "px-3 py-2.5" : ""
          )}
        >
          <div className={cn(
            "relative flex shrink-0 items-center justify-center text-foreground/70 transition-all duration-500 group-focus-within:text-primary",
            "h-8 w-8"
          )}>
            <Search className="h-5 w-5" />
          </div>

          <label className="sr-only" htmlFor="globalSearchQuery">Koleksiyonda ara</label>
          <input
            aria-label="Koleksiyonda ara"
            ref={inputRef}
            id="globalSearchQuery"
            name="globalSearchQuery"
            className="ml-3 w-full bg-transparent text-[14px] font-medium text-white/90 transition-all duration-500 outline-none placeholder:text-foreground"
            onBlur={() => {
              if (query === "") {
                setIsExpanded(false);
              }
              window.setTimeout(() => setIsFocused(false), 150);
            }}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsFocused(false);
                setIsExpanded(false);
              }
            }}
            placeholder="Kitaplarda, yazarlarda ara..."
            value={query}
          />

          {isSearchActive && (
            <div className="ml-2">
               {searchQuery.isLoading && debouncedQuery.length >= 2 ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                ) : !compact ? (
                  <div className="hidden items-center gap-1.5 rounded-lg border border-white/5 bg-white/3 px-2 py-1 text-[9px] font-bold tracking-[0.2em] text-foreground uppercase md:flex">
                    Bul
                  </div>
                ) : null}
            </div>
          )}
        </div>
      )}

      {shouldShowDropdown && (
        <div className={cn(
          "z-50 mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/2 shadow-2xl backdrop-blur-3xl transition-all duration-500 animate-in fade-in slide-in-from-top-4",
          mobile ? "relative w-full border-none bg-transparent shadow-none backdrop-blur-none" : "absolute right-0 left-0"
        )}>
          <Command shouldFilter={false} className="bg-transparent">
            <CommandInput className="hidden" value={query} />
            <CommandList className={cn("max-h-[440px]", mobile && "max-h-[70vh]")}>
              {searchQuery.isLoading ? (
                <div className="flex items-center justify-center p-12">
                   <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : searchQuery.isError ? (
                <div className="px-6 py-8 text-sm font-medium text-rose-400 italic">
                  Sonuçlara ulaşılamadı.
                </div>
              ) : (
                <>
                  <CommandEmpty className="px-6 py-12 text-center text-sm text-foreground italic">Eşleşen kitap bulunamadı.</CommandEmpty>
                  <CommandGroup 
                    heading={<span className="mb-2 block border-b border-white/5 px-2 py-4 text-[10px] font-bold tracking-[0.3em] text-foreground uppercase">Keşif Dizini</span>}
                  >
                    {(searchQuery.data ?? []).map((result, idx) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => {
                          setIsFocused(false);
                          router.push(`/books/${result.slug}`);
                        }}
                        className="group flex cursor-pointer items-center gap-4 px-4 py-3 transition-all duration-300 animate-in fade-in fill-mode-both slide-in-from-left-4 hover:bg-white/3 aria-selected:bg-white/5"
                        style={{ animationDelay: `${idx * 40}ms` }}
                        value={result.id}
                      >
                        <BookThumb coverUrl={result.coverUrl} title={result.title} />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-[15px] font-bold tracking-tight text-white/90 transition-colors group-hover:text-primary">
                            {result.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-foreground italic">
                            {result.authors.join(", ") || "Bilinmeyen Yazar"}
                          </p>
                        </div>
                        <div className="shrink-0 opacity-0 transition-transform duration-500 group-hover:translate-x-1 group-hover:opacity-100">
                           <Search className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
