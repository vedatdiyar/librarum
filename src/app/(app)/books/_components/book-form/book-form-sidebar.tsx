import Image from "next/image";
import {
  ScrollText,
  BookOpen,
  Library,
  Quote
} from "lucide-react";
import { cn } from "@/components/ui";
import type { BookFormMode, PublisherOption } from "@/types";
import type { BookFormValues } from "./use-book-form";
 
interface BookFormSidebarProps {
  categoryLabel: string;
  coverPreviewUrl: string | null;
  hasSummaryContent: boolean;
  mode: BookFormMode;
  summaryAuthors: string[];
  summaryLocation: string;
  summarySeries: string | null;
  summaryStatus: { label: string; className: string };
  summaryTitle: { title: string | null; subtitle: string | null };
  values: BookFormValues;
  publishers: PublisherOption[];
  stickyStyle?: React.CSSProperties;
}
 
export function BookFormSidebar(props: BookFormSidebarProps) {
  const {
    categoryLabel,
    coverPreviewUrl,
    hasSummaryContent,
    mode,
    summaryAuthors,
    summaryLocation,
    summarySeries,
    summaryStatus,
    summaryTitle,
    values,
    publishers
  } = props;
 
  return (
    <aside className="order-first hidden xl:order-last xl:block xl:self-start" style={props.stickyStyle}>
      <div className="space-y-6">
        <div className="glass-panel overflow-hidden rounded-[32px] border-white/8 bg-white/3 transition-transform duration-500 hover:scale-[1.01]">
          <div className="relative aspect-2/3 overflow-hidden border-b border-white/8 bg-linear-to-b from-white/5 to-transparent">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,160,89,0.16),transparent_58%)]" />
            {coverPreviewUrl ? (
              <>
                <Image
                  alt=""
                  className="shrink-0 object-cover opacity-40 blur-2xl"
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 70vw, 420px"
                  src={coverPreviewUrl}
                />
                <Image
                  alt={summaryTitle.title || "Başlık henüz girilmedi"}
                  className="relative rounded-xl object-contain transition-transform duration-1000 hover:scale-105"
                  fill
                  quality={90}
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 70vw, 420px"
                  src={coverPreviewUrl}
                />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-10 text-center">
                <div className="mb-5 rounded-2xl border border-white/10 bg-white/4 p-4">
                  <BookOpen className="h-8 w-8 text-primary/70" />
                </div>
                <div className="space-y-2">
                  <p className="font-serif text-3xl leading-tight font-bold tracking-tight wrap-break-word text-white">
                    {summaryTitle.title || "Başlık henüz girilmedi"}
                  </p>
                  {summaryTitle.subtitle ? (
                    <p className="font-serif text-xl leading-tight font-bold tracking-tight wrap-break-word text-white/75">
                      {summaryTitle.subtitle}
                    </p>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                  Kapak görseli eklenene kadar anlık özet burada şekillenmeye devam eder.
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="truncate text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase">
                  {mode === "add" ? "Yeni kitap taslağı" : "Güncellenen kitap"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                  <span className="text-[10px] font-bold tracking-[0.24em] text-primary uppercase">Anlık özet</span>
                </div>
                <div className={cn("rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase", summaryStatus.className)}>
                  {summaryStatus.label}
                </div>
              </div>

              <div>
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl leading-tight font-bold tracking-tight wrap-break-word text-white">
                    {summaryTitle.title || "Başlık henüz girilmedi"}
                  </h3>
                  {summaryTitle.subtitle ? (
                    <p className="text-sm font-semibold tracking-wide wrap-break-word text-primary/80 uppercase">
                      {summaryTitle.subtitle}
                    </p>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                  {summaryAuthors.length > 0
                    ? summaryAuthors.join(", ")
                    : "Yazar atandığında kitap bilgileri burada tamamlanacak."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                {
                  label: "Yayın Bilgisi",
                  value:
                    values.publisher || values.publicationYear?.trim()
                      ? [
                          values.publisher 
                            ? "id" in values.publisher 
                                ? publishers.find(p => p.id === (values.publisher as { id: string }).id)?.name
                                : (values.publisher as { name: string }).name
                            : null,
                          values.publicationYear?.trim()
                        ].filter(Boolean).join(" • ")
                      : "Yayınevi ve yayın yılı bekleniyor"
                },
                {
                  label: "Kitaplık Konumu",
                  value:
                    summaryLocation ||
                    (values.status === "loaned" ? values.loanedTo?.trim() || "Dış dolaşım bilgisi bekleniyor" : "Konum bilgisi eklenmedi")
                },
                {
                  label: "Sınıflandırma",
                  value: categoryLabel || "Kategori seçimi bekleniyor"
                },
                {
                  label: "Seri / Kopya",
                  value: summarySeries ? `${summarySeries} • ${values.copyCount || "1"} kopya` : `${values.copyCount || "1"} kopya arşivleniyor`
                }
              ].map((item) => (
                <div key={item.label} className="group/item rounded-2xl border border-white/8 bg-white/3 px-4 py-3 transition-colors duration-300 hover:border-primary/20 hover:bg-white/5">
                  <p className="text-[10px] font-bold tracking-[0.24em] text-foreground/45 uppercase group-hover/item:text-primary/70">{item.label}</p>
                  <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[28px] border-white/8 bg-white/3 p-5 transition-transform duration-500 hover:scale-[1.01]">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-3 text-primary">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.24em] text-primary uppercase">Koleksiyon Özeti</p>
              <p className="text-sm text-foreground/70">Formu doldururken şekillenen analiz özeti.</p>
            </div>
          </div>

          {hasSummaryContent ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 transition-colors duration-300 hover:border-white/12 hover:bg-white/5">
                <div className="mb-2 flex items-center gap-2 text-foreground/55">
                  <Library className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Koleksiyon hissi</span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  {values.isbn?.trim()
                    ? `ISBN tanımlandı, kayıt bibliyografik olarak daha güçlü bağlandı.`
                    : `ISBN girilirse başlık, kapak ve yazar eşitlemesi hızlanır.`}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 transition-colors duration-300 hover:border-white/12 hover:bg-white/5">
                <div className="mb-2 flex items-center gap-2 text-foreground/55">
                  <Quote className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Kişisel değerlendirme</span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  {values.personalNote?.trim()
                    ? values.personalNote.trim()
                    : "Kişisel değerlendirme ve notlar eklendiğinde kayıt yalnızca bir koleksiyon verisi değil, okuma deneyiminizi de yansıtacak."}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 px-4 py-5">
              <p className="text-sm leading-relaxed text-foreground/70">
                Sağ panel, formu doldurdukça kitabın kimliğini canlı olarak özetleyecek. İlk olarak başlık, yazar veya ISBN alanlarından başlayın.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
