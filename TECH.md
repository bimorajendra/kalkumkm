# TECH.md: Takaran (nama kerja)

> Arsitektur teknis, stack, dan backend untuk kalkulator HPP.
> Status: Draf v0.2, 25 September 2026.
> Urutan otoritas jika ada pertentangan: `PRD.md` > `TECH.md` > `DESIGN.md` untuk hal teknis; `DESIGN.md` menang untuk tampilan.
> `<domain>` dipakai sebagai placeholder sampai nama produk dan domain final.

---

## 1. Prinsip

1. **Data resep dan harga tidak pernah meninggalkan HP pengguna.** Endpoint server tidak menerima data itu (NFR-05).
2. **Aplikasi offline-first.** Kalkulasi, data lokal, dan verifikasi lisensi bekerja offline; checkout dan klaim kode memerlukan koneksi (NFR-03).
3. **Backend sekecil mungkin.** Cloudflare menangani daftar tunggu gratis, checkout Mayar, pesanan, dan penerbitan kode Pro.
4. **Satu bahasa di semua lapisan:** TypeScript di aplikasi, landing, backend, dan skrip.
5. **Rumus ada di satu tempat.** Aplikasi dan demo di landing memakai paket `calc` yang sama.

---
## 2. Jawaban Singkat: Backendnya Apa?

Aplikasi menyimpan dan menghitung data usaha di HP. Backend Cloudflare hanya menangani operasi bisnis yang butuh server:

| Kebutuhan | Di mana | Kenapa |
|---|---|---|
| Hitung HPP, simpan bahan/resep, alarm margin, gambar daftar harga | **HP** (PWA + IndexedDB) | Privat dan tetap berjalan offline |
| Verifikasi kode Pro | **HP** (Ed25519) | Tidak perlu internet saat aktivasi |
| Daftar tunggu gratis | **Server**: Worker (Hono) + D1 | Pesanan validasi tersimpan terpusat |
| Checkout dan konfirmasi pembayaran Mayar | **Server**: Worker + Mayar API v2 | API key server-side; pembayaran diverifikasi sebelum lisensi terbit |
| Pembayaran manual dan penerbitan kode | **Server**: admin Worker di balik Cloudflare Access | Jalur cadangan dan kunci privat tetap di server |
| Daftar kode dicabut | **Server**: endpoint baca-saja, opsional | Mitigasi kode yang dibagikan; F36 belum dijadwalkan |
| Analitik | Umami, event anonim | Mengukur aktivasi tanpa isi resep |

Semua layanan berjalan di Cloudflare Pages, Workers, dan D1. Integrasi Mayar memakai `fetch` dari Worker, tanpa SDK. Aplikasi tidak mengirim data resep atau harga.

---

## 3. Arsitektur

```text
Pengguna (PWA) <-> Cloudflare Pages
  | hitung dan data usaha tetap lokal
  | POST /v1/checkout, GET /v1/checkout/:id/license
  | paymentUrl dibuka dengan navigasi browser biasa
  v
Worker Hono + D1 <-> Mayar API v2
  | POST /v1/webhooks/mayar menerima event, lalu Worker GET invoice untuk verifikasi
  | /admin/* di balik Cloudflare Access: cek status, tandai pembayaran manual, terbitkan kode
  | tabel: orders, licenses, webhook_events

Landing Astro -> POST /v1/preorders (daftar tunggu gratis) + Turnstile
PWA -> Umami untuk event anonim; opsional GET /v1/licenses/revoked
```

---
## 4. Stack

