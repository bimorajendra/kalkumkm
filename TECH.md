# TECH.md: Takaran (nama kerja)

> Arsitektur teknis setelah `docs/CHANGE-001-online-nextjs.md` (27 September 2026).
> Urutan otoritas: `PRD.md` > `docs/CHANGE-001-online-nextjs.md` > `TECH.md` > `DESIGN.md` (untuk tampilan, `DESIGN.md` menang).
> Versi sebelumnya (Cloudflare, Dexie, lisensi offline) sudah dihapus dari dokumen ini; riwayatnya ada di git.

## 1. Prinsip

1. **Online dan per akun.** Bahan, resep, dan pengaturan disimpan di Postgres dan hanya bisa dibaca pemilik akun.
2. **Satu aplikasi.** Landing, kalkulator, API, dan admin ada dalam satu proyek Next.js.
3. **Rumus di satu tempat.** `packages/calc` dipakai klien (hasil instan) dan test. UI tidak menghitung sendiri.
4. **Server yang memutuskan.** Batas paket gratis, kepemilikan data, dan status Pro dicek di server, bukan di layar.
5. **Sesedikit mungkin layanan luar.** Google (login) dan Mayar (bayar). Tidak ada analitik pihak ketiga.

## 2. Arsitektur

```
Peramban -> Caddy (HTTPS) -> Next.js (Docker) -> Postgres (jaringan internal)
                                 |
                                 +-> Google (login OAuth)
                                 +-> Mayar API v2 (invoice) <- webhook payment.received
```

Tiga proses di satu server (Docker Compose): `caddy`, `app`, `db`, ditambah `backup` (cadangan harian).

## 3. Stack

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| UI | Tailwind CSS v4, shadcn/ui (Radix), lucide-react. Token warna dan tipografi dari `DESIGN.md` di `packages/ui/src/tokens.css` |
| Komponen khas | `packages/ui`: kartu hasil, slider bertitik, tumpukan isometrik |
| Database | PostgreSQL 16, Drizzle ORM, migrasi SQL di `apps/site/drizzle` (dijalankan saat server menyala lewat `instrumentation.ts`) |
| Login | Better Auth, Google saja, sesi cookie `HttpOnly` |
| Validasi | Zod di batas kepercayaan (perintah, webhook, form) |
| Angka | big.js di `packages/calc`; rupiah bulat, persen dalam basis poin |
| Test | Vitest (Postgres di dalam proses lewat PGlite), Playwright + axe |
| Kualitas | Biome, `tsc --noEmit`, `scripts/size.mjs` |

## 4. Struktur repo

```
apps/site
  src/app          halaman dan rute (landing, (app)/*, masuk, admin, api/*)
  src/domain       aturan bisnis murni: validasi, batas gratis, perintah (tanpa I/O)
  src/server       DB, autentikasi, penyimpanan per akun, pembayaran Mayar
  src/features     komponen layar (bahan, resep, harga, saluran, penawaran, bagikan)
  src/components   ui/ (shadcn), takaran/ (shell, field, data provider), landing/
  drizzle          migrasi SQL
packages/calc      semua rumus HPP (tidak boleh mengimpor React atau DOM)
packages/ui        token, kartu hasil, slider, isometrik, format rupiah
packages/schema    harga dan batas paket (PRICING, FREE_LIMITS)
deploy/            Caddyfile, backup.sh, env.example
e2e/               Playwright
```

## 5. Data dan alur perubahan

Setiap entitas (bahan, resep, saluran, opsi penawaran) satu baris `(user_id, id, data jsonb)`. Kunci utama selalu `(user_id, id)`, jadi tidak ada cara mengakses baris akun lain. `price_history`, `user_settings`, `entitlements`, `orders`, `mayar_events`, `waitlist`, `rate_limits` adalah tabel biasa.

Semua perubahan lewat **satu server action `dispatch(command)`**:

1. Sesi dibaca di server (`getSessionUser`). Identitas tidak pernah datang dari isi permintaan.
2. Perintah divalidasi Zod (`domain/commands.ts`), dibatasi 120 perintah per menit per akun.
3. Dalam satu transaksi dengan `pg_advisory_xact_lock` per akun: muat data akun, terapkan aturan (`domain/*`), simpan perubahan, muat ulang.
4. Hasilnya (data terbaru akun) menggantikan isi di klien (`DataProvider`).

Klien menghitung HPP dengan `recalcAll` dari data yang sama, jadi slider terasa instan; server menyimpan input, bukan hasil hitungan.

## 6. Pembayaran dan Pro

Pro adalah satu baris `entitlements` per akun. Hanya dua jalur yang menulisnya: webhook/cek Mayar yang terverifikasi, dan admin.

