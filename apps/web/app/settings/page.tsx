import { Metadata } from "next";
import { SettingsClient } from "./components/settings-client";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Ayarlar | ExLibris",
  description: "Kütüphane ayarları, kategori, etiket ve seri yönetimi."
};

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHero
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Yonetim</p>
            <p className="page-metric-value">5</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Kategori, etiket, seri, aktarim ve AI tercihleri tek yerde.
            </p>
          </div>
        }
        description="Kutuphane koleksiyonunu duzenle, veri akislarini yonet ve AI tercihlerini sakin bir yonetim yuzeyinden kontrol et."
        kicker="Settings"
        title="Ayarlar"
      />
        <SettingsClient />
    </div>
  );
}
