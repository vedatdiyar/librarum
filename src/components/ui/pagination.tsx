"use client";

import * as React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}


export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className
}: PaginationProps) {
if (totalItems === 0) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push("...");
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (end < totalPages - 1) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn(
      "flex flex-col items-center justify-between gap-6 py-12 duration-500 animate-in fade-in fill-mode-both slide-in-from-bottom-4 md:flex-row",
      className
    )}>
      {/* Left: Navigation Controls */}
      <div className="flex items-center gap-1">
        <Button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          variant="ghost"
          className="h-9 w-9 p-0 text-white/50 transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-20"
          title="İlk Sayfa"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          variant="ghost"
          className="h-9 w-9 p-0 text-white/50 transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-20"
          title="Önceki Sayfa"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="mx-2 flex items-center gap-1">
          {getPageNumbers().map((page, idx) => (
            <React.Fragment key={`page-${idx}`}>
              {page === "..." ? (
                <div className="flex h-9 w-9 items-center justify-center text-white/80">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  onClick={() => onPageChange(page as number)}
                  variant="ghost"
                  className={cn(
                    "h-9 w-9 p-0 text-xs font-bold",
                    currentPage === page 
                      ? "bg-white/10 text-white" 
                      : "text-white/70",
                    "hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          variant="ghost"
          className="h-9 w-9 p-0 text-white/50 transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-20"
          title="Sonraki Sayfa"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          variant="ghost"
          className="h-9 w-9 p-0 text-white/50 transition-all duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-20"
          title="Son Sayfa"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>


      {/* Right: Record Summary */}
      <div className="text-[10px] font-bold tracking-widest text-white/60 uppercase">
        <span className="text-white/90">{startItem} - {endItem}</span>
        <span className="mx-2">/</span>
        <span className="text-white/90">{totalItems} öge</span>
      </div>
    </div>
  );
}
