# Product Requirements Document: Takaran (nama kerja)

> Status: Draf v0.2, 25 September 2026
> Pemilik: Bimo Rajendra Widyadhana
> Nama "Takaran" adalah nama kerja dan belum final. Logo belum ada; gunakan wordmark teks sampai ada keputusan.
> Dokumen ini disusun agar bisa langsung dipakai dalam pipeline ai-prd-workflow (`/verify-prd` lalu `/extract-features`). Arah visual ada di `DESIGN.md`.

## 1. Overview

Takaran adalah aplikasi web (PWA, bisa dipasang di layar utama HP) untuk penjual kue, hampers, frozen food, dan katering rumahan yang menerima pesanan. Pengguna memasukkan harga bahan seperti yang tertulis di struk belanja, menyusun resep, lalu langsung melihat HPP per potong, harga jual yang disarankan, dan untung yang sebenarnya. Saat harga bahan naik, semua resep dihitung ulang dan pengguna diberi tahu menu mana yang untungnya turun.

Produk ini dipakai sendirian oleh penjual. Data resep dan harga disimpan di perangkat pengguna dan tidak dikirim ke server. Server Cloudflare menangani daftar tunggu, checkout Mayar, dan penerbitan kode lisensi. Aplikasi memanggil server hanya untuk checkout dan klaim lisensi; hitung HPP tetap bekerja offline.

## 2. Tujuan Bisnis

| ID | Tujuan | Target | Cara ukur |
|---|---|---|---|
| BG-1 | Membuktikan penjual rumahan mau membayar tool hitung untung | 30 pembelian Pro dalam 60 hari setelah rilis | Jumlah kode aktivasi yang terbit |
| BG-2 | Menjadi produk digital pertama dengan biaya operasional mendekati nol | Biaya server kurang dari Rp 100.000/bulan, belum termasuk biaya transaksi Mayar | Tagihan hosting dan biaya pembayaran |
| BG-3 | Membangun saluran distribusi organik | 40% pengguna baru datang dari gambar daftar harga yang dibagikan | Parameter `?ref=share` di tautan |

Target di atas adalah sasaran internal, bukan klaim publik. Jangan tampilkan angka ini di landing page.

## 3. Tujuan Produk

- Pengguna baru bisa melihat HPP resep pertamanya dalam waktu kurang dari 5 menit tanpa mendaftar.
- Pengguna bisa memperbarui harga satu bahan dan melihat dampaknya ke semua menu dalam kurang dari 10 detik.
- Pengguna paham beda markup dan margin setelah memakai aplikasi, sehingga tidak lagi menjual rugi tanpa sadar.
- Aplikasi tetap berfungsi penuh tanpa internet.

## 4. Scope

### In Scope (v1.0)

- Master bahan dengan konversi satuan beli ke satuan pakai
- Resep, termasuk resep di dalam resep (adonan dasar, isian, topping)
- Biaya kemasan, energi (gas/listrik), dan tenaga
- HPP per porsi dan harga jual dari target margin
- Harga jual per saluran (langsung, reseller, ojol) dengan komisi dan diskon
- Update harga bahan dengan hitung ulang otomatis dan alarm margin
- "Untungmu per jam"
- Penawaran harga pesanan custom (gambar/PDF)
- Gambar daftar harga untuk status WA/Instagram
- Cadangan dan pulihkan data ke file
- Kode aktivasi Pro melalui checkout Mayar, dengan transfer manual atau QRIS statis sebagai cadangan

### Out of Scope (v1.0)

- Akun, login, dan sinkronisasi cloud antar perangkat
- Pencatatan penjualan harian, kasir/POS, dan stok gudang
- Pesanan menjadi daftar belanja (masuk v1.1)
- Label kemasan otomatis dan riwayat harga bahan (masuk v1.2)
- Marketplace, ojol, atau WhatsApp API
- Aplikasi native Android/iOS
- Fitur multi-pengguna atau karyawan
- Database harga pasar bersama (setiap pengguna memasukkan harga sendiri)

## 5. User Personas

### Bu Rina, penjual kue dan hampers rumahan

- 38 tahun, jualan dari dapur rumah, pesanan lewat WhatsApp dan Instagram, 10 sampai 30 pesanan per minggu, ramai saat Lebaran dan Natal.
- Memakai HP Android kelas menengah. Jarang membuka laptop.
- Pain points: harga ditentukan dengan "kira-kira" atau meniru penjual lain; bingung memberi harga kue custom; tidak tahu apakah masih untung setelah telur dan mentega naik; sungkan menaikkan harga ke pelanggan langganan.
- Yang dia butuhkan: jawaban cepat "harga segini masih untung nggak?", bukan laporan akuntansi.

