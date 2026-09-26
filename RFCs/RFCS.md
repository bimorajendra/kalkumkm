# RFCS: Takaran (nama kerja)

> Daftar induk RFC v1.0, diturunkan dari `PRD.md`, `FEATURES.md`, `RULES.md`, `TECH.md`, dan `DESIGN.md` (25 September 2026).
> Urutan otoritas: `PRD.md` > `FEATURES.md` > `RULES.md` > RFC > rencana yang dihasilkan.

## Klasifikasi dan Pendekatan

**Jenis produk:** PWA offline-first dengan API Cloudflare terbatas untuk daftar tunggu, pembayaran Mayar, dan lisensi.

**Cek yang dipakai:** aksesibilitas, responsif, offline, privasi data, keamanan API, validasi input, performa muatan, dan migrasi skema lokal/server.

**Cek yang sengaja dilewati:** akun aplikasi, state management global, skalabilitas beban tinggi, multi-bahasa. Data resep dan harga tetap di perangkat.

**Cara memecah:** fondasi dan mesin hitung (001-003), validasi pasar dengan landing serta daftar tunggu gratis (004), aplikasi lokal sampai lisensi dan pembayaran (005-012), fitur Should (013-016), lalu pengerasan dan rilis (017). Fitur Could (F33-F36) belum dijadwalkan.

## Cara Mengimplementasikan

Setiap RFC dikerjakan dengan `/implement-rfc <id>`: rencana dulu, persetujuan, lalu kode dan bukti per acceptance criterion. Review dengan `/review-rfc <id>` di sesi baru. Tidak ada file prompt per RFC.

## Daftar RFC

| RFC | Judul | Fitur | Kompleksitas | Pendahulu | Penerus |
|---|---|---|---|---|---|
| [001](RFC-001-Fondasi-Repo-dan-Sistem-Desain.md) | Fondasi repo dan sistem desain | F4 | Medium | Tidak ada | 002, 003, 005 |
| [002](RFC-002-Mesin-Hitung-HPP.md) | Mesin hitung HPP | F1 | High | 001 | 003, 004, 006, 007 |
| [003](RFC-003-Komponen-UI-Bersama.md) | Komponen UI bersama | Komponen F9-F13, F19 | Medium | 001, 002 | 004, 007, 008, 009 |
| [004](RFC-004-Landing-Preorder-dan-Admin.md) | Landing, daftar tunggu, admin, analitik | F19, F20, F21, F23, F32 | Medium | 002, 003 | 011, 012, 016, 017 |
| [005](RFC-005-Data-Lokal-dan-Kerangka-PWA.md) | Data lokal dan kerangka PWA | F2, F3 | Medium | 001 | 006, 010, 011, 017 |
| [006](RFC-006-Bahan.md) | Bahan | F5, F6 | Medium | 002, 005 | 007, 009, 013, 017 |
| [007](RFC-007-Resep-dan-HPP.md) | Resep dan HPP | F7, F8, F9 | Medium | 002, 003, 006 | 008, 011, 013, 017 |
| [008](RFC-008-Kalkulator-Harga-dan-Untung.md) | Kalkulator harga dan untung | F10, F12, F13, F14 | Medium | 003, 007 | 009, 014, 015, 016, 017 |
| [009](RFC-009-Alarm-Margin.md) | Alarm margin | F11 | Medium | 003, 006, 008 | 013, 017 |
| [010](RFC-010-Cadangan-dan-Pulihkan.md) | Cadangan dan pulihkan | F15 | Medium | 005 | 011, 017 |
| [011](RFC-011-Monetisasi-dan-Lisensi.md) | Monetisasi dan lisensi | F16, F17, F18, F22 | Medium | 004, 005, 007, 010 | 012, 013, 014, 015, 016, 017 |
| [012](RFC-012-Pembayaran-Mayar.md) | Pembayaran Mayar | F41 | High | 004, 011 | 017 |
| [013](RFC-013-Resep-Lanjutan.md) | Resep lanjutan | F24, F25, F26 | High | 006, 007, 009, 011 | 017 |
| [014](RFC-014-Saluran-Jual.md) | Saluran jual | F27 | Medium | 008, 011 | 017 |
| [015](RFC-015-Penawaran-Custom.md) | Penawaran pesanan custom | F28, F29 | Medium | 008, 011 | 016, 017 |
| [016](RFC-016-Gambar-Daftar-Harga.md) | Gambar daftar harga | F30, F31 | Medium | 004, 008, 011, 015 | 017 |
| [017](RFC-017-Pengerasan-dan-Rilis.md) | Pengerasan dan rilis v1.0 | Verifikasi NFR dan J-1 s.d. J-4 | Medium | 004 s.d. 016 | Tidak ada |

Kolom Penerus dihitung dari kolom Pendahulu. Setiap baris cocok dengan metadata dependensi di file RFC masing-masing.

## Graf Dependensi

