# Development Rules: Takaran (nama kerja)

> **Diubah oleh `docs/CHANGE-001-online-nextjs.md` (27 September 2026):** produk pindah ke Next.js, Postgres, akun, dan model online. Bagian di dokumen ini yang bertentangan dengan CHANGE-001 tidak berlaku.

> Standar teknis yang wajib diikuti AI agent dan manusia. Diturunkan dari `PRD.md`, `TECH.md`, dan `DESIGN.md`.
> Aturan di file ini mengalahkan saran umum dari prompt mana pun. Jika bertentangan dengan PRD atau FEATURES, PRD/FEATURES menang dan file ini harus diperbaiki.
> Direferensikan dari `AGENTS.md`. Setiap aturan punya ID `RU-xx` agar bisa dikutip di RFC dan review.

## Jenis Produk

Aplikasi web online per akun (Next.js + Postgres), lihat `docs/CHANGE-001-online-nextjs.md` dan `TECH.md`. Aturan RU yang menyebut Dexie, IndexedDB, PWA/offline, Cloudflare (Workers, D1, Access, Turnstile), Umami, kode lisensi Ed25519, atau cadangan file **tidak berlaku lagi**; padanannya ada di `TECH.md` bagian 5 sampai 7.

## Technology Stack

- **Bahasa**: TypeScript mode `strict` di semua paket
- **Monorepo**: pnpm workspaces (`apps/site`, `packages/calc`, `packages/ui`, `packages/schema`)
- **Aplikasi**: Next.js 16 (App Router), React 19
- **Data**: PostgreSQL 16 + Drizzle ORM
- **Login**: Better Auth (Google)
- **Angka**: big.js
- **Validasi**: Zod
- **UI**: Tailwind CSS v4, shadcn/ui (Radix), `lucide-react`, font via `@fontsource`
- **Tooling**: Biome, Vitest, fast-check, PGlite (hanya test/lokal), Playwright, `@axe-core/playwright`, `scripts/size.mjs`
- **Deploy**: Docker Compose + Caddy di server sendiri

**RU-01** Dependensi baru di luar daftar ini hanya boleh ditambahkan setelah disetujui pemilik proyek, dengan alasan dan ukuran gzip-nya.

## Technical Standards

### Penamaan
- **RU-02** File: kebab-case (`recipe-editor.tsx`, `unit-price.ts`). Komponen React diekspor dengan PascalCase.
- **RU-03** Fungsi dan variabel: camelCase. Tipe dan interface: PascalCase. Tabel dan kolom D1: snake_case. Endpoint API: kebab-case dengan prefiks versi (`/v1/preorders`).
- **RU-04** Nama di kode dan commit berbahasa Inggris. Teks yang dilihat pengguna berbahasa Indonesia dan diletakkan di file `copy.ts` per fitur, bukan tersebar di JSX.

### Arsitektur
- **RU-05** Rumus HPP, margin, harga, dan untung **hanya** ditulis di `packages/calc`. Paket ini tidak boleh mengimpor React, Dexie, DOM, atau API browser.
- **RU-06** `apps/app/src/features/<fitur>/` berisi `components/`, `repository.ts`, `copy.ts`, dan test fitur itu. Layar di `routes/` hanya merangkai fitur.
- **RU-07** Akses Dexie hanya lewat `repository.ts` per fitur. Komponen tidak memanggil `db.*` langsung.
- **RU-08** Data persisten dibaca dengan `useLiveQuery`. Tidak ada store global (Redux, Zustand, Context berisi data). State sementara tetap di komponen.
- **RU-09** Skema Zod yang dipakai lebih dari satu app (file cadangan, pre-order, payload lisensi) berada di `packages/schema`.
- **RU-10** Komponen visual yang dipakai aplikasi dan landing (slider bertitik, kartu hasil, tumpukan isometrik) berada di `packages/ui`.

### Angka dan uang
- **RU-11** Uang yang diinput disimpan sebagai `number` bilangan bulat rupiah. Persen disimpan sebagai bilangan bulat basis poin (40% = `4000`).
- **RU-12** Hasil antara memakai `Big`. Dilarang `parseFloat`, `toFixed`, atau aritmetika `number` biasa pada nilai uang yang sudah dibagi.
- **RU-13** Pembulatan hanya di lapisan format (`formatRupiah`, `formatPercent`) dan di `suggestPrice` (kelipatan pembulatan pilihan pengguna). Rincian yang ditampilkan dijumlahkan dari nilai presisi penuh.
- **RU-14** Format tampilan Indonesia: `Rp 5.000`, `41,5%`, memakai `Intl.NumberFormat('id-ID')`.