### Mas Dimas, penjual frozen food dan reseller

- 27 tahun, produksi dimsum/risol beku mingguan, menjual langsung, lewat reseller, dan lewat ojol.
- Pain points: satu produk punya tiga harga berbeda dan dia tidak yakin semuanya untung; komisi ojol memakan margin; menghitung ulang di Excel setiap harga bahan berubah.
- Yang dia butuhkan: harga per saluran yang otomatis ikut berubah saat HPP berubah.

### Pembeli pertama yang paling mungkin

Bu Rina. Dia punya momen bayar yang jelas: menjelang musim pesanan besar (hampers Lebaran) ketika salah harga berarti rugi besar.

## 6. Lanskap Kompetitor

| Alternatif | Kekuatan | Kelemahan yang jadi peluang |
|---|---|---|
| Kalkuliner (kalkuliner.id) | Fitur lengkap, sudah dipakai ribuan UMKM, ada kalkulator promo dan ojol | Menyasar usaha kuliner secara umum termasuk resto; perlu dibedah lebih lanjut (lihat Open Questions) |
| Template Excel/Sheets gratis (TikTok, blog) | Gratis, fleksibel | Susah di HP, rumus mudah rusak, tidak ada alarm saat harga naik |
| Kalkulator HPP web gratis (misal UMKM Pintar) | Gratis, langsung pakai | Sekali hitung, tidak menyimpan resep, tidak ada simulasi |
| Hitung manual/kira-kira | Tanpa belajar apa pun | Sumber utama jual rugi tanpa sadar |

Posisi Takaran: khusus usaha rumahan berbasis pesanan, dirancang untuk HP, dan fokus pada dua momen: "harga bahan naik" dan "ada pesanan custom".

## 7. Aturan Perhitungan (sumber kebenaran)

Input uang dari pengguna disimpan sebagai bilangan bulat rupiah. Hasil antara (misal Rp 27.800 ÷ 16 = Rp 1.737,5) dihitung dengan presisi penuh dan baru dibulatkan saat ditampilkan atau saat menyarankan harga. Rincian yang ditampilkan harus dijumlahkan dari angka presisi penuh, bukan dari angka yang sudah dibulatkan.

| ID | Aturan | Rumus |
|---|---|---|
| CR-01 | Harga per satuan pakai | `harga_beli ÷ (isi_kemasan × faktor_konversi)`; contoh tepung 1 kg Rp 14.000 menjadi Rp 14/gram |
| CR-02 | Biaya bahan dalam resep | `takaran × harga_per_satuan_pakai` |
| CR-03 | Biaya satu adonan (batch) | `Σ biaya bahan + Σ biaya sub-resep + biaya energi per batch + biaya tenaga per batch` |
| CR-04 | HPP per porsi | `biaya batch ÷ jumlah porsi per batch + biaya kemasan per porsi` |
| CR-05 | Harga jual dari target margin | `HPP ÷ (1 − margin − komisi_saluran)`, lalu dibulatkan ke atas ke kelipatan pembulatan pilihan pengguna (default Rp 500) |
| CR-06 | Margin aktual | `(harga_jual × (1 − komisi) − HPP) ÷ harga_jual` |
| CR-07 | Markup (hanya untuk edukasi) | `(harga_jual − HPP) ÷ HPP` |
| CR-08 | Untung per jam | `(harga_jual × (1 − komisi) − HPP) × porsi per batch ÷ jam kerja per batch` |
| CR-09 | Sub-resep | Dihitung sebagai bahan dengan harga per satuan = biaya batch sub-resep ÷ hasil sub-resep. Referensi melingkar harus ditolak. |
| CR-10 | Tenaga | Opsional. Jika diisi, `upah per jam × jam kerja per batch` masuk ke CR-03. Jika tidak diisi, CR-08 menunjukkan berapa upah yang sebenarnya diterima. |
| CR-11 | Harga per saluran diskon | Harga = `harga_jual_langsung × (1 − diskon)` lalu dibulatkan ke bawah ke kelipatan pilihan pengguna. Margin aktual dihitung setelah diskon. Saluran komisi tetap mengikuti CR-05. |
| CR-12 | Total penawaran custom | Harga = `harga_per_porsi × jumlah_porsi + Σ harga_opsi`; biaya = `HPP × jumlah_porsi + Σ biaya_opsi`; untung = harga − biaya. |

