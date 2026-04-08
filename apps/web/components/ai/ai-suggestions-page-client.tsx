"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  BookOpen,
  Boxes,
  HeartHandshake,
  LoaderCircle,
  MessageSquareText,
  Sparkles,
  Telescope
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  cn
} from "@librarum/ui";
import type {
  AiChatRequest,
  AiFavoriteAuthorItem,
  AiMissingVolumeItem,
  AiRecommendationItem,
  AiSuggestionPayload,
  AiSuggestionsResponse
} from "@librarum/types";
import { readJsonResponse } from "@librarum/lib";
import { useIsMobile } from "@/lib/client/use-is-mobile";
import { PageHero } from "@/components/page-hero";

const EXAMPLE_QUESTIONS = [
  "Ne okumalıyım?",
  "Eksik ciltlerim hangileri?",
  "Bağışlayabileceğim kitaplar?"
];

async function fetchAiSuggestions() {
  return readJsonResponse<AiSuggestionsResponse>(await fetch("/api/ai/suggestions"));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function SuggestionsSkeleton() {
  return (
    <section className="space-y-6">
      <div className="page-hero rounded-[24px] p-8">
        <div className="h-4 w-24 animate-pulse rounded-full bg-surface-raised" />
        <div className="mt-6 h-14 w-80 animate-pulse rounded-2xl bg-surface-raised" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`skeleton-${index}`}>
            <CardContent className="space-y-4 p-6">
              <div className="h-6 w-32 animate-pulse rounded-xl bg-surface-raised" />
              <div className="h-28 animate-pulse rounded-2xl bg-surface-raised" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <section className="page-stack">
      <PageHero
        action={
          <Button onClick={onAnalyze} size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Koleksiyonunu Analiz Et
          </Button>
        }
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Aylık akış</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Sistem ayda bir kez koleksiyon özetini, favori yazarlarını ve blok listeni
              kullanarak yeni bir okuma planı oluşturacak.
            </p>
          </div>
        }
        description="Vercel cron ilk çalıştığında aylık okuma önerileri, eksik ciltler ve bekleyenler öncelikleri burada görünecek. Bu sırada koleksiyonunu manuel olarak analiz ettirebilirsin."
        kicker="Yapay Zeka Önerileri"
        title="Henüz aylık analiz yok"
      />
    </section>
  );
}