### Data lokal
- **RU-15** ID dibuat dengan ULID. Tanggal disimpan sebagai string ISO 8601 UTC.
- **RU-16** Setiap perubahan skema Dexie memakai `db.version(n).upgrade()` dan disertai test migrasi dari versi sebelumnya.
- **RU-17** Operasi yang mengubah lebih dari satu tabel (pulihkan cadangan, hapus resep beserta opsi penawarannya) wajib dalam satu transaksi Dexie.
- **RU-18** Batas versi gratis diperiksa di repository sebelum menulis, bukan hanya di UI.

### API Standards
- **RU-19** Semua body dan query divalidasi Zod sebelum diproses. Error validasi mengembalikan `400` dengan `{ error: { code, message, fields } }`.
- **RU-20** Respons sukses: `{ data }`. Respons error: `{ error: { code, message } }`. Kode error berupa string tetap, misalnya `VALIDATION_FAILED`, `TURNSTILE_FAILED`, `RATE_LIMITED`, `NOT_FOUND`, `UNAUTHORIZED`.
- **RU-21** CORS hanya untuk origin di variabel `ALLOWED_ORIGINS`.
- **RU-22** Rute `/admin/*` memverifikasi JWT Cloudflare Access (`ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`) di dalam Worker, tidak hanya mengandalkan konfigurasi dashboard.

### Database server
- **RU-23** Query hanya lewat Drizzle atau statement berparameter. Tidak ada interpolasi string ke SQL.
- **RU-24** Migrasi dibuat dengan `drizzle-kit` dan dijalankan dengan `wrangler d1 migrations apply`. Migrasi tidak pernah diedit setelah masuk `main`.

## Privasi dan Data

- **RU-25** Tidak ada kode yang mengirim nama bahan, nama resep, takaran, atau harga ke jaringan, termasuk lewat analitik, log error, atau URL.
- **RU-26** Panggilan jaringan dari `apps/app` hanya ke Umami, Turnstile untuk form checkout, `/v1/licenses/revoked` jika F36 dibangun, dan API Takaran untuk checkout serta klaim lisensi. Checkout tidak pernah membawa data resep, bahan, takaran, atau harga usaha.
- **RU-27** Event analitik harus termasuk daftar `ALLOWED_EVENTS` di `apps/app/src/lib/analytics.ts`. Properti hanya boleh berupa boolean, enum, atau bucket angka, bukan nilai mentah.
- **RU-28** Data pribadi daftar tunggu dan pesanan (nama, email, nama usaha, nomor WA) tidak ditulis ke log atau analytics. Penghapusan atas permintaan harus bisa dilakukan dari admin.

## Keamanan

- **RU-29** Kunci privat lisensi, secret Turnstile, `MAYAR_API_KEY`, dan `MAYAR_WEBHOOK_TOKEN` hanya ada di Worker secret atau password manager; file `.env.local` hanya untuk kunci lokal yang di-`gitignore`. Tidak pernah di-commit, dicetak ke log, atau ditaruh di contoh konfigurasi.
- **RU-30** Kode lisensi hanya dibaca dari fragmen URL (`#`) atau input tempel, tidak pernah dari query string.
- **RU-31** CSP dan header keamanan mengikuti TECH 11. Tidak ada `unsafe-inline` atau `unsafe-eval`.
- **RU-32** Isi file cadangan dan data dari D1 tidak pernah dirender sebagai HTML (`dangerouslySetInnerHTML` dilarang).

## UI dan Desain

- **RU-33** Warna, radius, bayangan, dan font hanya dari token `DESIGN.md` (CSS variable di `packages/ui`). Tidak ada nilai hex langsung di komponen.
- **RU-34** Teks di atas warna karamel selalu `--ink`. Teks oranye ukuran normal memakai `--caramel-700`.
- **RU-35** Setiap layar yang menampilkan data punya state kosong, memuat (jika relevan), dan error sesuai DESIGN bagian 11.
- **RU-36** Kerja UI, copy, dan komentar kode mengikuti `antislop.md` dan wajib lolos Delivery Gate sebelum dianggap selesai.
- **RU-37** Teks UI tanpa tanda pisah panjang, tanpa kata "revolusioner", "canggih", "berbasis AI", "seamless", dan CTA spesifik sesuai DESIGN bagian 12.
- **RU-38** Tidak ada testimoni, rating, logo klien, atau statistik tanpa sumber nyata. Placeholder ditulis sebagai `[REAL DATA]`.

