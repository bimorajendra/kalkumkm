# Delivery Gate v1.0: aplikasi dan landing

Status: **BELUM LENGKAP**. Landing sudah ditinjau lewat tangkapan layar 320 dan 1280 px pada tema terang dan gelap sebelum tema dikunci terang. E2E mencatat 189/288 lulus dan 99 gagal. Pemeriksaan keyboard, axe terpisah, dan klik-through lengkap belum direkam. Tidak ada blok Delivery Gate yang dianggap lulus tanpa bukti lengkap.

Catat temuan dengan format `PASS/FAIL — bukti (halaman/state, viewport, tema, langkah atau hasil alat)`. Baris `FAIL` menahan rilis. Jalankan seluruh aturan di `antislop.md`, bukan hanya contoh di tabel ini.

| Blok | Cakupan wajib | Status | Bukti |
|---|---|---|---|
| 1. Hard Gate | R-02, R-03, R-17, R-18, R-23, R-24, R-25, R-26, R-27, R-28, R-32, R-33, R-34, R-35, R-36, R-37, R-38 | BELUM LENGKAP | Tangkapan layar landing: 320 dan 1280 px, tema terang dan gelap. `pnpm test:e2e`: 189/288 lulus, 99 gagal. Belum ada catatan keyboard, axe seluruh layar, atau klik-through lengkap. |
| 2. Purpose-Gate | R-01, R-04, R-06 s.d. R-10, R-12 s.d. R-14, R-19, R-22 | BELUM DIJALANKAN | Tulis satu alasan fungsi untuk setiap teknik visual yang ditemukan; catat halaman dan komponen. |
| 3. Liveliness | Dials ENERGY/RHYTHM/MOTION, focal point, ruang, aksen, motif, Design Read | BELUM DIJALANKAN | Rujuk `DESIGN.md` dan dokumentasikan bukti untuk app dan landing. |
| 4. Craftsmanship & Quality Locks | C-1 s.d. C-5, R-05, R-11, R-15, R-16, R-20, R-21, R-29, R-30, R-31 | BELUM DIJALANKAN | Catat hasil pemeriksaan tiap kunci untuk app dan landing. |

## Bukti otomatis yang perlu dilampirkan

- Playwright E2E pada 320, 390, 768, dan 1280 px dengan preferensi sistem terang dan gelap: BELUM DIJALANKAN (4 viewport × 2 preferensi sistem).
- Hasil axe dan pemeriksaan overflow lengkap: BELUM DIREKAM.
- Isolasi akun: suite E2E penuh sudah dijalankan, hasil per skenario perlu ditinjau untuk mengelompokkan kegagalan.
- Lighthouse mobile untuk app dan landing: LULUS. Tiga run app: performa 0.96, aksesibilitas 1.00; tiga run landing: performa 0.99, aksesibilitas 1.00. Laporan lokal ada di `.lighthouseci/`; CI mengunggah artifact.
- Size-limit: LULUS. JS awal 168.88 KB gzip / 170 KB; payload awal 246.82 KB gzip / 250 KB.
- Benchmark: LULUS. `test:calc:bench` menerapkan batas setara 4× CPU lambat < 200 ms.
- Vitest: LULUS, 96 test.
- Checkout/API unit tests cover pembayaran sukses, nominal tidak cocok, invoice kedaluwarsa, webhook duplikat/idempoten, dan pembayaran manual QRIS; belum membuktikan alur E2E Mayar sandbox pada browser.
- Typecheck, lint, build: LULUS. Biome masih menampilkan 17 peringatan yang sudah ada.
- Catatan uji keyboard dan TalkBack Android.
- Sesi klik-through yang mencakup setiap kontrol interaktif di app dan landing.

## Rangkuman

- Hasil: BELUM LENGKAP; belum boleh dipakai sebagai persetujuan rilis.
- Tautan artifact CI:
- Pemeriksa dan tanggal:
- FAIL yang menghalangi rilis: 99 tes E2E gagal; penyebab belum dikelompokkan. Pemeriksaan keyboard, klik-through, dan uji lapangan juga belum selesai.
- Perbaikan/pengecualian: tidak ada pengecualian untuk FAIL menurut Delivery Gate.