Versi di-pin saat inisialisasi project ke rilis stabil terbaru, lalu dicatat di `package.json`.

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Monorepo | pnpm workspaces | Paket `calc` dan `ui` dipakai bersama tanpa publish |
| Bahasa | TypeScript `strict` | Satu bahasa dari UI sampai backend |
| Aplikasi | Vite + React | Build statis ringan, cocok untuk PWA offline |
| PWA | `vite-plugin-pwa` (Workbox) | Precache, manifest, dan alur update |
| Database lokal | Dexie.js + `dexie-react-hooks` | IndexedDB dengan query reaktif; UI otomatis berubah saat harga bahan diubah |
| Angka | big.js + persen dalam basis poin | Tidak ada selisih pembulatan float (NFR-04) |
| Validasi | Zod | Validasi form, file cadangan, dan body API dengan skema yang sama |
| Routing | React Router (mode data) | Hanya 5 layar |
| Styling | Tailwind CSS v4 + CSS variable dari `DESIGN.md` | Tema terang/gelap cukup mengganti variabel |
| Komponen aksesibel | Radix UI (Slider, Dialog, Checkbox, Accordion) + Vaul (bottom sheet) | Keyboard, fokus, dan ARIA sudah benar |
| Ikon | `lucide-react` | Tree-shaken, sesuai DESIGN.md |
| Font | `@fontsource` Instrument Serif + Plus Jakarta Sans, subset latin | Di-host sendiri agar bekerja offline |
| Tanda tangan | `@noble/ed25519` | Kecil, diaudit, jalan di semua browser |
| Landing | Astro + satu React island | HTML statis cepat dan ramah SEO |
| Backend | Hono di Cloudflare Workers | Ringan, TypeScript, gaya Express yang familiar |
| Database server | Cloudflare D1 + Drizzle ORM | SQLite terkelola; Drizzle memudahkan pindah ke Postgres nanti |
| Anti-spam | Cloudflare Turnstile + batas per IP | Form pre-order tidak dibanjiri bot |
| Admin auth | Cloudflare Access (login email) | Tidak perlu membangun sistem login |
| Analitik | Umami (Cloud atau self-host) | Event kustom, tanpa cookie pelacak |
| Lint/format | Biome | Satu alat, cepat |
| Test | Vitest, fast-check, Playwright, axe-core, `@cloudflare/vitest-pool-workers` | Rumus, UI, aksesibilitas, dan API |
| CI/CD | GitHub Actions + Wrangler | Deploy Pages, Worker, dan migrasi D1 |

---

## 5. Struktur Repo

```
takaran/
â”œâ”€ apps/
â”‚  â”œâ”€ app/                  # PWA kalkulator
â”‚  â”‚  â”œâ”€ src/
â”‚  â”‚  â”‚  â”œâ”€ routes/         # hitung, bahan, resep, penawaran, lainnya, aktivasi
â”‚  â”‚  â”‚  â”œâ”€ features/       # ingredients, recipes, pricing, quote, share, backup, license
â”‚  â”‚  â”‚  â”œâ”€ db/             # skema Dexie, migrasi, repository
â”‚  â”‚  â”‚  â”œâ”€ lib/            # format rupiah, analytics, storage.persist
â”‚  â”‚  â”‚  â””â”€ main.tsx
â”‚  â”‚  â””â”€ vite.config.ts
â”‚  â”œâ”€ web/                  # landing Astro
â”‚  â”‚  â””â”€ src/pages/index.astro
â”‚  â””â”€ api/                  # Worker Hono
â”‚     â”œâ”€ src/
â”‚     â”‚  â”œâ”€ routes/public.ts
â”‚     â”‚  â”œâ”€ routes/admin.tsx   # halaman admin (Hono JSX)
â”‚     â”‚  â”œâ”€ db/schema.ts       # Drizzle
â”‚     â”‚  â””â”€ license.ts
â”‚     â”œâ”€ migrations/
â”‚     â””â”€ wrangler.toml
â”œâ”€ packages/
â”‚  â”œâ”€ calc/                 # rumus HPP murni + test
â”‚  â”œâ”€ ui/                   # token warna, komponen tumpukan isometrik, slider
â”‚  â””â”€ schema/               # skema Zod bersama (backup, preorder, lisensi)
â”œâ”€ scripts/
â”‚  â”œâ”€ gen-keys.mjs           # buat pasangan kunci Ed25519
â”‚  â””â”€ issue-license.mjs    # cadangan: terbitkan kode dari laptop
â”œâ”€ PRD.md  DESIGN.md  TECH.md  antislop.md
â””â”€ .github/workflows/
```

---

## 6. Mesin Hitung (`packages/calc`)

Paket TypeScript murni tanpa dependensi UI atau browser. Semua rumus CR-01 sampai CR-10 di PRD bagian 7 ada di sini.