1. Server action `startCheckout` membuat pesanan `pending` dengan **harga dari server** (`PRICING`, harga pendiri untuk 100 pembeli pertama), lalu invoice Mayar v2 dengan `extraData.orderId`.
2. Pembeli membayar di Mayar. Redirect browser tidak dianggap bukti bayar.
3. Webhook `POST /api/webhooks/mayar?token=...` (token dibandingkan constant-time) mencatat event secara idempoten, lalu **mengonfirmasi invoice ke API Mayar**. Pro dibuka hanya bila status `paid`, nominal sama dengan pesanan, id invoice cocok, dan email pelanggan sama dengan email akun.
4. Bila konfirmasi gagal, webhook membalas 503 agar Mayar mengirim ulang. Halaman `/beli` juga mengecek ulang (paling sering sekali per 30 detik per pesanan) sebagai cadangan.
5. Admin bisa mengecek ulang, menandai refund (mencabut Pro), dan memberi Pro manual untuk pembayaran di luar Mayar.

## 7. Keamanan

- **Autentikasi:** library (Better Auth), Google saja, tanpa password. Cookie `HttpOnly`, `SameSite=Lax`, `Secure` di HTTPS. Batas 30 permintaan per menit pada rute auth.
- **Otorisasi:** setiap kueri data pengguna difilter `user_id` dari sesi. Test `store.test.ts` dan `e2e/isolation.spec.ts` membuktikan akun A tidak bisa membaca atau mengubah data akun B. Halaman dan aksi admin memeriksa admin sendiri (`ADMIN_EMAILS`); non-admin mendapat 404.
- **Input:** Zod di server untuk perintah, checkout, waitlist, dan webhook. Batas ukuran body dan 1.000 baris per koleksi per akun.
- **Header:** CSP dengan nonce per permintaan (`src/proxy.ts`), HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`.
- **Rahasia:** hanya di `.env` server. `getEnv()` menolak menyala bila konfigurasi kurang. Log tidak memuat nama bahan, resep, atau harga.
- **Anti-spam:** batas percobaan per IP (di database) untuk waitlist dan per akun untuk checkout; kolom jebakan bot di form waitlist.
- **Data pribadi:** unduh data (`/api/me/export`) dan hapus akun (cascade) dari Pengaturan.
- **Server:** Postgres tidak dibuka ke internet; hanya Caddy yang punya port publik. Lihat `docs/deploy.md` untuk SSH, firewall, dan cadangan.
- **Rute uji:** `/api/e2e/login` hanya ada bila `E2E_TEST_AUTH=1` dan `NODE_ENV != production`; di produksi membalas 404.

## 8. Anggaran performa

`scripts/size.mjs` (dijalankan `pnpm size` setelah `pnpm build`) menghitung JS awal dan total muatan awal per halaman. Batas: JS ≤ 220 KB gzip, total ≤ 300 KB. Angka ini menggantikan 170 KB/250 KB era Vite karena runtime Next.js dan React sudah sekitar 135 KB gzip sendiri; keputusannya dicatat di CHANGE-001. Polyfill `nomodule` tidak dihitung.

## 9. Testing

| Lapisan | Alat | Cakupan |
|---|---|---|
| `packages/calc` | Vitest + fast-check | Semua rumus, contoh brownies PRD bagian 7 sebagai test tetap |
| Domain dan penyimpanan | Vitest + PGlite (Postgres sungguhan di dalam proses) | Isolasi antar akun, batas gratis, dua permintaan bersamaan, sub-resep, alarm margin |
| Pembayaran | Vitest + Mayar palsu | Belum bayar, sukses, kedaluwarsa, nominal/email salah, webhook ganda, gagal lalu ulang, refund |
| Skema auth | Vitest | Skema Drizzle mencakup semua field yang dibutuhkan Better Auth |
| UI dan alur | Playwright + axe, lebar 320 dan 1280, tema terang dan gelap | J-1 sampai J-4, isolasi, admin, batas gratis, hapus akun, tanpa scroll horizontal |

`E2E_DATABASE_URL=postgres://...` menjalankan E2E terhadap Postgres sungguhan (bawaannya PGlite).

## 10. Lingkungan dan konfigurasi

Lihat `deploy/env.example` untuk semua variabel. Lokal tanpa Postgres: `DATABASE_URL=pglite:./.data/dev` (ditolak di produksi). Deploy ke server sendiri: `docs/deploy.md`.

## 11. Keputusan dan alternatif yang ditolak

| Keputusan | Alasan |
|---|---|
| Satu proyek Next.js, bukan Astro + Vite + Hono | Satu bahasa, satu deploy, satu tempat untuk auth dan API |
| Entitas sebagai JSONB per baris | Bentuk domain bertingkat (item resep, satuan khusus); validasi ada di `domain/`, migrasi skema jarang |
| Kirim seluruh data akun tiap perubahan | Data per akun kecil (ratusan baris); menghindari sinkronisasi parsial dan cache yang basi |
| Login Google saja | Tanpa password dan tanpa layanan email; hampir semua pengguna Android punya akun Google |
| Rate limit di tabel Postgres | Tetap benar setelah restart; tanpa Redis |
| Tanpa Umami/analitik | Layanan luar tambahan; metrik aktivasi bisa dihitung dari database |
| Tanpa PWA offline | Model online per akun; kalkulasi tetap instan di klien |
