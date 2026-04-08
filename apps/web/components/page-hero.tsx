"use client";

import * as React from "react";
import { Card, CardContent, cn } from "@exlibris/ui";

type PageHeroProps = {
  kicker: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function PageHero({
  kicker,
  title,
  description,
  aside,
  action,
  className
}: PageHeroProps) {
  return (
    <Card className={cn("page-hero", className)}>
      <CardContent className="page-hero-grid">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="page-kicker">{kicker}</p>
            <h1 className="page-title">{title}</h1>
            <p className="page-copy">{description}</p>
          </div>
          {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </CardContent>
    </Card>
  );
}