function SectionCard<TItem>({
  title,
  description,
  icon: Icon,
  items,
  renderItem
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: TItem[];
  renderItem: (item: TItem, index: number) => React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          <div className="rounded-[18px] border border-accent/30 bg-accent/10 p-3 text-accent">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border/80 bg-surface-raised/55 p-4 text-sm text-text-secondary">
            Bu bölüm için önerilecek yeni bir madde çıkmadı.
          </div>
        ) : (
          items.map((item, index) => {
            const itemKey = (item as any).id || (item as any).title || (item as any).series || (item as any).author || index;
            return (
              <div
                className="panel-muted p-4"
                key={typeof itemKey === "string" ? itemKey : `item-${index}`}
              >
                {renderItem(item, index)}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationItemView({ item }: { item: AiRecommendationItem }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl text-text-primary">{item.title}</h3>
        <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-text-secondary">
          {Math.round(item.score)}/100
        </span>
      </div>
      <p className="text-sm uppercase tracking-[0.18em] text-accent">{item.author}</p>
      <p className="text-sm leading-7 text-text-secondary">{item.reason}</p>
    </div>
  );
}

function MissingVolumeItemView({ item }: { item: AiMissingVolumeItem }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl text-text-primary">{item.series}</h3>
        <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-text-secondary">
          {Math.round(item.score)}/100
        </span>
      </div>
      <p className="text-sm uppercase tracking-[0.18em] text-accent">
        Eksik ciltler: {item.missingVolumes.join(", ")}
      </p>
      <p className="text-sm leading-7 text-text-secondary">{item.reason}</p>
    </div>
  );
}

function FavoriteAuthorItemView({ item }: { item: AiFavoriteAuthorItem }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl text-text-primary">{item.author}</h3>
        <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-text-secondary">
          {Math.round(item.score)}/100
        </span>
      </div>
      <p className="text-sm uppercase tracking-[0.18em] text-accent">
        Önerilen başlıklar: {item.suggestedTitles.join(", ")}
      </p>
      <p className="text-sm leading-7 text-text-secondary">{item.reason}</p>
    </div>
  );
}

function AiChatDrawer({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [message, setMessage] = React.useState("");
  const [responseText, setResponseText] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const reset = React.useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessage("");
    setResponseText("");
    setErrorMessage(null);
    setIsStreaming(false);
  }, []);

  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleSubmit = React.useCallback(async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isStreaming) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);
    setErrorMessage(null);
    setResponseText("");

    try {
      const payload: AiChatRequest = {
        message: trimmedMessage
      };
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const error = await readJsonResponse<{ error?: { message?: string } }>(response);
        throw new Error(error?.error?.message ?? "AI yanıtı alınamadı.");
      }

      if (!response.body) {
        throw new Error("AI yanıtı stream olarak dönmedi.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        setResponseText((current) => current + decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "AI yanıtı alınamadı.");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      setIsStreaming(false);
    }
  }, [isStreaming, message]);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className={cn(
          "gap-0 overflow-y-auto p-0",
          isMobile ? "h-[88vh] w-full" : "w-full max-w-[620px]"
        )}
        side={isMobile ? "bottom" : "right"}
      >
        <div className="flex min-h-full flex-col">
          <div className="border-b border-border px-6 py-5">
            <SheetHeader>
              <SheetTitle>Koleksiyonunu Analiz Et</SheetTitle>
              <p className="pr-8 text-sm leading-7 text-text-secondary">
                Bu panel stateless çalışır; cevaplar kaydedilmez. Örnek sorulardan birini
                kullanabilir ya da kendi sorunu yazabilirsin.
              </p>
            </SheetHeader>
          </div>

          <div className="space-y-6 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((question) => (
                <button
                  className="rounded-full border border-border/80 bg-surface-raised px-3 py-2 text-sm text-text-secondary transition hover:border-border hover:bg-surface-elevated hover:text-text-primary"
                  key={question}
                  onClick={() => setMessage(question)}
                  type="button"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label
                className="text-sm uppercase tracking-[0.18em] text-text-secondary"
                htmlFor="ai-message"
              >
                Sorun
              </label>
              <textarea
                aria-label="Sorun"
                className="min-h-32 w-full rounded-[24px] border border-border/80 bg-surface-raised px-4 py-3 text-sm leading-7 text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
                id="ai-message"
                onChange={(event) => setMessage(event.target.value)}
                placeholder={EXAMPLE_QUESTIONS.join(" / ")}
                value={message}
              />
              <Button onClick={handleSubmit} variant="primary">
                {isStreaming ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Analiz ediliyor
                  </>
                ) : (
                  <>
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Gönder
                  </>
                )}
              </Button>
            </div>

            <div className="panel-muted p-5">
              <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-text-secondary">
                <Bot className="h-4 w-4" />
                AI Yanıt
              </div>
              {errorMessage ? (
                <p className="text-sm leading-7 text-destructive">{errorMessage}</p>
              ) : responseText ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-text-primary">
                  {responseText}
                </p>
              ) : (
                <p className="text-sm leading-7 text-text-secondary">
                  Burada anlık AI yanıtını göreceksin.
                </p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SuggestionsContent({
  suggestion,
  onAnalyze
}: {
  suggestion: AiSuggestionPayload & { generatedAtLabel: string };
  onAnalyze: () => void;
}) {
  return (
    <section className="page-stack">
      <PageHero
        action={
          <Button onClick={onAnalyze} size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Koleksiyonunu Analiz Et
          </Button>
        }
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Son analiz</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">{suggestion.generatedAtLabel}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-accent">{suggestion.model}</p>
          </div>
        }
        description={suggestion.summary}
        kicker="Yapay Zeka Önerileri"
        title="Aylık koleksiyon okuma planı"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          description={suggestion.sections.readingList.description}
          icon={BookOpen}
          items={suggestion.sections.readingList.items}
          renderItem={(item) => <RecommendationItemView item={item} />}
          title={suggestion.sections.readingList.title}
        />
        <SectionCard
          description={suggestion.sections.missingVolumes.description}
          icon={Boxes}
          items={suggestion.sections.missingVolumes.items}
          renderItem={(item) => <MissingVolumeItemView item={item} />}
          title={suggestion.sections.missingVolumes.title}
        />
        <SectionCard
          description={suggestion.sections.favoriteAuthors.description}
          icon={Telescope}
          items={suggestion.sections.favoriteAuthors.items}
          renderItem={(item) => <FavoriteAuthorItemView item={item} />}
          title={suggestion.sections.favoriteAuthors.title}
        />
        <SectionCard
          description={suggestion.sections.backlog.description}
          icon={HeartHandshake}
          items={suggestion.sections.backlog.items}
          renderItem={(item) => <RecommendationItemView item={item} />}
          title={suggestion.sections.backlog.title}
        />
      </div>
    </section>
  );
}

export function AiSuggestionsPageClient() {
  const [chatOpen, setChatOpen] = React.useState(false);
  const suggestionsQuery = useQuery({
    queryKey: ["ai", "suggestions"],
    queryFn: fetchAiSuggestions
  });

  if (suggestionsQuery.isLoading) {
    return (
      <>
        <SuggestionsSkeleton />
        <AiChatDrawer onOpenChange={setChatOpen} open={chatOpen} />
      </>
    );
  }

  if (suggestionsQuery.isError) {
    return (
      <>
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI önerileri yüklenemedi</CardTitle>
              <CardDescription>
                {suggestionsQuery.error instanceof Error
                  ? suggestionsQuery.error.message
                  : "Aylık AI önerileri alınamadı."}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
        <AiChatDrawer onOpenChange={setChatOpen} open={chatOpen} />
      </>
    );
  }

  const suggestion = suggestionsQuery.data?.suggestion ?? null;

  return (
    <>
      {suggestion ? (
        <SuggestionsContent
          onAnalyze={() => setChatOpen(true)}
          suggestion={{
            ...suggestion.content,
            generatedAtLabel: formatDate(suggestion.generatedAt)
          }}
        />
      ) : (
        <EmptyState onAnalyze={() => setChatOpen(true)} />
      )}

      <AiChatDrawer onOpenChange={setChatOpen} open={chatOpen} />
    </>
  );
}
