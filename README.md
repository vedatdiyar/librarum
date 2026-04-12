# Librarum

**Kişisel Kitap Koleksiyonu ve Kütüphane Yönetim Sistemi**

Librarum, fiziksel kitap koleksiyonunuzu dijital ortamda düzenlemenize ve yönetmenize olanak tanıyan, modern ve bireysel kullanıma odaklı bir web uygulamasıdır. Okuma süreçlerinizi takip edin, koleksiyonunuzu analiz edin, yapay zeka destekli öneriler alın ve verilerinizi güvenle yedekleyin.

---

## 🚀 Özellikler

- **Kapsamlı Kitap Yönetimi:** Eser adı, yazar, ISBN, yayınevi, yayın yılı, sayfa sayısı, kategori, seri bilgisi, fiziksel konum, kopya sayısı, ödünç durumu, kişisel notlar, okuma tarihleri ve puanlama.
- **Akıllı Arama:** Türkçe doğal dil desteği ile kitap, yazar, seri, kategori, konum ve durum bazlı hızlı arama.
- **Seri ve Yazar Analizi:** Eksik cilt tespiti, favori yazarlar, kategori ve yazar dağılımı raporları.
- **Yapay Zeka Destekli Öneriler:** Aylık okuma önerileri ve koleksiyonunuza özel soru-cevap/sohbet paneli.
- **Veri Yedekleme:** JSON ve CSV formatlarında içe ve dışa aktarma seçenekleri.
- **Karanlık Akademi Teması:** Tipografi odaklı, sade ve sadece koyu mod destekleyen şık arayüz.
- **Mobil Cihaz Desteği:** Tam duyarlı (responsive) tasarım ve mobil cihazlarda barkod tarayıcı ile ISBN okuma.
- **Gelişmiş Ödünç Takibi:** Kopya yönetimi, ödünç verilen kişi ve tarih bilgisi, kolay iade işlemleri.
- **Toplu İşlemler:** Çoklu seçim özelliği ile kategori, konum, durum güncellemeleri ve bağışa uygunluk işaretleme.

---

## 🛠️ Teknoloji Yığını ve Mimari

- **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS, Zustand, TanStack Query, shadcn/ui
- **Backend:** Neon PostgreSQL, Drizzle ORM, NextAuth.js (E-posta + Şifre), Vercel Functions & Cron, Cloudflare R2 (Kapak Görselleri)
- **Barındırma:** Vercel, Neon, Cloudflare R2
- **Ek Özellikler:** Otomatik ISBN metadata çekimi (Open Library & Google Books), benzer kayıt kontrolü (fuzzy duplicate), JWT tabanlı oturum yönetimi.

---

## ⚡ Kurulum

1. **Projeyi Klonlayın:**
	```bash
	git clone https://github.com/kullanici/librarum.git
	cd librarum
	```

2. **Bağımlılıkları Yükleyin:**
	```bash
	npm install
	```

3. **Yapılandırma Dosyasını Hazırlayın:**
	- `.env.local` dosyasını oluşturun ve gerekli değişkenleri tanımlayın (Örnekler için `spec.md` ve `vercel.json` dosyalarını inceleyebilirsiniz).
	- Neon, Cloudflare R2 ve e-posta servis bilgilerini ekleyin.

4. **Veritabanı Şemasını Oluşturun:**
	```bash
	npm run db:generate
	```

5. **Geliştirme Sunucusunu Başlatın:**
	```bash
	npm run dev
	```

---

## 👤 Kullanım Bilgileri

- **Giriş:** Varsayılan kullanıcı veritabanı üzerinde önceden tanımlanır. Güvenlik gereği kayıt olma ve şifre sıfırlama özellikleri bulunmamaktadır.
- **Kitap Ekleme:** ISBN bilgisi girildiğinde metadata otomatik olarak çekilir; ulaşılamayan durumlarda manuel giriş yapılabilir.
- **Seri ve Yazar Yönetimi:** Formlar üzerinden dinamik olarak oluşturma ve düzenleme imkanı.
- **Ödünç İşlemleri:** Ödünç verme aşamasında kişi ve tarih bilgisi kaydedilir, iade süreci tek tıkla tamamlanır.
- **Yapay Zeka Önerileri:** Sistem her ay otomatik olarak veya isteğe bağlı (manuel) olarak okuma önerileri oluşturur.
- **Veri Yönetimi:** Ayarlar → İçe/Dışa Aktar menüsü üzerinden tam yedekleme ve geri yükleme gerçekleştirilebilir.

---

## 📦 Proje Yapısı

```
src/
  app/           # Next.js uygulama rotaları ve sayfaları
  components/    # UI bileşenleri ve tasarım öğeleri
  db/            # Drizzle şemaları, migrasyonlar ve tohumlama (seed)
  lib/           # Yardımcı fonksiyonlar, Yapay Zeka entegrasyonu, navigasyon
  server/        # Sunucu tarafı servis işleyicileri
  stores/        # Zustand durum yönetimi (store)
  types/         # TypeScript tip tanımlamaları
```

---

## 🤝 Katkıda Bulunma

Projeye katkı sağlamak isterseniz:
- Mevcut kod stilini korumaya özen gösterin (ESLint, Tailwind, shadcn/ui).
- Değişikliklerinizi göndermeden önce `npm run check:full` komutu ile tüm kontrolleri çalıştırın.
- Yeni bir özellik eklemeden önce lütfen bir "Issue" açarak planlanan değişikliği tartışmaya açın.

---

## 📄 Lisans

Bu proje MIT lisansı kapsamında sunulmaktadır.

---
