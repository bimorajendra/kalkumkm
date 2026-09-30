# Features: Takaran (nama kerja)

> **Diubah oleh `docs/CHANGE-001-online-nextjs.md` (27 September 2026):** produk pindah ke Next.js, Postgres, akun, dan model online. Bagian di dokumen ini yang bertentangan dengan CHANGE-001 tidak berlaku.

> Diekstrak dari `PRD.md` v0.2 dengan dukungan `TECH.md` dan `DESIGN.md`, 25 September 2026.
> **ID fitur bersifat permanen.** Fitur baru memakai nomor berikutnya yang belum terpakai; fitur yang dibatalkan ditandai `[REMOVED]`, tidak dihapus atau dipakai ulang. RFC mengutip ID ini.
> Kolom "Ref" menunjuk ID di PRD (FR, NFR, CR, BG) atau bagian TECH/DESIGN.

## Ringkasan Produk

Kalkulator HPP online untuk penjual kue, hampers, frozen food, dan katering rumahan. Data resep dan harga tersimpan per akun di Postgres; landing menyediakan demo publik tanpa login. Arsitektur aktif ditetapkan di `docs/CHANGE-001-online-nextjs.md`.

Persona: **Rina** (penjual kue dan hampers, pembeli pertama) dan **Dimas** (frozen food dengan beberapa saluran jual).

## Ringkasan

| Prioritas | Jumlah |
|----------|-------|
| Must Have | 30 |
| Should Have | 9 |
| Could Have | 4 |
| Won't Have (v1) | 4 |
| **Total** | **47** |

| Kategori | Must | Should | Could | Won't |
|---|---|---|---|---|
| Fondasi | 4 | 0 | 0 | 0 |
| Bahan | 2 | 1 | 1 | 1 |
| Resep dan HPP | 3 | 2 | 1 | 1 |
| Harga dan untung | 7 | 1 | 1 | 0 |
| Data dan lisensi | 4 | 0 | 1 | 1 |
| Pesanan custom dan berbagi | 2 | 4 | 0 | 0 |
| Validasi dan operasional | 8 | 1 | 0 | 0 |
| Platform | 0 | 0 | 0 | 1 |

---

## Must Have

### Fondasi

| ID | Fitur | Ref | Kompleksitas | Acceptance Criteria |
|----|---------|-----|-----------|-------------------|
| F1 | Mesin hitung HPP (`packages/calc`) | CR-01 s.d. CR-12, NFR-04, NFR-11 | High | Semua rumus CR tersedia sebagai fungsi murni; contoh brownies PRD bagian 7 menghasilkan angka persis (bahan Rp 27.800, HPP Rp 2.925, harga Rp 5.000, margin 4150 bp, markup 7094 bp, ojol Rp 7.500, untung/jam Rp 22.133, margin 3850 bp setelah telur Rp 2.600); property test margin lulus; siklus sub-resep terdeteksi; What-if dan order memiliki tes deterministik/property untuk validasi, desimal presisi, nilai besar, dan pembulatan; cakupan baris ≥ 95% |
| F2 | Penyimpanan lokal di perangkat | FR-23, NFR-05 | Medium | Data usaha tersimpan di IndexedDB lewat Dexie dengan skema TECH 7.1; `navigator.storage.persist()` dipanggil saat pertama buka; tidak ada data resep, bahan, atau harga yang dikirim ke jaringan |
| F3 | PWA offline dan pembaruan | FR-23, NFR-03 | Medium | Setelah kunjungan pertama, kalkulasi, data lokal, dan aktivasi lisensi bekerja offline; checkout dan klaim kode membutuhkan koneksi; aplikasi bisa dipasang dan pembaruan tidak memuat ulang saat pengguna mengetik |
| F4 | Token desain dan tema terang | NFR-06, DESIGN 4 dan 5 | Low | Semua warna dan tipografi berasal dari token DESIGN.md; semua halaman memakai palet hangat yang sama dan tetap terang pada preferensi perangkat apa pun; kontras WCAG AA |