### Contoh acuan (harus lolos sebagai test case)

Brownies, 1 loyang = 16 potong. Harga bahan ilustrasi.

| Bahan | Takaran | Harga beli | Biaya |
|---|---|---|---|
| Tepung terigu | 150 g | Rp 14.000/kg | Rp 2.100 |
| Cokelat masak | 200 g | Rp 50.000/kg | Rp 10.000 |
| Telur | 4 butir | Rp 2.000/butir | Rp 8.000 |
| Gula pasir | 200 g | Rp 16.000/kg | Rp 3.200 |
| Margarin | 150 g | Rp 30.000/kg | Rp 4.500 |
| **Total bahan** | | | **Rp 27.800** |

- Energi per loyang Rp 3.000, jadi biaya batch Rp 30.800.
- Per potong Rp 1.925, ditambah kemasan Rp 1.000, jadi **HPP Rp 2.925**.
- Target margin 40%: 2.925 ÷ 0,6 = Rp 4.875, dibulatkan menjadi **Rp 5.000**. Margin aktual 41,5%, markup 70,9%.
- Saluran ojol dengan komisi 20%: 2.925 ÷ 0,4 = Rp 7.312,5, dibulatkan menjadi **Rp 7.500**. Margin bersih 41%.
- Jam kerja 1,5 jam per loyang: untung per loyang Rp 33.200, jadi **untung per jam sekitar Rp 22.133**.
- Jika telur naik ke Rp 2.600/butir: HPP menjadi Rp 3.075 dan margin pada harga Rp 5.000 turun ke 38,5%, sehingga alarm margin (FR-13) muncul karena berada di bawah target 40%.
- Edukasi markup: HPP Rp 3.000 ditambah markup 40% menjadi Rp 4.200, tetapi marginnya hanya 28,6%.

## 8. Functional Requirements

Prioritas memakai MoSCoW: **M** = Must (MVP), **S** = Should (MVP bila waktu cukup), **C** = Could (setelah MVP), **W** = Won't (v1.0).

### 8.1 Bahan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-01 | Pengguna bisa menambah bahan dengan nama, harga beli, isi kemasan, dan satuan beli (kg, g, l, ml, butir, pcs, bungkus) | M |
| FR-02 | Aplikasi mengonversi satuan beli ke satuan pakai secara otomatis (CR-01), termasuk satuan custom seperti "1 bungkus = 250 g" | M |
| FR-03 | Pengguna bisa mengubah harga bahan dari satu layar daftar, tanpa membuka tiap resep | M |
| FR-04 | Aplikasi menyediakan daftar bahan umum (tepung, gula, telur, mentega, dll.) tanpa harga sebagai titik awal | S |
| FR-05 | Impor bahan dari file CSV/Excel | C |

### 8.2 Resep dan HPP

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-06 | Pengguna bisa membuat resep dengan daftar bahan, takaran, dan hasil per batch (jumlah porsi) | M |
| FR-07 | Pengguna bisa menambahkan biaya kemasan per porsi dan biaya energi per batch | M |
| FR-08 | Aplikasi menampilkan HPP per porsi beserta rincian komponennya (bahan, kemasan, energi, tenaga) | M |
| FR-09 | Resep bisa memakai resep lain sebagai bahan (CR-09), dengan pencegahan referensi melingkar | S |
| FR-10 | Pengguna bisa menduplikasi resep untuk membuat varian | S |
| FR-11 | Skala resep dan konversi ukuran loyang (misal 20×20 cm ke 22×22 cm, 1 loyang ke 3 loyang) | C |

### 8.3 Harga dan Untung

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-12 | Pengguna mengatur target margin dengan slider (10% sampai 70%) dan melihat harga jual yang disarankan berubah secara langsung (CR-05) | M |
| FR-13 | Alarm margin: setelah harga bahan diubah, aplikasi menandai semua menu yang margin aktualnya di bawah target dan menyarankan harga baru | M |
| FR-14 | Aplikasi menampilkan margin dan markup berdampingan, dengan penjelasan satu kalimat tentang bedanya | M |
| FR-15 | "Untungmu per jam": pengguna memasukkan jam kerja per batch dan melihat hasil CR-08 | M |
| FR-16 | Harga per saluran: pengguna membuat saluran (langsung, reseller, ojol) dengan komisi atau diskon, dan melihat harga jual tiap saluran | S |
| FR-17 | Pengguna bisa memasukkan harga jual yang sudah dipakai sekarang dan melihat margin aktualnya | M |
| FR-18 | Template pesan pengumuman naik harga yang sopan, bisa disalin | C |

