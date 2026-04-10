export const CSV_BOOK_COLUMNS = [
  "title",
  "authors",
  "isbn",
  "publisher",
  "publicationYear",
  "pageCount",
  "status",
  "rating",
  "copyCount",
  "donatable",
  "readMonth",
  "readYear",
  "loanedTo",
  "loanedAt",
  "category",
  "series",
  "seriesOrder",
  "locationName",
  "shelfRow",
  "personalNote"
] as const;

export const CSV_BOOK_COLUMN_DESCRIPTIONS: Record<
  (typeof CSV_BOOK_COLUMNS)[number],
  string
> = {
  title: "Kitap başlığı. Zorunlu.",
  authors: "Noktalı virgülle ayrılmış yazar listesi. Zorunlu.",
  isbn: "ISBN-10 veya ISBN-13.",
  publisher: "Yayıncı.",
  publicationYear: "Yayın yılı.",
  pageCount: "Sayfa sayısı.",
  status: "owned, completed, abandoned, loaned veya lost. Boş bırakılırsa owned olur.",
  rating: "0.5 adımlarla 0.5-5.0 arası puan.",
  copyCount: "Kopya sayısı. Boş bırakılırsa 1 olur.",
  donatable: "true veya false.",
  readMonth: "1-12 arası ay.",
  readYear: "Okuma yılı.",
  loanedTo: "Ödünç verilen kişi.",
  loanedAt: "ISO tarih-zaman.",
  category: "Kategori adı.",
  series: "Seri adı.",
  seriesOrder: "Serideki cilt numarası.",
  locationName: "Konum/oda adı.",
  shelfRow: "Raf harfi.",
  personalNote: "Kitap notu."
};