### 6.1 Representasi angka

| Jenis | Disimpan sebagai | Contoh |
|---|---|---|
| Uang input | `number` bilangan bulat rupiah | `14000` |
| Persen | `number` bilangan bulat basis poin | 40% = `4000`, 41,5% = `4150` |
| Takaran | `number` dalam satuan dasar (gram, ml, butir, pcs) | `150` |
| Hasil antara | `Big` (big.js), presisi penuh | `1737.5` |
| Tampilan | dibulatkan di lapisan format saja | `Rp 1.738` |

### 6.2 API

```ts
export function unitPrice(ing: Ingredient): Big;                       // CR-01
export function batchCost(r: Recipe, ctx: CalcContext): Big;           // CR-02, CR-03, CR-09
export function hppPerPortion(r: Recipe, ctx: CalcContext): Big;       // CR-04
export function suggestPrice(hpp: Big, marginBp: number,
  commissionBp: number, roundingStep: number): number;                  // CR-05
export function actualMarginBp(price: number, hpp: Big,
  commissionBp: number): number;                                        // CR-06
export function markupBp(price: number, hpp: Big): number;             // CR-07
export function profitPerHour(price: number, hpp: Big, commissionBp: number,
  portions: number, hoursPerBatch: Big): Big;                           // CR-08
export function breakdown(r: Recipe, ctx: CalcContext): CostBreakdown; // untuk tumpukan isometrik
export function findCycles(recipes: Recipe[]): string[][];             // CR-09
export function recalcAll(ctx: CalcContext): Map<RecipeId, RecipeResult>;
```

- `CalcContext` berisi peta bahan dan resep, jadi fungsi tidak menyentuh database.
- `recalcAll` menghitung ulang semua resep setelah harga bahan berubah. Dengan 100 resep, ini cukup cepat tanpa cache (NFR-01: di bawah 200 ms). Tambahkan memo per resep hanya jika profil menunjukkan perlu.
- Sub-resep diurutkan secara topologis; siklus ditolak sebelum disimpan.

### 6.3 Test wajib

- Contoh brownies PRD bagian 7 sebagai test tetap: bahan Rp 27.800, HPP Rp 2.925, harga Rp 5.000, margin 4150 bp, markup 7094 bp, harga ojol Rp 7.500, untung per jam Rp 22.133 (dibulatkan), dan margin 3850 bp setelah telur naik ke Rp 2.600.
- Property test (fast-check): `actualMarginBp(suggestPrice(hpp, m, c, step), hpp, c) >= m` untuk semua input valid.
- Siklus sub-resep A memakai B memakai A harus terdeteksi.
- Cakupan baris paket `calc` minimal 95%.

---

## 7. Aplikasi (`apps/app`)

### 7.1 Skema IndexedDB (Dexie)

```ts
db.version(1).stores({
  ingredients:  'id, name, updatedAt',
  recipes:      'id, name, isSubRecipe, updatedAt',
  channels:     'id, name',
  quoteOptions: 'id, recipeId',
  priceHistory: '++id, ingredientId, changedAt', // dicatat dari v1.0, dipakai di v1.2
  settings:     'key',                            // businessName, roundingStep, defaultMarginBp, license, lastBackupAt, backupReminderDismissedUntil
});
```

- ID memakai ULID (terurut waktu, aman dibuat offline).
- Setiap perubahan skema lewat `db.version(n).upgrade()`; migrasi diuji dengan data v1.
- Saat pertama dibuka, panggil `navigator.storage.persist()` agar browser tidak menghapus data saat ruang penyimpanan HP menipis.

### 7.2 State

- Data persisten: langsung dari Dexie lewat `useLiveQuery`. Tidak ada salinan kedua di store global.
- State sementara layar (posisi slider, sheet terbuka): state komponen React. Tidak perlu Redux/Zustand di MVP.
- Hasil hitung: `useMemo` di atas `recalcAll`.

### 7.3 PWA dan offline

