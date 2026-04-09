"use client";

import Image from "next/image";
import { Card, CardContent, cn } from "@/components/ui";

type PageHeroProps = {
  kicker: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
  action?: React.ReactNode;
  bgImage?: string;
  className?: string;
};

export function PageHero({
  kicker,
  title,
  description,
  aside,
  action,
  bgImage,
  className
}: PageHeroProps) {
  return (
    <Card className={cn("page-hero shadow-lg shadow-[#1a2324]/[0.06]", className)}>
      <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-primary/10 via-primary/4 to-transparent" />
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-secondary blur-3xl" />

      {bgImage ? (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.14]">
          <Image
            alt=""
            className="object-cover object-center mix-blend-multiply"
            fill
            priority
            src={bgImage}
          />
          <div className="absolute inset-0 bg-linear-to-r from-card via-card/96 to-card/78" />
        </div>
      ) : null}

      <CardContent className={cn("page-hero-grid relative z-10", bgImage ? "min-h-[340px]" : "")}>
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <div className="page-kicker">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {kicker}
            </div>

            <div className="space-y-4">
              <h1 className="page-title text-balance">{title}</h1>
              <p className="page-copy">{description}</p>
            </div>
          </div>

          {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
        </div>

        {aside ? (
          <div className="flex items-stretch xl:justify-end">
            <div className="w-full max-w-[320px]">{aside}</div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