### Bahan

| ID | Fitur | Ref | Kompleksitas | Acceptance Criteria |
|----|---------|-----|-----------|-------------------|
| F5 | Tambah dan ubah bahan dengan konversi satuan | FR-01, FR-02 | Medium | Pengguna bisa menyimpan nama, harga beli, isi kemasan, dan satuan (kg, g, l, ml, butir, pcs, bungkus); satuan custom seperti "1 bungkus = 250 g" didukung; harga per satuan pakai tampil sesuai CR-01; input tidak valid menampilkan pesan di bawah field |
| F6 | Ubah harga dari daftar bahan | FR-03 | Low | Harga bisa diubah langsung di baris daftar tanpa membuka resep; setiap perubahan dicatat ke `priceHistory`; baris menampilkan jumlah resep yang memakai bahan itu |

### Resep dan HPP

| ID | Fitur | Ref | Kompleksitas | Acceptance Criteria |
|----|---------|-----|-----------|-------------------|
| F7 | Resep dengan bahan, takaran, dan hasil per adonan | FR-06 | Medium | Pengguna bisa membuat, mengubah, dan menghapus resep; takaran memakai satuan yang cocok dengan bahannya; empty state menawarkan "Pakai contoh brownies" yang mengisi data contoh PRD bagian 7 |
| F8 | Biaya kemasan dan energi | FR-07 | Low | Kemasan per porsi dan energi per adonan bisa diisi dan ikut dalam HPP sesuai CR-03 dan CR-04 |
| F9 | Rincian HPP dan tumpukan isometrik | FR-08, DESIGN 3.1 | Medium | Rincian bahan, energi, kemasan, dan tenaga tampil bersama HPP per porsi; tumpukan isometrik menggambar komponen sebanding rupiahnya dengan label teks di tiap lempeng; untung negatif digambar sebagai garis putus-putus merah berlabel "Rugi Rp X per porsi" |

### Harga dan untung

| ID | Fitur | Ref | Kompleksitas | Acceptance Criteria |
|----|---------|-----|-----------|-------------------|
| F10 | Slider target margin dan harga saran | FR-12, CR-05 | Medium | Slider bertitik 10% s.d. 70% (default 40%) mengubah harga saran secara langsung; tersedia opsi "Ketik angka"; slider bisa dipakai penuh dengan keyboard dan memiliki `aria-valuetext` berisi harga |
| F11 | Alarm margin | FR-13 | Medium | Setelah harga bahan berubah, semua resep dengan margin aktual di bawah target ditandai; banner "N menu untungnya turun di bawah target" muncul dan bisa ditutup (termasuk dengan `Escape`); tiap menu menampilkan harga baru yang disarankan |
| F12 | Margin dan markup berdampingan | FR-14, CR-06, CR-07 | Low | Margin dan markup tampil bersebelahan dengan penjelasan satu kalimat berisi angka resep yang sedang dibuka |
| F13 | Untung per jam | FR-15, CR-08, CR-10 | Low | Pengguna memilih jam kerja per adonan; untung per jam tampil sesuai CR-08; jika upah tenaga tidak diisi, teksnya menjelaskan bahwa angka ini adalah upah yang sebenarnya diterima |
| F14 | Margin aktual dari harga yang sedang dipakai | FR-17, CR-06 | Low | Pengguna bisa memasukkan harga jual sekarang dan melihat margin aktual beserta status di atas/di bawah target |

### Data dan lisensi