| Aspek | Keputusan |
|---|---|
| Precache | Seluruh app shell, font, ikon, dan ilustrasi SVG |
| Runtime cache | Tidak ada; aplikasi tidak mengambil data dari jaringan |
| Update | `registerType: 'prompt'`; tampilkan "Versi baru tersedia. Muat ulang" dan tidak memuat ulang otomatis saat pengguna sedang mengetik |
| Manifest | `display: standalone`, warna tema dari token `--bg`, ikon placeholder `[LOGO]` sampai logo final |
| Instalasi | Tombol "Pasang di layar utama" hanya muncul jika event `beforeinstallprompt` tersedia; di iOS tampilkan petunjuk teks |

### 7.4 Cadangan dan pulihkan (FR-24, NFR-09)

```json
{
  "app": "takaran",
  "schemaVersion": 2,
  "exportedAt": "2026-09-25T08:00:00.000Z",
  "data": { "ingredients": [], "recipes": [], "channels": [], "quoteOptions": [], "priceHistory": [], "settings": [] },
  "sha256": "â€¦"
}
```

- Nama file: `takaran-cadangan-YYYY-MM-DD.json`. Di HP memakai Web Share API dengan unduhan sebagai cadangan.
- Pulihkan memvalidasi Zod, cek `sha256`, menampilkan ringkasan, meminta konfirmasi, lalu menulis semua tabel dalam satu transaksi Dexie. Format v2 menyimpan lisensi sebagai `{ code, payload, activatedAt }`; file v1 tetap didukung dan kode lisensinya dimigrasikan saat dipulihkan.
- Lisensi ikut tersimpan agar pindah HP tidak perlu kode baru. `pendingCheckout` tidak ikut dicadangkan karena token klaim hanya berlaku untuk checkout di perangkat saat ini.
- Pengingat muncul jika resep tersimpan dan cadangan terakhir lebih dari 14 hari; penutupan menyimpan `backupReminderDismissedUntil` selama 7 hari.
### 7.5 Gambar daftar harga dan penawaran (FR-20 sampai FR-22)

- Template ditulis sebagai komponen SVG, lalu digambar ke `<canvas>` dan diekspor ke PNG 1080Ã—1920 atau 1080Ã—1080. Font dimuat lewat `document.fonts.ready` sebelum menggambar.
- Tombol bagikan memakai `navigator.share({ files, text })` dengan teks berisi `https://<domain>/?ref=share` agar target BG-3 bisa diukur.
- PDF (jika jadi dibutuhkan): jsPDF dimuat dengan `import()` hanya saat tombol PDF ditekan.

### 7.6 Batas versi gratis (FR-25)

- Dicek di lapisan repository sebelum menulis ke Dexie, bukan hanya disembunyikan di UI.
- Saat batas tercapai, data tidak pernah dihapus; pengguna hanya tidak bisa menambah resep keempat.

---

## 8. Lisensi Pro

### 8.1 Format kode

```
payload = {"v":1,"id":"lic_01J8...","n":"Kue Bu Rina","p":"pro","t":1790000000}
code    = base64url(JSON kanonik payload) + "." + base64url(ed25519_sign(payload))
link    = https://app.<domain>/aktivasi#<code>
```

- Kode dikirim sebagai **tautan aktivasi**. Kode ada di bagian `#`, sehingga tidak terkirim ke server atau tercatat di log.
- Aplikasi menyimpan daftar kunci publik (berdasarkan `v`) agar kunci bisa diganti tanpa membatalkan lisensi lama.
- Verifikasi sepenuhnya offline. Jika online, aplikasi mengambil `/v1/licenses/revoked` paling sering sekali sehari dan menonaktifkan Pro jika `id` ada di daftar itu.

### 8.2 Alur penerbitan

Ada dua jalur yang memakai penanda tangan lisensi yang sama:

1. **Mayar:** Worker membuat invoice lewat API v2. Setelah webhook atau cek ulang, Worker selalu meminta detail invoice dan hanya melanjutkan jika status `paid` dan nominal sama dengan `price_idr` pesanan. Worker mengubah status menjadi `paid`, menerbitkan kode, lalu menandai `licensed`.
2. **Manual sebagai cadangan:** pembeli transfer atau membayar QRIS statis yang sudah dikonfigurasi, lalu mengirim bukti lewat `wa.me`. Admin memeriksa bukti, memilih **Tandai lunas**, mengisi nominal dan metode, lalu **Terbitkan kode**.

