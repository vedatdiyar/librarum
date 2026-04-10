import { Metadata } from "next";
import { appPageTitles } from "@/lib/navigation";
import { SettingsClient } from "./_components/settings-client";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: appPageTitles.settings,
  description: "Kütüphane ayarları, kategori ve seri yönetimi."
};

export default function SettingsPage() {
  return (
    <section className="space-y-10 pb-20">
      <PageHero
        description="Kütüphane arşivinizi yapılandırın, veri akışlarını yönetin ve yapay zeka deneyiminizi huzurlu bir yönetim panelinden kontrol edin."
        kicker="Yönetim Merkezi"
        title={appPageTitles.settings}
      />
      <SettingsClient />
    </section>
  );
}
