# RFC-004: Landing, Daftar Tunggu, Admin Pesanan, dan Analitik

## Ringkasan
Membangun semua yang dibutuhkan untuk validasi pasar di minggu 0: landing page dengan demo kalkulator yang bisa dipakai, form daftar tunggu gratis dengan API, halaman admin pesanan, retensi data, dan fondasi analitik. Bisa dirilis sebelum aplikasi selesai.

**Kompleksitas**: Medium
**Fitur**: F19 (Landing page), F20 (Daftar tunggu gratis dan API), F21 (Admin pesanan), F23 (Analitik), F32 (Retensi data pre-order)
**Dibangun di atas**: RFC-002, RFC-003
**Dibutuhkan oleh**: RFC-011 (penerbitan kode di admin), RFC-012 (checkout Mayar), RFC-016 (pengukuran `?ref=share`), RFC-017

## Pendekatan Teknis

### File
```
packages/schema/src/preorder.ts        # Zod: businessName, whatsapp, productType, consent, turnstileToken, source
packages/schema/src/analytics.ts       # ALLOWED_EVENTS + tipe properti
packages/schema/src/pricing.ts         # PRICING: harga Pro, harga pendiri, founderActive
apps/web/src/pages/index.astro
apps/web/src/pages/kebijakan-privasi.astro
apps/web/src/components/HeroDemo.tsx   # island
apps/web/src/components/PreorderForm.tsx  # island
apps/web/src/lib/analytics.ts
apps/web/public/_headers               # tambah challenges.cloudflare.com
apps/api/src/index.ts                  # app Hono + handler scheduled
apps/api/src/routes/public.ts
apps/api/src/routes/admin.tsx
apps/api/src/middleware/access-jwt.ts
apps/api/src/middleware/cors.ts
apps/api/src/lib/rate-limit.ts
apps/api/src/lib/turnstile.ts
apps/api/src/lib/phone.ts
apps/api/src/db/schema.ts
apps/api/migrations/0001_orders.sql
apps/api/test/preorders.test.ts
apps/api/test/admin.test.ts
apps/api/test/retention.test.ts
e2e/landing.spec.ts
```

### Landing (DESIGN 10.5)
- Section berurutan: navbar kapsul, hero, "Harga bahan naik", "Untungmu per jam", "Pesanan custom", Harga, daftar tunggu gratis, footer satu baris. FAQ **tidak** dibuat di RFC ini (DESIGN 10.5 no. 8).
- Tautan navbar menuju anchor section yang ada (`#cara-hitung`, `#harga-naik`, `#pesanan-custom`, `#harga`).
- `HeroDemo`: resep brownies contoh (data PRD bagian 7) dengan `SegmentedSlider` target untung dan satu input harga telur. `ResultCard` dan `IsometricStack` ikut berubah. Berlabel "Contoh hitungan".
- Section "Harga bahan naik" berisi tabel sebelum-sesudah dari `packages/calc`, bukan angka ketikan.
- Section Harga menampilkan Gratis dan Pro sesuai PRD bagian 12; harga dari konstanta `PRICING` di `packages/schema` agar sama dengan aplikasi.
- Semua halaman statis; JS hanya untuk island `HeroDemo` dan `PreorderForm` (`client:visible`).

### Daftar tunggu gratis
- Field: nama usaha, nomor WhatsApp, jenis jualan (kue, frozen, katering, lainnya), centang persetujuan wajib dengan teks "Nomor ini hanya dipakai untuk mengabari soal Takaran" + tautan kebijakan privasi, widget Turnstile. CTA "Daftar gratis"; tidak ada pembayaran pada tahap validasi.
- State: kosong, mengirim (tombol nonaktif, teks "Mengirim"), berhasil (pesan terima kasih), gagal (pesan sesuai kode error, isian tidak hilang), offline ("Kamu sedang offline").
- `source` diisi dari `utm_source` atau `ref` di URL.

### API publik
- `POST /v1/preorders`: validasi Zod; verifikasi Turnstile (`TURNSTILE_FAILED`); batas 5 per IP per jam (`RATE_LIMITED`, `429`); nomor dinormalisasi ke `62…` (`08…` dan `+62…` diterima; lainnya `VALIDATION_FAILED`); simpan status `waitlist`; respons `201 { data: { id } }`.
- Batas per IP disimpan di tabel `rate_limits` dengan **hash SHA-256 IP + `IP_SALT`**, bukan IP mentah. Binding rate limiting bawaan Workers tidak dipakai karena jendelanya terlalu pendek untuk batas per jam.
- CORS hanya `ALLOWED_ORIGINS`.

### Skema D1 (`0001_orders.sql`)
Tabel `orders` sesuai TECH 9.3, ditambah:
```sql
CREATE TABLE rate_limits (
  key TEXT NOT NULL, window_start TEXT NOT NULL, count INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);
```