| ID | Fitur | Ref | Kompleksitas | Acceptance Criteria |
|----|---------|-----|-----------|-------------------|
| F15 | Cadangan dan pulihkan, dengan pengingat | FR-24, NFR-09, TECH 7.4 | Medium | Ekspor satu file JSON sesuai format TECH 7.4 lewat Web Share atau unduhan; pulihkan memvalidasi skema dan `sha256`, menampilkan ringkasan, meminta konfirmasi, lalu menulis dalam satu transaksi; pengingat muncul jika cadangan terakhir lebih dari 14 hari |
| F16 | Batas versi gratis dan paywall | FR-25 | Low | Versi gratis dibatasi 3 resep dan 1 saluran di lapisan repository; saat batas tercapai, layar paywall menjelaskan isi Pro; data tidak pernah dihapus |
| F17 | Aktivasi Pro offline | FR-26, TECH 8.1 | Medium | Tautan `/aktivasi#<kode>` atau kode yang ditempel diverifikasi dengan Ed25519 tanpa jaringan; kode yang diubah satu karakter ditolak dengan pesan jelas; lisensi tersimpan di `settings` dan ikut di file cadangan |
| F18 | Halaman beli dan cadangan manual | FR-27 | Low | Menampilkan harga dan CTA "Bayar dengan Mayar"; transfer/QRIS statis dan tautan `wa.me` hanya tampil bila `VITE_PAYMENT_BANK_NAME`, `VITE_PAYMENT_ACCOUNT_NAME`, `VITE_PAYMENT_ACCOUNT_NUMBER`, `VITE_PAYMENT_QRIS_IMAGE`, dan `VITE_SELLER_WA` terisi; kode aktivasi bisa ditempel |

### Validasi dan operasional

| ID | Fitur | Ref | Kompleksitas | Acceptance Criteria |
|----|---------|-----|-----------|-------------------|
| F19 | Landing page dengan demo kalkulator | FR-30, DESIGN 10.5 | Medium | Section sesuai DESIGN 10.5; demo hero bisa dipakai dan memakai `packages/calc` yang sama dengan aplikasi; tidak ada testimoni, rating, logo klien, atau statistik tanpa sumber; JS di luar demo 0 KB |
| F20 | Daftar tunggu gratis dan API | FR-31, TECH 9.1 | Medium | Form mengirim nama usaha, nomor WA, jenis jualan, dan persetujuan; API memvalidasi dengan Zod, memverifikasi Turnstile, membatasi 5 kiriman per IP per jam, menormalisasi nomor ke `62…`; state mengirim, berhasil, dan gagal tampil tanpa kehilangan isian |
| F21 | Admin pesanan | BG-1, TECH 9.2 | Medium | Halaman `/admin` di balik Cloudflare Access dan verifikasi JWT; daftar pesanan dengan filter status; tandai lunas dengan nominal dan metode; ekspor CSV; hapus data pesanan atas permintaan |
| F22 | Penerbitan kode lisensi manual | FR-26, FR-27, TECH 8.2 dan 8.3 | Medium | Admin dapat menandai pembayaran transfer/QRIS lunas dan menerbitkan kode bertanda tangan memakai penanda tangan yang sama dengan jalur Mayar; tersedia tautan aktivasi dan `wa.me`; kunci privat hanya di Worker secret |
| F23 | Analitik event anonim | PRD 13, NFR-05, TECH 10 | Low | Event di TECH 10 terkirim ke Umami tanpa nama bahan, resep, atau harga; kegagalan analitik tidak mengganggu aplikasi; nama event dibatasi daftar yang diizinkan |
| F41 | Checkout otomatis lewat Mayar | FR-32, TECH 9.1 dan 9.3 | High | API membuat invoice v2 dengan harga dari `PRICING`; `claimToken` 32 byte hanya disimpan sebagai hash di D1 dan token mentah hanya di perangkat; pembayaran hanya dianggap lunas setelah `GET invoice` mengonfirmasi status `paid` dan nominal cocok; webhook idempoten, balas cepat, lalu verifikasi di `waitUntil`; klaim lisensi memakai token dan dibatasi cek invoice sekali per 30 detik; uji hanya dengan sandbox/mock; transfer manual tetap tersedia sebagai cadangan |
| F37 | Pesanan menjadi daftar belanja | FR-28, FR-35 | Medium | Dari resep dan jumlah porsi, aplikasi menskalakan takaran tepat, mengekspansi sub-resep, menjumlahkan kebutuhan bahan, membulatkan kemasan beli ke atas, dan menampilkan estimasi biaya tanpa menyimpan pesanan |
| F43 | What-if kenaikan harga bahan | FR-33, CR-01 s.d. CR-06 | Medium | Pengguna memasukkan kenaikan persen untuk satu bahan; selisih biaya berpresisi penuh dihitung sementara tanpa mengubah snapshot; perubahan HPP dan margin semua resep terkait tampil tanpa menulis snapshot ke server |
| F44 | Analisis dampak lintas resep | FR-33, FR-13 | Medium | Menunjukkan resep terdampak, perubahan HPP/margin sebelum-sesudah, harga evaluasi, dan jumlah resep yang turun di bawah target; resep yang tidak memakai bahan tidak ditandai |
| F45 | Kalkulator order/batch | FR-34, CR-03 s.d. CR-08 | Medium | Pilih resep dan jumlah porsi; takaran diskalakan tepat sesuai pesanan; menampilkan HPP, total biaya produksi, omzet, dan laba berdasarkan harga jual tersimpan atau saran |
| F46 | Kalkulator publik | FR-36, CR-01 s.d. CR-11 | Medium | Halaman `/kalkulator-hpp`, `/margin`, `/bep`, `/harga-jual`, dan `/harga-ojol` dapat digunakan tanpa login, memakai `packages/calc`, dan tidak menyimpan input |
| F47 | SEO use-case | FR-37 | Medium | Halaman brownies, katering, frozen food, rice bowl, minuman, dan hampers memiliki metadata unik, tautan kalkulator, konten kontekstual, serta tidak menampilkan klaim/testimoni/angka pasar rekaan |