Kembali ke status Mayar tersedia dari admin dan klaim lisensi. Redirect browser Mayar tidak pernah dianggap bukti pembayaran. Jika Worker bermasalah, skrip `pnpm license:issue -- --name "Kue Bu Rina" --order ID_PESANAN` tersedia sebagai prosedur darurat dan harus dicatat di pesanan.
### 8.3 Pengelolaan kunci

- `scripts/gen-keys.mjs` membuat pasangan kunci sekali. Kunci privat disimpan sebagai Worker secret dan di password manager; **tidak pernah** di-commit.
- Kunci publik di-commit ke `apps/app/src/features/license/keys.ts`.

---

## 9. Backend (`apps/api`)

### 9.1 Endpoint publik

| Metode | Path | Body / respons | Catatan |
|---|---|---|---|
| `GET` | `/v1/health` | `{ ok: true }` | Monitoring |
| `POST` | `/v1/preorders` | Data daftar tunggu menjadi `201 { data: { id } }` | Zod, Turnstile, 5 per IP per jam; fase validasi gratis |
| `POST` | `/v1/checkout` | Nama, email, WhatsApp, nama usaha, persetujuan, token Turnstile menjadi `{ orderId, paymentUrl, claimToken }` | Harga berasal dari `PRICING`; Zod, Turnstile, batas 5 per IP per jam; Worker membuat invoice Mayar v2 |
| `POST` | `/v1/webhooks/mayar?token=â€¦` | Event `payment.received`; reminder diabaikan | Bandingkan token secara constant-time, simpan event unik, balas `200`, verifikasi invoice dalam `ctx.waitUntil` sebelum menerbitkan kode |
| `GET` | `/v1/checkout/:orderId/license` | Header `X-Claim-Token`; kode lisensi atau `202` | Token salah mendapat `404`; cek Mayar paling sering sekali per 30 detik per pesanan |
| `GET` | `/v1/licenses/revoked` | `{ ids: string[] }` | F36 belum dijadwalkan; jika dibangun, cache paling lama satu jam |

Worker memanggil Mayar v2 memakai `POST /invoices/create` dan `GET /invoices/:id` di base URL sandbox atau produksi. Harga invoice berasal dari server `PRICING`, tidak dari body klien. `extraData.orderId` dikirim saat membuat invoice. Pencocokan webhook memakai `data.id` ke `mayar_invoice_id`; bila id tidak tersedia, email hanya boleh dipakai jika cocok dengan tepat satu pesanan `checkout` dalam 48 jam. Kecocokan ambigu tidak menerbitkan lisensi otomatis.

CORS hanya mengizinkan origin Takaran. Webhook Mayar tidak memakai CORS.
### 9.2 Endpoint admin (di balik Cloudflare Access)

| Metode | Path | Fungsi |
|---|---|---|
| `GET` | `/admin` | Daftar pesanan dan status, termasuk `mayar_invoice_id` |
| `POST` | `/admin/orders/:id/paid` | Tandai pembayaran transfer/QRIS manual lunas |
| `POST` | `/admin/orders/:id/check-mayar` | Cek ulang status invoice dan nominal langsung ke Mayar |
| `POST` | `/admin/orders/:id/license` | Terbitkan kode manual untuk pesanan `paid` |
| `POST` | `/admin/orders/:id/refund` | Tandai refund setelah refund manual di dashboard Mayar; tidak mencabut kode |
| `POST` | `/admin/orders/:id/resend` | Tampilkan tautan `wa.me` untuk mengirim ulang tautan aktivasi |
| `GET` | `/admin/export.csv` | Unduh rekap pesanan |

Worker memeriksa JWT Cloudflare Access di setiap rute admin.
### 9.3 Skema D1

