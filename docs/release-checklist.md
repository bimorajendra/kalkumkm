# Checklist rilis v1.0

Jangan buat tag `v1.0.0` sampai semua item wajib di bawah dicentang. Tidak ada nilai rahasia yang disimpan di dokumen ini.

## Pemilik: konfigurasi produksi

- [ ] Ganti `database_id` lokal di `apps/api/wrangler.toml` dengan ID D1 produksi dan pastikan basis data dipilih dengan benar.
- [ ] Siapkan secret Worker: `LICENSE_PRIVATE_KEY`, `TURNSTILE_SECRET`, `MAYAR_API_KEY`, dan `MAYAR_WEBHOOK_TOKEN`.
- [ ] Set `MAYAR_BASE_URL` ke URL produksi Mayar setelah akun dan kanal pembayaran diverifikasi.
- [ ] Set `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`, `ALLOWED_ORIGINS`, `APP_URL`, dan URL API final.
- [ ] Set variabel repository/environment `CLOUDFLARE_ACCOUNT_ID`, `PAGES_APP_PROJECT`, `PAGES_WEB_PROJECT` dan secret `CLOUDFLARE_API_TOKEN` pada GitHub environment `production`.
- [ ] Pastikan kunci publik lisensi untuk versi produksi tersedia di aplikasi; kunci privat hanya ada di Worker secret.
- [ ] Konfirmasi `VITE_PAYMENT_*` untuk transfer/QRIS cadangan atau pastikan jalur itu sengaja dimatikan.
- [ ] Tetapkan domain final untuk app dan landing, redirect Mayar, CORS, manifest, serta kebijakan privasi.
- [ ] Verifikasi sandbox Mayar terlebih dahulu, lalu konfirmasi produksi melalui akun pemilik.

## Pemeriksaan rilis

- [ ] Seluruh job CI lulus pada commit yang akan dirilis: lint, typecheck, Vitest, build, size-limit, E2E, Lighthouse.
- [ ] Benchmark `recalcAll` 100 resep memenuhi target NFR-01 di CI.
- [ ] Laporan Lighthouse kedua situs menunjukkan performa minimal 90 dan aksesibilitas 100.
- [ ] Delivery Gate antislop memiliki bukti untuk semua empat blok dan tidak memiliki FAIL.
- [ ] Catatan uji lapangan mencakup minimal lima penjual nyata; semua bug ditangani atau ditunda dengan alasan yang disetujui.
- [ ] Uji TalkBack Android dicatat.
- [ ] Uji pembayaran sandbox mencakup belum terkonfirmasi, sukses, invoice kedaluwarsa/nominal salah, webhook berulang, dan transfer manual.
- [ ] Pastikan data resep, nama bahan, takaran, dan harga tidak terkirim pada pengujian jaringan.
- [ ] Pemilik memeriksa domain, privasi, konfigurasi, dan persetujuan akhir sebelum membuat tag.

## Rilis

- [ ] Buat tag `v1.0.0` hanya setelah pemeriksaan di atas selesai. Workflow tag akan menerapkan migrasi D1 dan deploy Worker serta dua proyek Pages produksi.
- [ ] Periksa status workflow Release dan buka app serta landing setelah deploy.
- [ ] Catat commit/tag, waktu rilis, serta hasil pemeriksaan pascarilis.