---

## Should Have

| ID | Fitur | Kategori | Ref | Kompleksitas | Acceptance Criteria |
|----|---------|---------|-----|-----------|-------------------|
| F24 | Daftar bahan umum sebagai titik awal | Bahan | FR-04 | Low | Saat menambah bahan, tersedia daftar bahan umum tanpa harga (tepung, gula, telur, mentega, dll.) dengan satuan bawaan |
| F25 | Sub-resep (resep di dalam resep) | Resep dan HPP | FR-09, CR-09 | High | Resep bisa ditandai sebagai sub-resep dan dipakai sebagai bahan resep lain; perubahan harga bahan mengalir ke semua resep yang memakainya; siklus ditolak dengan pesan "Adonan dasar tidak bisa memakai dirinya sendiri"; fitur Pro |
| F26 | Duplikasi resep | Resep dan HPP | FR-10 | Low | Satu ketukan membuat salinan resep dengan nama "(salinan)"; menghormati batas versi gratis |
| F27 | Harga per saluran jual | Harga dan untung | FR-16 | Medium | Pengguna membuat saluran dengan komisi atau diskon; harga saran tiap saluran tampil dan ikut berubah saat HPP berubah; versi gratis 1 saluran |
| F28 | Penawaran harga pesanan custom | Pesanan custom dan berbagi | FR-19 | Medium | Pilih resep dasar dan centang opsi berharga tambahan; total harga dan untung tampil; opsi tersimpan per resep; fitur Pro |
| F29 | Ekspor penawaran sebagai gambar | Pesanan custom dan berbagi | FR-20 | Medium | Penawaran diekspor ke PNG dengan nama usaha pengguna; PDF dimuat terpisah hanya jika diputuskan dibutuhkan (PRD open question 6) |
| F30 | Gambar daftar harga untuk dibagikan | Pesanan custom dan berbagi | FR-21 | Medium | PNG 1080×1920 dan 1080×1080 berisi nama usaha dan daftar harga, tanpa HPP atau margin; dibagikan lewat Web Share dengan teks berisi `https://<domain>/?ref=share` |
| F31 | Tanda "dihitung dengan Takaran" | Pesanan custom dan berbagi | FR-22 | Low | Gambar versi gratis memuat tanda kecil; versi Pro tanpa tanda |
| F32 | Retensi data pre-order | Validasi dan operasional | TECH 9.4 | Low | Cron bulanan menghapus nomor WA pesanan berstatus `waitlist` yang lebih dari 12 bulan; form memuat kalimat persetujuan dan tautan kebijakan privasi |