```sql
CREATE TABLE orders (
  id                 TEXT PRIMARY KEY,
  business_name      TEXT NOT NULL,
  customer_name      TEXT,
  email              TEXT,
  whatsapp           TEXT NOT NULL,
  product_type       TEXT,
  status             TEXT NOT NULL CHECK (status IN ('waitlist','preorder','checkout','paid','licensed','refunded','cancelled')),
  price_idr          INTEGER,
  pay_method         TEXT,
  mayar_invoice_id   TEXT UNIQUE,
  claim_token_hash   TEXT,
  paid_at            TEXT,
  licensed_at        TEXT,
  terminal_at        TEXT,
  source             TEXT,
  consent_at         TEXT NOT NULL,
  created_at         TEXT NOT NULL
);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE licenses (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id),
  plan        TEXT NOT NULL DEFAULT 'pro',
  issued_at   TEXT NOT NULL,
  revoked_at  TEXT
);

CREATE TABLE webhook_events (
  id            TEXT PRIMARY KEY,
  event_key     TEXT NOT NULL UNIQUE,
  invoice_id    TEXT,
  event_type    TEXT NOT NULL,
  payload_json  TEXT NOT NULL,
  received_at   TEXT NOT NULL,
  processed_at  TEXT,
  result        TEXT
);
```

Migrasi dikelola lewat `drizzle-kit` dan `wrangler d1 migrations apply`. Token klaim 32 byte dibuat acak; hanya hash SHA-256 yang disimpan di D1. Kode lisensi hanya disimpan di tabel `licenses` setelah pembayaran diverifikasi.
### 9.4 Data pribadi

- Daftar tunggu mengumpulkan nama usaha dan nomor WhatsApp. Checkout juga mengumpulkan nama, email, nomor WhatsApp, nama usaha, dan persetujuan. Form menjelaskan tujuan penggunaan dan menautkan kebijakan privasi.
- Data resep, bahan, takaran, dan harga usaha tidak dikumpulkan.
- Retensi: pesanan berstatus terminal (`licensed`, `refunded`, atau `cancelled`) dan payload webhook terkait dihapus atau dianonimkan setelah 12 bulan dari `terminal_at` melalui Cron Trigger bulanan. Untuk `waitlist` yang tidak berlanjut, hapus nomor kontak setelah 12 bulan.
- Pengguna bisa meminta penghapusan data lewat email kontak; admin menyediakan tindakan hapus. Pengecualian atau masa simpan lain harus ditetapkan setelah kebutuhan operasional dikonfirmasi.

---
## 10. Analitik

Hanya event anonim, tanpa isi resep, nama bahan, atau harga.

| Event | Properti | Untuk metrik |
|---|---|---|
| `app_opened` | `installed: boolean` | Dasar |
| `ingredient_first_added` | | Awal aktivasi |
| `hpp_first_shown` | `seconds_bucket` | Target HPP pertama < 5 menit |
| `price_updated` | | Retensi |
| `margin_alarm_shown` | `count_bucket` | Nilai fitur alarm |
| `share_image_created` | `format` | BG-3 |
| `paywall_shown` | `trigger` | Konversi |
| `checkout_started` | `plan` | Konversi ke halaman pembayaran |
| `checkout_paid` | `plan` | Pembayaran terkonfirmasi, tanpa email, nomor, atau order id |
| `license_activated` | | BG-1 |
| `backup_exported` | | NFR-09 |
| Landing: `preorder_submitted` | `source` | Validasi |

Umami dimuat dengan `defer` dan diabaikan jika gagal; aplikasi tidak menunggu analitik.

---
## 11. Keamanan

