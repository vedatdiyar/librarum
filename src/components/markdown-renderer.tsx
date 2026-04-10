"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content space-y-4", className)}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-white" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="mt-6 mb-3 border-b border-white/5 pb-2 font-serif text-2xl font-bold tracking-tight text-white" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mt-4 mb-2 font-serif text-xl font-bold tracking-tight text-white" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 text-[15px] leading-relaxed text-white/80 last:mb-0" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-4 list-none space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-4 list-inside list-decimal space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="flex items-start gap-2 text-[14px] text-white/70">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
              <span className="flex-1">{props.children}</span>
            </li>
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-primary/90 not-italic" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="text-white italic" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="my-4 border-l-2 border-primary/30 pl-4 text-foreground/80" {...props} />
          ),
          code: ({ node, ...props }) => (
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm text-primary" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
