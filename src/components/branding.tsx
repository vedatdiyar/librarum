"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandingProps {
  className?: string;
  onClose?: () => void;
  showSubtitle?: boolean;
  isCollapsed?: boolean;
}

export function Branding({ className, onClose, showSubtitle = true, isCollapsed = false }: BrandingProps) {
  return (
    <Link 
      className={cn(
        "group flex items-center gap-1.5 px-6 transition-all duration-300",
        isCollapsed && "justify-center px-4",
        className
      )} 
      href="/"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-center">
        <Image 
          alt="Librarum Logo" 
          height={42} 
          src="/logo.svg" 
          width={42}
          loading="eager"
          className={cn(
            "brightness-110 transition-transform duration-500 group-hover:scale-110",
            isCollapsed && "h-9 w-9"
          )}
        />
      </div>
      {!isCollapsed && (
        <div className="flex min-w-0 flex-col justify-center duration-300 animate-in fade-in slide-in-from-left-2">
          <p className="font-serif text-xl leading-none font-bold tracking-wider text-white transition-colors duration-300 group-hover:text-primary">Librarum</p>
          {showSubtitle && (
            <p className="mt-1 text-[10px] leading-none font-medium tracking-[0.2em] text-foreground uppercase">
              Özel Kütüphane
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