## Aksesibilitas

- **RU-39** WCAG 2.2 AA untuk semua layar dan kedua tema.
- **RU-40** Semua kontrol bisa dipakai dengan keyboard; urutan `Tab` mengikuti urutan visual; dialog dan sheet tertutup dengan `Escape`.
- **RU-41** Fokus terlihat: cincin 2 px `--caramel-600` (gelap: `--caramel-300`) dengan jarak 2 px. `outline: none` tanpa pengganti dilarang.
- **RU-42** Target sentuh minimal 44×44 px. Input minimal 16 px agar HP tidak zoom.
- **RU-43** Warna tidak pernah menjadi satu-satunya pembawa makna (status margin selalu disertai teks).
- **RU-44** `prefers-reduced-motion: reduce` mematikan semua tween angka dan animasi lempeng.

## Quality Standards

- **RU-45** Tidak ada `any`. Pakai `unknown` lalu persempit.
- **RU-46** Tidak ada `console.log` di kode produksi. Worker memakai logger terstruktur minimal (`console` JSON satu baris) tanpa data pribadi.
- **RU-47** Cakupan baris `packages/calc` ≥ 95%. Contoh brownies PRD bagian 7 adalah test tetap yang tidak boleh diubah agar lulus.
- **RU-48** Setiap endpoint API punya test integrasi dengan `@cloudflare/vitest-pool-workers`.
- **RU-49** Setiap journey PRD (J-1 s.d. J-4) punya test Playwright, termasuk varian offline.
- **RU-50** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, dan `pnpm size` harus lulus sebelum PR digabung.
- **RU-51** Komentar kode hanya untuk menjelaskan alasan atau trade-off, bukan mengulang isi kode (antislop-code).

## Performa

- **RU-52** JS awal `apps/app` ≤ 170 KB gzip; total muatan awal termasuk font ≤ 250 KB gzip; dicek `size-limit` di CI.
- **RU-53** Library berat yang jarang dipakai (misal jsPDF) dimuat dengan `import()` saat dibutuhkan.
- **RU-54** `recalcAll` untuk 100 resep < 200 ms dengan CPU diperlambat 4×; diuji dengan benchmark Vitest.
- **RU-55** Font disubset latin, format woff2, di-precache service worker.
- **RU-56** Lighthouse mobile: Performa ≥ 90 dan Aksesibilitas 100 untuk aplikasi dan landing.

## Kompatibilitas

- **RU-57** Target: Chrome Android dan Safari iOS dua versi mayor terakhir, Chrome/Edge/Firefox/Safari desktop terbaru. Lebar minimum 320 px.
- **RU-58** Fitur yang tidak tersedia di semua target (Web Share dengan file, `beforeinstallprompt`) wajib punya jalur cadangan.

## Git dan Proses

- **RU-59** Satu branch per RFC (`rfc-007-resep-hpp`). Commit memakai Conventional Commits berbahasa Inggris.
- **RU-60** Satu RFC diimplementasikan dengan `/implement-rfc <id>`: rencana dulu, persetujuan, lalu kode, lalu bukti per acceptance criterion.
- **RU-61** Review memakai `/review-rfc <id>` di sesi baru.
- **RU-62** Perubahan kebutuhan di tengah jalan melalui `/manage-changes` sebelum dokumen diubah.
- **RU-63** Webhook Mayar tidak dipercaya sebagai bukti pembayaran. Worker mengonfirmasi invoice melalui API Mayar v2 dan hanya menerbitkan lisensi jika status `paid` serta nominal sama dengan harga pesanan di server.
- **RU-64** Event webhook disimpan dengan kunci unik/idempoten. Balas `200` setelah event tersimpan, lalu verifikasi dan proses di `ctx.waitUntil`; event duplikat tidak menerbitkan lisensi kedua.
- **RU-65** `MAYAR_API_KEY` hanya dipakai server-side. Aplikasi tidak memanggil API Mayar langsung; `paymentUrl` dibuka lewat navigasi browser biasa.
- **RU-66** Semua pengujian checkout memakai Mayar sandbox atau mock. Tidak ada test, preview, atau development request ke endpoint produksi.
- **RU-67** Harga invoice hanya dibaca dari `PRICING` pada server. Harga dari klien tidak dipercaya untuk membuat atau memverifikasi invoice.