### 8.4 Pesanan Custom dan Berbagi

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-19 | Penawaran harga custom: pilih resep dasar, tambahkan opsi (ukuran, tulisan, topper, tema), lalu dapatkan harga total dan untungnya | S |
| FR-20 | Ekspor penawaran harga sebagai gambar PNG dan PDF dengan nama usaha pengguna | S |
| FR-21 | Gambar daftar harga menu untuk status WA/Instagram (format 1080×1920 dan 1080×1080) | S |
| FR-22 | Versi gratis menambahkan tanda kecil "dihitung dengan Takaran" di gambar; versi Pro bisa menghapusnya | S |

### 8.5 Data dan Lisensi

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-23 | Data usaha (bahan, resep, harga, dan pengaturan) tersimpan di perangkat (IndexedDB); kalkulator dan verifikasi lisensi bekerja offline. Checkout dan klaim lisensi perlu internet | M |
| FR-24 | Cadangkan semua data ke satu file dan pulihkan dari file tersebut | M |
| FR-25 | Batas versi gratis: maksimal 3 resep tersimpan dan 1 saluran | M |
| FR-26 | Aktivasi Pro dengan kode yang diverifikasi secara offline (kode ditandatangani, diperiksa dengan kunci publik di aplikasi) | M |
| FR-27 | Halaman beli menyediakan checkout Mayar sebagai jalur utama dan jalur manual transfer/QRIS statis bila konfigurasi `VITE_PAYMENT_*` tersedia | M |
| FR-28 | Pesanan menjadi daftar belanja yang dibulatkan ke ukuran kemasan | W (v1.1) |
| FR-29 | Label kemasan otomatis (komposisi, tanggal produksi) | W (v1.2) |

### 8.6 Validasi, daftar tunggu, dan pembayaran

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-30 | Landing page menampilkan demo kalkulator yang bisa dipakai dan memakai mesin hitung yang sama dengan aplikasi | M |
| FR-31 | Form daftar tunggu gratis memvalidasi persetujuan, Turnstile, dan batas kiriman; admin dapat melihat dan mengelola pesanan | M |
| FR-32 | Checkout Mayar membuat invoice server-side, memverifikasi pembayaran, lalu menyediakan klaim kode lisensi offline; transfer manual/QRIS tetap tersedia sebagai cadangan | M |

## 9. Non-Functional Requirements

| ID | Kebutuhan |
|---|---|
| NFR-01 | Performa: hitung ulang 100 resep setelah perubahan harga selesai dalam kurang dari 200 ms di HP Android kelas menengah |
| NFR-02 | Ukuran: muatan awal kurang dari 250 KB (gzip) agar cepat di jaringan seluler |
| NFR-03 | Offline: kalkulator, data lokal, dan verifikasi kode lisensi bekerja tanpa internet setelah kunjungan pertama. Checkout dan klaim lisensi memerlukan koneksi, tanpa menghalangi fitur lokal. |
| NFR-04 | Akurasi: input uang disimpan sebagai bilangan bulat rupiah, perhitungan antara memakai presisi penuh, pembulatan hanya saat tampil; angka yang sama tidak boleh berbeda antar layar |
| NFR-05 | Privasi: data resep dan harga tidak pernah dikirim ke server. Checkout mengumpulkan nama, email, nomor WhatsApp, dan nama usaha dengan persetujuan untuk pembayaran dan aktivasi; retensi mengikuti TECH 9.4. Analitik tidak memuat data pribadi atau isi resep. |
| NFR-06 | Aksesibilitas: memenuhi WCAG 2.2 AA; semua kontrol bisa dipakai dengan keyboard dan pembaca layar; target sentuh minimal 44 px |
| NFR-07 | Bahasa: antarmuka Bahasa Indonesia sehari-hari; format angka Indonesia (Rp 5.000, 41,5%) |
| NFR-08 | Tampilan: mobile-first, lebar minimum 320 px; tata letak dua kolom mulai 1024 px (lihat `DESIGN.md`) |
| NFR-09 | Ketahanan data: aplikasi mengingatkan pengguna untuk mencadangkan data setiap 14 hari |
| NFR-10 | Biaya: layanan memakai Cloudflare Pages, Workers, dan D1; endpoint server dibatasi pada daftar tunggu, checkout, lisensi, dan admin. Biaya Mayar masuk perhitungan biaya operasional. |