## Could Have

| ID | Fitur | Kategori | Ref | Kompleksitas | Acceptance Criteria |
|----|---------|---------|-----|-----------|-------------------|
| F33 | Impor bahan dari CSV/Excel | Bahan | FR-05 | Medium | File dengan kolom nama, harga, isi, satuan diimpor dengan pratinjau dan laporan baris yang gagal |
| F34 | Skala resep dan konversi ukuran loyang | Resep dan HPP | FR-11 | Medium | Takaran dan HPP menyesuaikan saat ukuran loyang atau jumlah loyang diubah |
| F35 | Template pengumuman naik harga | Harga dan untung | FR-18 | Low | Dari alarm margin, pengguna bisa menyalin pesan sopan berisi harga lama dan baru |
| F36 | Daftar kode lisensi dicabut | Data dan lisensi | TECH 8.1, TECH 18 no. 5 | Low | Saat online, aplikasi mengambil `/v1/licenses/revoked` paling sering sekali sehari dan menonaktifkan Pro untuk kode yang dicabut |

## Won't Have (v1)

| ID | Fitur | Kategori | Catatan |
|----|---------|---------|-------|
| F38 | Label kemasan otomatis | Resep dan HPP | FR-29, direncanakan v1.2 |
| F39 | Tampilan riwayat harga bahan | Bahan | v1.2; datanya sudah dicatat sejak F6 |
| F40 | Akun dan sinkronisasi cloud terenkripsi | Data dan lisensi | TECH 16, v2 |
| F42 | Aplikasi native atau TWA Play Store | Platform | PRD bagian 4; TWA dipertimbangkan setelah v1 |

---

## Pemeriksaan Mandiri

Dijalankan saat penyusunan:
- Jumlah per prioritas dihitung ulang dari tabel: Must 30 (F1 s.d. F23, F37, F41, dan F43 s.d. F47), Should 9 (F24 s.d. F32), Could 4 (F33 s.d. F36), Won't 4 (F38 s.d. F40 dan F42), total 47. Tabel kategori dijumlahkan per kolom dan cocok (30, 9, 4, 4).
- Setiap FR-01 s.d. FR-37 di PRD dipetakan ke fitur: FR-01/02 ke F5, FR-03 ke F6, FR-04 ke F24, FR-05 ke F33, FR-06 ke F7, FR-07 ke F8, FR-08 ke F9, FR-09 ke F25, FR-10 ke F26, FR-11 ke F34, FR-12 ke F10, FR-13 ke F11/F44, FR-14 ke F12, FR-15 ke F13, FR-16 ke F27, FR-17 ke F14, FR-18 ke F35, FR-19 ke F28, FR-20 ke F29, FR-21 ke F30, FR-22 ke F31, FR-23 ke F2, FR-24 ke F15, FR-25 ke F16, FR-26 ke F41, FR-27 ke F41, FR-28 ke F37, FR-29 ke F38, FR-30 ke F19, FR-31 ke F20/F21/F32, FR-32 ke F41, FR-33 ke F43/F44, FR-34 ke F45, FR-35 ke F37, FR-36 ke F46, FR-37 ke F47.
- Fitur yang tidak berasal dari FR (F4, F21, F23, F36, F39, F40, F42) diberi referensi ke NFR, BG, TECH, atau DESIGN.
- Landing dan daftar tunggu tetap gratis pada masa validasi; checkout Mayar dibuka saat aplikasi rilis. F41 tetap ID yang sama dan naik ke Must.
