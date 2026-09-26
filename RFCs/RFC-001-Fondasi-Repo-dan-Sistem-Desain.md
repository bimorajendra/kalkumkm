# RFC-001: Fondasi Repo dan Sistem Desain

## Ringkasan
Menyiapkan monorepo, tooling, CI, kerangka kosong untuk ketiga app, dan token desain beserta tema terang/gelap. Semua RFC lain dibangun di atas ini.

**Kompleksitas**: Medium
**Fitur**: F4 (Token desain dan tema terang/gelap)
**Dibangun di atas**: Tidak ada (RFC pertama)
**Dibutuhkan oleh**: RFC-002, RFC-003, RFC-005, dan secara tidak langsung semua RFC

## Pendekatan Teknis

### Struktur
```
package.json                 # script root
pnpm-workspace.yaml
tsconfig.base.json           # strict, noUncheckedIndexedAccess
biome.json
.gitignore                   # termasuk .env.local, .dev.vars
.size-limit.json
playwright.config.ts
.github/workflows/ci.yml
apps/app/                    # Vite + React + React Router, satu route "/" sementara
apps/app/public/_headers     # CSP dan header keamanan (TECH 11)
apps/web/                    # Astro, satu halaman kosong
apps/web/public/_headers
apps/api/                    # Hono Worker, GET /v1/health
apps/api/wrangler.toml
packages/calc/               # index.ts kosong + konfigurasi Vitest
packages/ui/src/tokens.css
packages/ui/src/fonts.css
packages/ui/src/theme.ts
packages/ui/src/theme-toggle.tsx
packages/schema/             # index.ts kosong
e2e/smoke.spec.ts
```

### Script root
`dev`, `dev:app`, `test`, `test:e2e`, `typecheck`, `lint`, `build`, `size`, sesuai AGENTS.md.

### Token desain
- `tokens.css` mendefinisikan semua token DESIGN 4.1 di `:root` dan DESIGN 4.2 di `[data-theme="dark"]` serta `@media (prefers-color-scheme: dark)` untuk `:root:not([data-theme="light"])`.
- Tailwind v4 memetakan token lewat `@theme` sehingga kelas seperti `bg-surface`, `text-ink`, `text-caramel-700` tersedia.
- Skala tipografi DESIGN 5 dan radius/elevasi DESIGN 6 juga menjadi token.
- `fonts.css` memuat Instrument Serif dan Plus Jakarta Sans dari `@fontsource`, subset latin, woff2.

### Tema
- `theme.ts`: `getTheme()`, `setTheme('light' | 'dark' | 'system')`. Pilihan disimpan di `localStorage` kunci `takaran-theme`, dibungkus try/catch; jika penyimpanan gagal, tema mengikuti sistem.
- `theme-init.js` eksternal same-origin dijalankan dari `index.html` sebelum render untuk mencegah kedipan; CSP mengizinkan `script-src 'self'` tanpa `unsafe-inline`.
- `ThemeToggle`: tombol dengan `aria-label` "Ganti tema", siklus sistem, terang, gelap, dengan label teks status.

### CI
Job pada setiap PR: install beku, `lint`, `typecheck`, `test`, `build`, `size`, `test:e2e`. Job gagal jika salah satu gagal.

### Playwright
Proyek untuk lebar 320, 390, 768, 1280 px dan `colorScheme` terang serta gelap. `smoke.spec.ts` membuka app dan landing, menjalankan axe, dan memastikan tidak ada error konsol.

## Edge Case
- Browser tanpa `localStorage` (mode privat tertentu): tema tetap berjalan dari sistem.
- Pengguna mengganti tema sistem saat app terbuka dengan pilihan "sistem": tema ikut berubah lewat listener `matchMedia`.

## Aturan Terkait
RU-01 s.d. RU-04, RU-31, RU-33, RU-39, RU-41, RU-45, RU-50, RU-52, RU-55, RU-59.

## Testing
- Vitest berjalan di semua paket (boleh tanpa test selain satu test contoh di `theme.ts`).
- Playwright smoke + axe di kedua tema dan empat lebar.

## Acceptance Criteria
- [x] `pnpm install` lalu `pnpm dev` menjalankan `apps/app`, `apps/web`, dan `apps/api` secara lokal
- [x] Script root `dev`, `dev:app`, `test`, `test:e2e`, `typecheck`, `lint`, `build`, `size` ada dan berjalan
- [x] `tsconfig.base.json` memakai `strict: true` dan dipakai semua paket
- [x] `.gitignore` mengabaikan `.env.local` dan `.dev.vars`
- [x] `GET /v1/health` di `apps/api` mengembalikan `{ "data": { "ok": true } }`
- [x] `tokens.css` berisi semua token DESIGN 4.1 dan 4.2, dan tidak ada nilai hex di komponen mana pun
- [x] Font dimuat dari `@fontsource` (tidak ada permintaan ke Google Fonts) dalam format woff2
- [x] `ThemeToggle` berganti sistem, terang, gelap; pilihan bertahan setelah muat ulang; tanpa kedipan tema saat muat
- [x] Tema tetap berfungsi saat `localStorage` melempar error
- [x] `_headers` di `apps/app` dan `apps/web` memasang CSP dan header keamanan TECH 11 tanpa `unsafe-inline` atau `unsafe-eval`
- [x] `.size-limit.json` memuat batas JS awal app 170 KB dan total 250 KB (gzip)
- [x] Workflow CI menjalankan semua cek dan gagal jika salah satu gagal
- [x] `e2e/smoke.spec.ts` lulus di 4 lebar x 2 tema dengan nol pelanggaran axe serius dan nol error konsol