## 10. Model Data (garis besar)

```
Ingredient   { id, name, buyPrice, packSize, buyUnit, useUnit, customUnits[], updatedAt }
Recipe       { id, name, yieldPortions, items[], packagingPerPortion, energyPerBatch,
               laborMinutesPerBatch, laborRatePerHour?, targetMargin, currentPrice?, isSubRecipe }
RecipeItem   { refType: "ingredient" | "recipe", refId, quantity, unit }
Channel      { id, name, commissionPct, discountPct }
QuoteOption  { id, name, priceAdd, costAdd }
Settings     { businessName, roundingStep, defaultMargin, licenseKey?, pendingCheckout?, lastBackupAt }
```

## 11. User Journeys

### J-1: Hitung resep pertama (tanpa daftar)

1. Pengguna membuka tautan dari status WA temannya.
2. Aplikasi langsung membuka layar kalkulator dengan satu resep kosong.
3. Pengguna menambah bahan beserta harganya dari struk belanja.
4. Pengguna mengisi hasil satu loyang dan biaya kemasan.
5. HPP per potong muncul; slider target margin menampilkan harga jual yang disarankan.
6. Pengguna memasukkan harga yang selama ini dipakai dan melihat margin aktualnya.

### J-2: Harga bahan naik

1. Pengguna membuka daftar bahan dan mengubah harga telur.
2. Aplikasi menampilkan ringkasan: "3 menu untungnya turun di bawah target."
3. Pengguna membuka salah satu menu, melihat harga baru yang disarankan, dan menyimpannya.
4. Pengguna menyalin template pengumuman kenaikan harga (C).

### J-3: Pesanan kue custom

1. Pelanggan meminta kue ulang tahun 22 cm dengan tulisan dan topper.
2. Pengguna membuka Penawaran, memilih resep dasar, lalu mencentang opsi.
3. Aplikasi menampilkan harga total dan untungnya.
4. Pengguna mengekspor gambar penawaran dan mengirimkannya ke pelanggan secara manual.

### J-4: Upgrade ke Pro

1. Pengguna mencoba menyimpan resep keempat dan melihat batas versi gratis beserta apa yang terbuka di Pro.
2. Pengguna mengisi nama, email, nomor WhatsApp, nama usaha, dan persetujuan, lalu memilih "Bayar dengan Mayar". Jika jalur manual dikonfigurasi, pengguna juga bisa transfer atau membayar lewat QRIS statis dan mengirim bukti melalui WhatsApp.
3. Untuk Mayar, server membuat invoice dan hanya menandai pesanan lunas setelah status serta nominal dikonfirmasi langsung ke Mayar. Server menerbitkan kode dengan penanda tangan lisensi yang sama; untuk pembayaran manual, admin menandai lunas dan menerbitkan kode.
4. Aplikasi menyimpan token klaim secara lokal, mengambil kode setelah pembayaran terkonfirmasi, lalu memverifikasinya offline. Redirect browser dari Mayar tidak dianggap sebagai bukti pembayaran.

## 12. Monetisasi

| Paket | Harga (hipotesis) | Isi |
|---|---|---|
| Gratis | Rp 0 | 3 resep, 1 saluran, alarm margin, untung per jam, gambar dengan tanda "dihitung dengan Takaran" |
| Pro (sekali bayar) | Rp 79.000, harga pendiri Rp 49.000 untuk 100 pembeli pertama | Resep tanpa batas, sub-resep, semua saluran, penawaran custom, gambar tanpa tanda, fitur v1.1 dan v1.2 tanpa biaya tambahan |