- **CSP** aplikasi: `default-src 'self'; script-src 'self' <umami> https://challenges.cloudflare.com; connect-src 'self' https://api.<domain> <umami>; frame-src 'self' https://challenges.cloudflare.com; img-src 'self' data: blob:; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'`. Turnstile memerlukan script dan frame; `connect-src` tetap terbatas ke API Takaran dan Umami.
- Landing dan halaman checkout aplikasi mengizinkan `https://challenges.cloudflare.com` pada `script-src` dan `frame-src` untuk Turnstile. `connect-src` aplikasi tidak berubah.
- Header: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` yang mematikan kamera, mikrofon, dan lokasi.
- Tidak ada skrip pihak ketiga lain di aplikasi. Mayar checkout dibuka melalui navigasi browser biasa; origin Mayar tidak ditambahkan ke `connect-src`.
- File cadangan yang dipulihkan selalu divalidasi skema; teks dari file tidak pernah dirender sebagai HTML.

---

## 12. Anggaran Performa

| Metrik | Batas | Alat |
|---|---|---|
| JS awal aplikasi (gzip) | â‰¤ 170 KB | `size-limit` di CI |
| Total muatan awal termasuk font (gzip) | â‰¤ 250 KB (NFR-02) | `size-limit` |
| Hitung ulang 100 resep | < 200 ms di profil CPU 4Ã— lebih lambat | Benchmark Vitest |
| Lighthouse (mobile) aplikasi dan landing | Performa â‰¥ 90, Aksesibilitas 100 | Lighthouse CI |
| Landing: JS di luar demo | 0 KB | Astro statis |

---

## 13. Testing

| Lapisan | Alat | Cakupan |
|---|---|---|
| Rumus | Vitest + fast-check | Semua CR, contoh PRD bagian 7, property test margin |
| Repository/DB | Vitest + `fake-indexeddb` | Batas gratis, migrasi skema, pulihkan cadangan |
| Lisensi | Vitest | Kode valid, kode diubah satu karakter, kunci versi lama, kode dicabut |
| UI end-to-end | Playwright | J-1 sampai J-4 dari PRD; mode offline (`context.setOffline(true)`); lebar 320, 390, 768, 1280 px; tema terang dan gelap; hanya keyboard |
| Aksesibilitas | `@axe-core/playwright` | Semua layar dan state; nol pelanggaran serius |
| API | `@cloudflare/vitest-pool-workers` | Validasi, Turnstile palsu, batas per IP, admin tanpa JWT ditolak |

Hasil test ini menjadi bukti di Delivery Gate `antislop.md`.

---

## 14. CI/CD dan Lingkungan

| Tahap | Pemicu | Isi |
|---|---|---|
| Cek | Setiap PR | Biome, `tsc --noEmit`, Vitest, build, `size-limit`, Playwright, axe; API Mayar memakai sandbox atau mock |
| Preview | Setiap PR | Pages preview untuk app dan web; Worker ke lingkungan preview dengan D1 terpisah; tidak boleh memakai kredensial produksi |
| Produksi | Rilis setelah persetujuan | Migrasi D1, deploy Worker, deploy Pages; konfigurasi produksi dilakukan pemilik |

### Variabel dan secret

| Nama | Tempat | Rahasia? |
|---|---|---|
| `LICENSE_PRIVATE_KEY` | Worker secret; seed base64url yang sama tersimpan lokal di `.env.local` melalui `pnpm license:keys` | Ya |
| `TURNSTILE_SECRET` | Worker secret | Ya |
| `MAYAR_API_KEY` | Worker secret | Ya |
| `MAYAR_WEBHOOK_TOKEN` | Worker secret | Ya |
| `MAYAR_BASE_URL` | Worker var: `https://api.mayar.io/hl/v2` untuk sandbox atau `https://api.mayar.id/hl/v2` untuk produksi | Tidak |
| `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN` | Worker vars | Tidak |
| `ALLOWED_ORIGINS`, `APP_URL` | Worker vars; `APP_URL` dipakai untuk tautan aktivasi dan skrip penerbitan darurat | Tidak |
| `PUBLIC_TURNSTILE_SITEKEY` | Build `apps/web` | Tidak |
| `VITE_TURNSTILE_SITEKEY` | Build `apps/app` untuk form checkout | Tidak |
| `VITE_API_URL`, `VITE_UMAMI_WEBSITE_ID` | Build `apps/app` | Tidak |
| `VITE_PAYMENT_BANK_NAME`, `VITE_PAYMENT_ACCOUNT_NAME`, `VITE_PAYMENT_ACCOUNT_NUMBER`, `VITE_PAYMENT_QRIS_IMAGE`, `VITE_SELLER_WA` | Build `apps/app` untuk cadangan manual; semua nilai wajib agar jalur manual tampil. `VITE_PAYMENT_QRIS_IMAGE` menunjuk aset QRIS lokal. | Tidak |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions secret | Ya |

Pengujian memakai endpoint sandbox atau mock; tidak pernah memanggil produksi. API key Mayar tidak dikirim ke browser dan tidak ditaruh dalam dokumentasi nilai contoh.

