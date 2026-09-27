# Takaran

Kalkulator HPP untuk penjual kue dan makanan rumahan: masukkan harga bahan, susun resep, lihat HPP per porsi, harga jual yang disarankan, dan untung per jam.

Next.js + Postgres + Tailwind/shadcn. Dokumen: `PRD.md` (kebutuhan), `TECH.md` (arsitektur), `DESIGN.md` (tampilan), `docs/CHANGE-001-online-nextjs.md` (keputusan terbaru).

## Menjalankan di komputer sendiri

Butuh Node 22 dan pnpm. Tidak perlu Postgres atau Docker: lokal memakai Postgres di dalam proses.

```sh
pnpm install
cp apps/site/.env.example apps/site/.env.local
```

Isi `apps/site/.env.local`:

- `BETTER_AUTH_SECRET` dan `IP_SALT`: teks acak panjang (`openssl rand -base64 32`).
- `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`: lihat `docs/deploy.md` langkah 3. Untuk sekadar mencoba tampilan, isi asal dulu; login Google tidak akan berhasil, tapi uji otomatis tidak membutuhkannya.
- `E2E_TEST_AUTH=1` bila ingin masuk tanpa Google lewat `/api/e2e/login` saat pengembangan.

```sh
pnpm dev          # http://localhost:3000
```

## Perintah

```sh
pnpm lint         # Biome
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest (rumus, aturan bisnis, penyimpanan, pembayaran)
pnpm test:e2e     # Playwright + axe (lebar 320 dan 1280, termasuk preferensi sistem gelap)
pnpm build && pnpm size   # build + cek anggaran ukuran
```

## Deploy

Ke server sendiri (2 core, 4 GiB) dengan Docker Compose, Caddy, dan Postgres: lihat `docs/deploy.md`.
