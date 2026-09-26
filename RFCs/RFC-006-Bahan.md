# RFC-006: Bahan

## Ringkasan
Layar Bahan: menambah, mengubah, mencari, dan menghapus bahan dengan konversi satuan, serta mengubah harga langsung dari daftar dengan riwayat harga tercatat.

**Kompleksitas**: Medium
**Fitur**: F5 (Tambah dan ubah bahan dengan konversi satuan), F6 (Ubah harga dari daftar bahan)
**Dibangun di atas**: RFC-002, RFC-005
**Dibutuhkan oleh**: RFC-007, RFC-009, RFC-013, RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/features/ingredients/repository.ts
apps/app/src/features/ingredients/schema.ts         # Zod form bahan
apps/app/src/features/ingredients/copy.ts
apps/app/src/features/ingredients/components/ingredient-list.tsx
apps/app/src/features/ingredients/components/ingredient-row.tsx
apps/app/src/features/ingredients/components/ingredient-form.tsx
apps/app/src/features/ingredients/components/unit-picker.tsx
apps/app/src/features/ingredients/repository.test.ts
apps/app/src/routes/bahan.tsx                        # mengganti state kosong sementara
e2e/ingredients.spec.ts
```

### Repository
```ts
listIngredients(query?: string): Ingredient[]
createIngredient(input): Ingredient
updateIngredient(id, input): Ingredient
updatePrice(id, buyPrice): void          // satu transaksi: ingredients + priceHistory
deleteIngredient(id): void               // ditolak jika dipakai resep
usageCount(id): number
```
`priceHistory` baris: `{ ingredientId, oldPrice, newPrice, changedAt }`.

Dexie v2 mengganti nama field harga lama/baru di `priceHistory`; migrasi dari v1 dan pelestarian nilainya diuji. Indeks tabel tidak berubah.
Setting lokal `firstIngredientAddedAt` menandai pengiriman event pertama supaya `ingredient_first_added` hanya dikirim sekali.

### Validasi (schema.ts)
- Nama 1 s.d. 60 karakter, unik (tanpa peduli huruf besar-kecil).
- Harga beli bilangan bulat 1 s.d. 100.000.000.
- Isi kemasan > 0, maksimal 3 angka desimal.
- Satuan dari daftar F5; `bungkus` atau satuan custom wajib punya definisi isi dan satuan dasar.

### UI (DESIGN 9.7, 10.2)
- Baris tinggi minimal 56 px: nama, "1 kg · Rp 14/gram" (dari `unitPrice`), input harga yang bisa langsung diubah (disimpan saat blur atau `Enter`, dibatalkan dengan `Escape`).
- Setelah harga berubah, baris menampilkan tautan "Dipakai di N resep" (hanya jika N > 0).
- Kotak pencarian di atas daftar; tombol "Tambah bahan" menempel di bawah di HP.
- `IngredientForm` dalam Dialog (desktop) atau sheet Vaul (HP).
- Hapus bahan yang dipakai resep ditolak dengan pesan "Bahan ini dipakai di N resep. Hapus dari resepnya dulu."
- State kosong DESIGN 11: "Tambah bahan dari struk belanja terakhirmu".
- `ingredient_first_added` terkirim saat bahan pertama tersimpan.

## Edge Case
- Harga diubah ke nilai yang sama: tidak ada baris `priceHistory` baru.
- Mengubah satuan bahan yang dipakai resep ke dimensi berbeda (g ke pcs): ditolak dengan pesan, karena takaran resep akan tidak cocok.

## Aturan Terkait
RU-04, RU-06, RU-07, RU-11, RU-14, RU-17, RU-19 (pola validasi), RU-35, RU-40, RU-42.

## Testing
- Repository: create, update, `updatePrice` menulis riwayat dalam transaksi, hapus ditolak jika dipakai, validasi.
- `ingredients.spec.ts`: tambah tepung 1 kg Rp 14.000 dan lihat "Rp 14/gram"; satuan custom bungkus 250 g; ubah harga dari baris dengan keyboard; pencarian; state kosong; HP dan desktop.

## Acceptance Criteria
- [x] Semua file di bagian Struktur ada
- [x] Bahan bisa ditambah dengan semua satuan F5, termasuk satuan custom
- [x] Baris menampilkan harga per satuan pakai sesuai `unitPrice`
- [x] Input tidak valid menampilkan pesan di bawah field dan tidak tersimpan
- [x] Nama duplikat ditolak
- [x] Harga bisa diubah langsung di baris dengan mouse, sentuhan, dan keyboard (`Enter` simpan, `Escape` batal)
- [x] Setiap perubahan harga menulis satu baris `priceHistory` dalam transaksi yang sama; harga sama tidak menulis
- [x] "Dipakai di N resep" tampil setelah perubahan harga jika N > 0
- [x] Hapus bahan yang dipakai resep dan ubah dimensi satuannya ditolak dengan pesan jelas
- [x] Pencarian menyaring daftar
- [x] State kosong DESIGN 11 tampil saat tidak ada bahan
- [x] `ingredient_first_added` terkirim sekali
- [x] Test repository dan `ingredients.spec.ts` lulus; axe tanpa pelanggaran serius

## Bukti

- Test repository dan migrasi: `pnpm test` lulus, 15 file dan 55 test.
- E2E aplikasi produksi: `ingredients.spec.ts` lulus 24 skenario pada 320, 390, 768, dan 1280 px, masing-masing tema terang dan gelap.
- E2E memeriksa tambah bahan, pesan validasi, satuan bungkus 250 g, duplikasi nama, pencarian, ubah harga dengan sentuh/keyboard/tombol, batal, dialog Escape, tautan pemakaian, blokir hapus, axe, overflow, dan konsol bersih. Lima skenario `offline.spec.ts` juga lulus pada 320 px.
- `pnpm typecheck` dan `pnpm build` lulus. `pnpm lint` lulus dengan 17 peringatan lama di `apps/web`, file RFC-006 bersih. `pnpm size`: JS awal 131.43 KB gzip; payload 228.89 KB gzip.

## Delivery Gate (2026-09-26)

### Hard Gate

- R-02 PASS: teks UI bahan tidak memakai em dash.
- R-03 PASS: E2E memeriksa scrollWidth pada 320, 390, 768, dan 1280 px dalam dua tema.
- R-17 PASS: jumlah resep yang dipakai berasal dari data IndexedDB lokal.
- R-18 PASS: layar bahan tidak menampilkan testimoni.
- R-23 PASS: memakai motif rak bahan yang sudah ada; tidak membuat aset baru.
- R-24 PASS: tautan pemakaian menuju route `/resep` yang tersedia.
- R-25 PASS: axe tidak menemukan pelanggaran serious atau critical, termasuk saat dialog terbuka.
- R-26 PASS: tombol tambah, simpan, ubah harga, batal, tutup, hapus, pencarian, dan pilihan satuan dicoba lewat E2E.
- R-27 PASS: state kosong dan error tersedia; data lokal tidak memerlukan state memuat menurut DESIGN 11.
- R-28 PASS: tidak ada FAQ.
- R-32 PASS: harga bisa disimpan dengan Enter, edit dibatalkan dengan Escape, dan dialog ditutup dengan Escape atau tombol tutup.
- R-33 PASS: semua perubahan dibuat langsung di source proyek.
- R-34 PASS: 24 skenario E2E lulus di dua tema.
- R-35 PASS: preview build produksi diuji; form kosong menampilkan validasi, bahan tersimpan, harga bisa diubah, pencarian menyaring, dialog bisa ditutup, penghapusan bahan terpakai ditolak, dan konsol bersih.
- R-36 PASS: tidak ada klaim keamanan, kepatuhan, performa, atau pelanggan.
- R-37 PASS: mengikuti DESIGN.md, dial ENERGY 2 / RHYTHM 2 / MOTION 2.
- R-38 PASS: isi dan jumlah pemakaian diambil dari data nyata lokal, tidak dibuat-buat.

### Purpose-Gate

- R-01 PASS: tidak ada gradien atau glow.
- R-04 PASS: layar tidak menambah ikon generik.
- R-06 PASS: tipografi Plus Jakarta Sans untuk input dan Instrument Serif untuk judul mengikuti gaya Takaran.
- R-07 PASS: tidak ada pola latar.
- R-08 PASS: tidak ada panah dekoratif.
- R-09 PASS: tidak ada badge.
- R-10 PASS: tidak ada glassmorphism.
- R-12 PASS: kartu daftar datar; tombol tambah menempel di bawah tanpa bayangan agar sesuai sistem elevasi DESIGN.
- R-13 PASS: tidak ada glow.
- R-14 PASS: layar tidak memakai susunan kartu fitur.
- R-19 PASS: tidak ada animasi tambahan.
- R-22 PASS: motif rak bahan yang ada mengingatkan pengguna pada tempat menyimpan stok bahan.

### Liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 mengikuti DESIGN.md bagian 2.
- Konsistensi PASS: satu kolom daftar bahan menekankan nama, takaran kemasan, dan harga per satuan.
- Focal point PASS: judul Bahan dan daftar yang dapat diedit menjadi fokus layar.
- Whitespace PASS: jarak antarbahan membedakan kelompok tanpa kartu tambahan.
- Accent PASS: karamel menandai tombol aksi dan harga per satuan.
- Identity motif PASS: motif rak bahan dan serif buku resep tetap mengikat layar ke Takaran.
- Design Read PASS: arahan hangat, praktis untuk HP, dan berfokus pada pencatatan bahan di DESIGN.md diterapkan.

### Craftsmanship & Quality Locks

- C-1 PASS: dialog sheet memakai elemen `<dialog>` bawaan agar tetap modal tanpa menambah dependensi.
- C-2 PASS: setiap kontrol pada layar bahan memiliki perilaku yang diuji.
- C-3 PASS: layar hanya memuat pencarian, daftar, dan form yang dibutuhkan F5/F6.
- C-4 PASS: validasi, migrasi, tema, breakpoint, sentuh, keyboard, dan axe diuji.
- C-5 PASS: tidak ada klaim/testimoni rekaan.
- R-05 PASS: layar memakai daftar kerja, bukan komposisi landing atau kartu berulang.
- R-11 PASS: input, baris, dan dialog mengikuti radius token yang sudah ada.
- R-15 PASS: tombol menyebut aksi khusus seperti "Tambah bahan" dan "Simpan harga".
- R-16 PASS: copy tidak memakai buzzword pemasaran.
- R-20 PASS: istilah dapur, harga per gram, dan motif rak memberi konteks produk.
- R-21 PASS: layar lolos di mode terang dan gelap.
- R-29 PASS: warna diambil dari token Takaran.
- R-30 PASS: layout mengikuti DESIGN.md Takaran.
- R-31 PASS: daftar, bottom sheet, dan aksen karamel melayani pencatatan bahan dan kerja satu tangan.