```text
001 -> 002, 003, 005
002 -> 003, 004, 006, 007
003 -> 004, 007, 008, 009
004 -> 011, 012, 016, 017
005 -> 006, 010, 011, 017
006 -> 007, 009, 013, 017
007 -> 008, 011, 013, 017
008 -> 009, 014, 015, 016, 017
009 -> 013, 017
010 -> 011, 017
011 -> 012, 013, 014, 015, 016, 017
012 -> 017
013 -> 017
014 -> 017
015 -> 016, 017
016 -> 017
```

**Jalur kritis:** 001, 002, 003, 004, 011, 012, 017. RFC-004 tetap mengirim daftar tunggu gratis selama validasi; checkout dibuka pada rilis aplikasi.

## Peta Jalan

| Minggu (PRD bagian 14) | RFC | Hasil |
|---|---|---|
| 0-1 | 001, 002, 003, 004 | Landing, demo hitung, dan daftar tunggu gratis untuk validasi |
| 2 | 005, 006, 007 | Data lokal, bahan, resep, dan HPP offline |
| 3 | 008, 009 | Kalkulator harga dan alarm margin |
| 4 | 010, 011, 012 | Cadangan, lisensi, checkout Mayar sandbox, serta pembayaran manual cadangan |
| 5 | 013, 014, 015, 016 | Fitur Should |
| 6 | 017 | Uji, verifikasi akun/kanal Mayar, pengerasan, dan rilis |

## Cakupan Fitur Must dan Should

| Fitur | RFC |
|---|---|
| F1 | 002 |
| F2, F3 | 005 |
| F4 | 001 |
| F5, F6 | 006 |
| F7, F8, F9 | 007 |
| F10, F12, F13, F14 | 008 |
| F11 | 009 |
| F15 | 010 |
| F16, F17, F18, F22 | 011 |
| F19, F20, F21, F23, F32 | 004 |
| F24, F25, F26 | 013 |
| F27 | 014 |
| F28, F29 | 015 |
| F30, F31 | 016 |
| F41 | 012 |
| F33-F36 (Could) | Belum dijadwalkan |
| F37-F40, F42 (Won't) | Di luar v1 |

## Pemeriksaan Mandiri

Dijalankan setelah semua RFC diperbarui:

1. **Cakupan:** 33 fitur Must dan Should (F1-F32 dan F41) masing-masing muncul di tepat satu RFC.
2. **Pendahulu dan penerus:** metadata tiap RFC cocok dengan tabel serta graf di atas.
3. **Urutan topologis:** setiap pendahulu bernomor lebih kecil dari RFC yang memakainya.
4. **Acceptance criteria:** setiap RFC memiliki kriteria berkas dan perilaku yang bisa diverifikasi.
5. **Kepemilikan file bersama:** `packages/schema/src/pricing.ts` dibuat di RFC-004 dan diperluas di RFC-011; RFC-012 hanya membaca `PRICING`.
6. **Konflik dokumen:** seluruh keputusan 1-8 di bawah sudah dicerminkan pada dokumen sumber terkait.
7. **Pembayaran:** tidak ada lagi keputusan yang menempatkan pembayaran otomatis sebagai di luar scope atau v2.

### Pertentangan yang diselesaikan

| # | Pertentangan | Keputusan | Status |
|---|---|---|---|
| 1 | PRD memakai `laborHoursPerBatch`, RFC-002 memakai `laborMinutesPerBatch` | PRD memakai menit bilangan bulat | Selesai |
| 2 | TECH 7.4 belum memasukkan `priceHistory` | `priceHistory` masuk file cadangan | Selesai |
| 3 | Status `activated` mengesankan aktivasi yang tak diketahui server | Ganti status menjadi `licensed` untuk kode terbit | Selesai |
| 4 | Landing dan pre-order ada di timeline, belum menjadi FR | Tambahkan FR-30 dan FR-31; F19 dan F20 tetap | Selesai |
| 5 | Timeline landing mendahului mesin hitung yang dibutuhkan demo | Mesin hitung dan demo selesai pada akhir minggu 1 | Selesai |
| 6 | Rumus diskon kanal dan total penawaran belum ada di PRD | Tambahkan CR-11 dan CR-12 sesuai RFC-002 | Selesai |
| 7 | Endpoint cabut lisensi sudah disebut tetapi F36 belum dijadwalkan | Tandai sebagai F36 Could, belum dijadwalkan | Selesai |
| 8 | `fake-indexeddb` belum ada di daftar stack RULES | Sudah dicantumkan di RULES | Selesai |

## Cold-read Sebelum Implementasi

Sebelum menulis kode, baca RFC-001, RFC-004, dan RFC-012 bersama PRD, FEATURES, dan RULES, lalu catat hal yang masih harus ditebak. Tanyakan keputusan yang belum tersurat kepada pemilik dan perbarui RFC sebelum `/implement-rfc`. Implementasi satu RFC tetap perlu rencana dan persetujuan terpisah.