---
## 15. Urutan Pengerjaan (dicocokkan dengan timeline PRD)

| Minggu | Teknis |
|---|---|
| 0 | Monorepo, `apps/web` landing dengan daftar tunggu gratis, demo memakai mesin hitung saat siap, `apps/api`, Turnstile, D1, dan admin dasar |
| 1 | `packages/calc` lengkap dengan test PRD bagian 7; landing dan demo selesai |
| 2 | Skema Dexie, layar Bahan dan Resep, HPP |
| 3 | Kartu hasil, slider, tumpukan isometrik, alarm margin |
| 4 | PWA offline, cadangan, lisensi, checkout Mayar sandbox, penerbitan otomatis dan jalur manual di admin |
| 5 | Sub-resep, saluran, penawaran, gambar daftar harga |
| 6 | Uji, verifikasi akun/kanal Mayar, aktivasi pembayaran saat rilis, perbaikan, rilis |

---
## 16. Backend v2 (belum dibangun)

Dibangun hanya jika salah satu pemicu ini terjadi: pengguna Pro meminta sinkronisasi antar HP atau kebutuhan operasional baru yang tidak tertangani oleh backend saat ini.

| Fitur | Rencana |
|---|---|
| Sinkronisasi/cadangan cloud | Cadangan terenkripsi di HP lalu disimpan ke R2. Server hanya melihat data acak |
| Akun | Magic link email tanpa kata sandi |
| Database | Tetap D1 selama cukup; evaluasi Postgres terkelola dengan Drizzle jika kebutuhan query berubah |

Checkout Mayar dan penerbitan lisensi termasuk v1.0, bukan rencana Backend v2.

---
## 17. Keputusan dan Alternatif yang Ditolak

| Keputusan | Alternatif | Kenapa ditolak |
|---|---|---|
| PWA Vite, bukan Next.js | Next.js `output: 'export'` + Serwist | Fitur server Next.js tidak terpakai dan muatan awal lebih berat |
| Tanpa backend untuk data aplikasi | Supabase/Firebase sejak awal | Data resep akan meninggalkan HP, melanggar NFR-05 |
| Cloudflare Workers + D1 | VPS dengan Node, Postgres, Docker, Nginx | Perlu dirawat dan dibayar untuk beban validasi kecil |
| Lisensi tanda tangan offline | Server lisensi yang dicek setiap buka aplikasi | Aplikasi harus tetap bekerja offline |
| Mayar Invoice v2 dengan transfer/QRIS manual sebagai cadangan | Pembayaran manual saja | Checkout otomatis dibutuhkan saat rilis; jalur manual tetap berguna saat akun atau kanal Mayar bermasalah |
| PWA, bukan aplikasi native | Flutter/React Native | Pengguna datang dari tautan WA dan harus bisa langsung memakai aplikasi |
| Dexie langsung, tanpa store global | Zustand/Redux | Data sudah reaktif dari Dexie |

---
## 18. Pertanyaan Teknis Terbuka

1. Nama domain final untuk `<domain>`, CORS, redirect Mayar, dan manifest.
2. Umami Cloud atau self-host?
3. Verifikasi akun Mayar dan kanal pembayaran mana yang akan diaktifkan saat rilis?
4. Kontrak webhook Mayar yang tersedia di akun: header/signature, nama event, dan ID event unik untuk idempotensi. Sampai dikonfirmasi, webhook memakai token rahasia dan verifikasi ulang `GET invoice`.
5. Apakah event webhook menyertakan `data.id` dan `extraData.orderId` secara konsisten? Jika tidak, fallback email hanya jika satu pesanan checkout cocok dalam 48 jam; kecocokan ambigu perlu pemeriksaan admin.
6. Nilai biaya aktual per kanal dan paket Mayar yang digunakan. Harga pelanggan tetap Rp 79.000/Rp 49.000; biaya ditanggung proyek.
7. PDF penawaran di v1.0 atau cukup PNG (terkait PRD open question 6)?
8. Apakah daftar kode dicabut diperlukan di v1.0, atau tetap ditunda sebagai F36?