Harga tetap hipotesis dan diuji lewat daftar tunggu gratis sebelum rilis (lihat bagian 14). Pada halaman harga resmi Mayar per 25 September 2026, biaya platform invoicing tercantum 1,5% (Starter), 1% (Business), atau 0% (Enterprise); biaya kanal yang tercantum antara lain QRIS 0,7%, VA Rp 4.000, dan e-wallet 1,5%, sebelum pajak kanal. Dokumentasi API menyatakan pengaturan pembebanan biaya kepada pelanggan tidak berlaku untuk Invoice. Karena itu, harga pelanggan Rp 79.000/Rp 49.000 tetap dan biaya ditanggung proyek; biaya bersih harus diperiksa pada paket dan kanal akun yang dipakai sebelum penjualan dibuka. [Harga Mayar](https://mayar.id/pricing), [Create Invoice v2](https://docs.mayar.id/api-reference-v2/invoice/create).

## 13. Success Metrics

| Metrik | Target 60 hari |
|---|---|
| Aktivasi: pengguna yang menyelesaikan satu resep dengan HPP | ≥ 60% pengunjung yang menambah bahan pertama |
| Retensi: pengguna yang kembali memperbarui harga bahan dalam 30 hari | ≥ 25% |
| Konversi gratis ke Pro | ≥ 5% dari pengguna teraktivasi |
| Pembelian Pro | ≥ 30 |
| Laporan salah hitung yang terbukti bug | 0 yang belum diperbaiki lebih dari 48 jam |

## 14. Timeline

| Minggu | Kegiatan |
|---|---|
| 0 | Validasi gratis: landing page + daftar tunggu, demo kalkulator, 10 wawancara penjual kue/frozen food, bedah Kalkuliner |
| 1 | Landing dan demo selesai bersama mesin hitung; keputusan lanjut jika ≥ 50 daftar tunggu atau sinyal wawancara cukup |
| 2 | Bahan, resep, HPP (FR-01 sampai FR-08), aturan perhitungan dengan test case bagian 7 |
| 3 | Slider margin, alarm margin, untung per jam, margin vs markup (FR-12 sampai FR-17) |
| 4 | Penyimpanan offline, cadangan, lisensi, halaman beli dan checkout Mayar sandbox (FR-23 sampai FR-27, FR-32) |
| 5 | Should: sub-resep, saluran, penawaran custom, gambar daftar harga |
| 6 | Uji dengan 5 penjual nyata, verifikasi akun dan kanal Mayar, pembayaran Mayar saat rilis, perbaikan, rilis |

## 15. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kalkuliner sudah memenuhi kebutuhan segmen ini | Tidak ada alasan pindah | Bedah produk dan keluhan pengguna mereka di minggu 0; pertajam ke pesanan custom |
| Pengguna enggan mengetik semua bahan | Berhenti sebelum melihat hasil | Daftar bahan umum (FR-04), resep contoh yang bisa diedit, layar pertama langsung kalkulator |
| Kode aktivasi dibagikan | Kebocoran pendapatan | Terima sebagai risiko di v1.0; harga rendah membuat berbagi kurang menarik |
| Data hilang karena ganti HP atau cache dibersihkan | Kepercayaan rusak | Pengingat cadangan (NFR-09) dan penjelasan jelas bahwa data ada di HP |
| Jalur manual membebani pemilik saat Mayar belum siap | Aktivasi tertunda | Mayar menjadi jalur utama saat rilis; manual hanya cadangan sementara saat verifikasi akun atau gangguan kanal |
| Akun Mayar belum terverifikasi atau kanal pembayaran bermasalah | Checkout otomatis belum bisa dibuka | Pertahankan daftar tunggu gratis; sediakan transfer manual/QRIS yang dikonfigurasi dan uji alur sandbox sebelum rilis |
| Biaya Mayar mengurangi pendapatan bersih | Harga Pro tidak menutup biaya yang diperkirakan | Harga awal tetap; ukur biaya berdasarkan kanal dan paket akun sebelum penjualan dibuka |
| Webhook hilang, terlambat, atau dikirim ulang | Lisensi terlambat atau terbit ganda | Konfirmasi invoice ke API Mayar, simpan event secara idempoten, dan sediakan cek ulang status di admin serta klaim |

## 16. Open Questions

1. Apa saja fitur dan harga Kalkuliner saat ini, dan apa keluhan utama penggunanya?
2. Apakah Rp 79.000 sekali bayar terlalu tinggi atau terlalu rendah untuk segmen rumahan?
3. Apakah upah tenaga sebaiknya diisi secara default atau dibiarkan kosong agar "untung per jam" lebih terasa?
4. Perlukah varian ukuran dalam satu resep (kecil/sedang/besar) di v1.0, atau cukup lewat duplikasi resep?
5. Nama produk final dan logo.
6. Apakah perlu PDF selain PNG untuk penawaran, atau PNG saja sudah cukup untuk WhatsApp?
7. Apakah akun Mayar dan kanal pembayaran sudah terverifikasi sebelum checkout diaktifkan untuk rilis?
8. Berapa biaya aktual per kanal pada paket Mayar yang dipakai saat rilis? Harga yang dipilih tetap Rp 79.000/Rp 49.000 dan biaya ditanggung proyek.