### Admin
- Semua rute `/admin/*` melewati `access-jwt.ts` (verifikasi JWT Access dengan `ACCESS_AUD` dan `ACCESS_TEAM_DOMAIN`); tanpa JWT valid, `401`.
- `GET /admin`: tabel pesanan, filter status, urut terbaru; HTML Hono JSX yang bisa dipakai dengan keyboard.
- `POST /admin/orders/:id/paid`: nominal (rupiah bulat) dan metode (`transfer`, `qris`); status menjadi `paid`.
- `GET /admin/export.csv`: semua kolom `orders`.
- `POST /admin/orders/:id/delete`: hapus pesanan atas permintaan pemiliknya (RU-28).

### Retensi (F32)
Cron Trigger bulanan: hapus baris `orders` berstatus `waitlist` dengan `created_at` lebih dari 12 bulan; hapus `rate_limits` lebih dari 2 hari.

### Analitik
- `packages/schema/src/analytics.ts` berisi `ALLOWED_EVENTS` sesuai TECH 10.
- `track(event, props)` di `apps/web` menolak event di luar daftar (error saat dev, diam saat produksi) dan tidak pernah melempar ke pemanggil.
- Event landing: `preorder_submitted` dengan `source`. Kunjungan dengan `?ref=share` terbaca di Umami sebagai URL terpisah.
- Skrip Umami dimuat `defer`; CSP mengizinkan domainnya dari variabel build.

## Edge Case
- Turnstile gagal dimuat (diblokir jaringan): form menampilkan pesan dan tidak mengirim.
- Kiriman ganda dengan nomor yang sama: diterima sebagai baris baru; admin melihat duplikat (tidak diblokir agar tidak membocorkan keberadaan nomor).

## Aturan Terkait
RU-09, RU-19 s.d. RU-24, RU-26 s.d. RU-29, RU-31, RU-35 s.d. RU-38, RU-48, RU-56.

## Testing
- API: validasi, Turnstile palsu (lolos dan gagal), batas per IP, normalisasi nomor, admin tanpa JWT ditolak, paid, ekspor CSV, hapus, retensi.
- `landing.spec.ts`: semua anchor navbar menuju section yang ada; demo bereaksi pada slider dan harga telur; form di semua state; axe di kedua tema dan 4 lebar.

## Acceptance Criteria
- [x] Semua file di bagian Struktur ada
- [x] Landing memuat section DESIGN 10.5 no. 1 s.d. 7 dan 9 dalam urutan itu; section daftar tunggu gratis memakai CTA "Daftar gratis"; tidak ada FAQ, testimoni, rating, logo klien, atau statistik
- [x] Setiap tautan navbar menuju section yang ada di halaman
- [x] `HeroDemo` memakai `packages/calc` dan `packages/ui`, bereaksi pada slider dan harga telur, dan berlabel "Contoh hitungan"
- [x] Tabel "Harga bahan naik" dihitung dari `packages/calc`
- [x] Harga Gratis/Pro diambil dari konstanta `PRICING` di `packages/schema`
- [x] Halaman kebijakan privasi ada dan ditautkan dari form dan footer
- [x] JS landing di luar island `HeroDemo` dan `PreorderForm` adalah 0 KB
- [x] Form menampilkan state mengirim, berhasil, gagal, dan offline; isian tetap ada setelah gagal
- [x] `POST /v1/preorders` memvalidasi Zod, memverifikasi Turnstile, menormalisasi nomor ke `62…`, dan mengembalikan `201 { data: { id } }`
- [x] Kiriman keenam dari IP yang sama dalam satu jam mendapat `429 RATE_LIMITED`; tabel `rate_limits` hanya berisi hash
- [x] Error API memakai format `{ error: { code, message } }` dengan kode RU-20
- [x] CORS menolak origin di luar `ALLOWED_ORIGINS`
- [x] Semua rute `/admin/*` menolak permintaan tanpa JWT Access yang valid dengan `401`
- [x] Admin bisa memfilter status, menandai lunas, mengekspor CSV, dan menghapus pesanan
- [x] Cron bulanan menghapus `waitlist` lebih dari 12 bulan dan `rate_limits` lebih dari 2 hari (diuji)
- [x] Nomor WA tidak muncul di log Worker
- [x] `track()` hanya menerima event di `ALLOWED_EVENTS` dan tidak pernah melempar error ke pemanggil
- [x] `preorder_submitted` terkirim dengan `source`
- [x] `_headers` landing mengizinkan Turnstile dan Umami tanpa `unsafe-inline`
- [x] Semua test API dan `landing.spec.ts` lulus; Lighthouse mobile landing Performa ≥ 90 dan Aksesibilitas 100
