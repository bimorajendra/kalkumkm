# Audit lanjutan, 2 Oktober 2026

Lanjutan dari `docs/audit-2026-10-02.md`. Branch `audit-2026-10-02-lanjutan`. Tidak mengubah rumus di `packages/calc`, skema DB, dependensi, alur login, atau pembayaran.

## Temuan dan perubahan

| Prioritas | Temuan | Perubahan |
| --- | --- | --- |
| P1 | Kalkulator publik menolak "27.800", "Rp 27.800", "rp1.000", padahal contoh di halaman memakai "Rp 27.800". | `wholeRupiah` untuk kolom uang membuang awalan `Rp`/`Rp.` dan menghapus titik hanya bila polanya `^\d{1,3}(?:\.\d{3})+$`. "27.8" tetap ditolak. Jumlah porsi tetap tanpa titik. |
| P1 | Beranda menampilkan placeholder "[Foto]". | Diganti foto dapur yang diberikan (`public/dapur-kue.png`, `next/image`, teks alternatif deskriptif). Ditambah bagian "Contoh hitungan: modal satu potong brownies" memakai `CostBreakdown` yang sudah ada, dengan tautan "Lihat cara menghitungnya" ke `/cara-hitung`. |
| P2 | Sitemap, robots, dan canonical `/kebijakan-privasi` terkunci ke `APP_URL` saat build. | `export const dynamic = 'force-dynamic'` di ketiganya. |
| P2 | Navigasi dan tautan artikel ke kalkulator belum ada. | "Kalkulator HPP" jadi item pertama nav. Field wajib `calculator` pada `Article`. CTA artikel diganti: judul "Coba hitung dengan angkamu", tautan ke kalkulator, dan "Masuk untuk menyimpan resep". |
| P3 | Metadata artikel kurang lengkap. | `og:url`, `siteName`, fallback gambar `/icon.png`, `twitter:images`, dan `publisher` Organization di JSON-LD. |

## Verifikasi

- `pnpm typecheck`, `pnpm lint`: lulus.
- `pnpm test`: 109 lulus, 20 berkas (contoh brownies PRD tetap).
- `pnpm build` tanpa `APP_URL`, lalu `pnpm size`: semua halaman lulus anggaran. `/robots.txt` dan `/sitemap.xml` bertanda ƒ. `/kebijakan-privasi` bertanda ƒ (di build ini hampir semua rute sudah dinamis karena CSP bernonce).
- Dijalankan dengan `APP_URL=http://localhost:3100` (PostgreSQL 16 sementara di Docker): `sitemap.xml`, `robots.txt`, canonical `/kebijakan-privasi`, `og:url`, `og:image`, `twitter:image`, dan logo JSON-LD artikel memakai `http://localhost:3100`.
- E2E `landing.spec`, `public-growth.spec`, `audit-regressions.spec` di empat proyek (320/1280, terang/gelap): **126 lulus, 2 skip, 4 gagal**. Empat kegagalan adalah tes lama "autosave lama tidak membatalkan perubahan slider" yang memanggil `/api/e2e/login`; rute itu mati di server produksi. Tes ini tidak disentuh dan tidak dijalankan ulang di dev server (lihat di bawah).
- Visual lewat Playwright pada build produksi: tanpa scroll horizontal di 320, 1024, 1280; `data-theme` tetap `light` dan latar tetap terang saat perangkat gelap (320 gelap); nav di 1024 satu baris tanpa tumpang tindih (logo berakhir x=171, nav 286 sampai 738, tombol mulai x=824); urutan Tab di beranda melewati nav lalu tombol sesuai urutan DOM. Rincian brownies diperiksa lewat screenshot 320 dan 1280.

## Tidak dijalankan

- Tes autosave di atas pada dev server: server `next dev` lain sedang berjalan di mesin ini (PID 41384) dan memegang kunci `.next`, jadi tes e2e dijalankan terhadap build produksi. Jalankan `pnpm test:e2e e2e/audit-regressions.spec.ts` setelah dev server itu dihentikan.
- Suite e2e lengkap dan tes analytics dengan GA tidak dijalankan.
- Pemeriksaan keyboard hanya urutan Tab di beranda, bukan semua halaman.
