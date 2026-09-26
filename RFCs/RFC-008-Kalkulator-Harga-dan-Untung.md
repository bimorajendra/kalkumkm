# RFC-008: Kalkulator Harga dan Untung

## Ringkasan
Layar utama aplikasi (`/`), mengikuti DESIGN 10.1: pilih resep, atur target untung dan jam kerja dengan slider bertitik, lihat harga saran, margin dan markup, untung per jam, dan margin aktual dari harga yang sedang dipakai.

**Kompleksitas**: Medium
**Fitur**: F10 (Slider target margin), F12 (Margin dan markup), F13 (Untung per jam), F14 (Margin aktual)
**Dibangun di atas**: RFC-003, RFC-007
**Dibutuhkan oleh**: RFC-009, RFC-014, RFC-015, RFC-016, RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/features/pricing/copy.ts
apps/app/src/features/pricing/use-calculator.ts       # state slider + simpan tertunda
apps/app/src/features/pricing/components/recipe-picker.tsx
apps/app/src/features/pricing/components/slider-panel.tsx
apps/app/src/features/pricing/components/margin-note.tsx
apps/app/src/features/pricing/components/current-price-input.tsx
apps/app/src/features/pricing/components/calculator-result.tsx
apps/app/src/features/pricing/use-calculator.test.ts
apps/app/src/routes/hitung.tsx
e2e/calculator.spec.ts
```

### Perilaku
- Route `/` membuka resep `lastRecipeId`, atau resep pertama, atau state kosong RFC-007 jika belum ada resep.
- `RecipePicker`: chip DESIGN 9.3 berisi nama resep dan jumlah porsi; ketuk membuka daftar resep.
- `SliderPanel`:
  - Target untung: titik 10% s.d. 70%, `allowCustom` (1% s.d. 90%, dengan syarat margin + komisi < 100%).
  - Jam kerja per adonan: 0,5 / 1 / 1,5 / 2 / 3 / 4 jam, `allowCustom` dalam menit.
  - Slider saluran **tidak** ditampilkan di RFC ini (ditambahkan RFC-014). Komisi dianggap 0.
- Perubahan slider disimpan ke resep (`targetMarginBp`, `laborMinutesPerBatch`) dengan jeda 300 ms.
- `CalculatorResult` memakai `ResultCard`:
  - Angka utama: harga saran per porsi (CR-05) dengan label "harga jual per potong".
  - Angka kedua: untung per jam (CR-08) dengan label "untungmu setelah X jam kerja". Jika upah tenaga kosong, catatan "Ini upah yang sebenarnya kamu terima per jam." Jika jam kerja 0, angka kedua disembunyikan.
  - Pita: "Margin X · markup Y".
  - `IsometricStack` dari `breakdown()` ditambah lempeng untung.
  - Aksi: "Simpan harga ini" (mengisi `currentPrice` dengan harga saran, lalu konfirmasi "Harga disimpan"). Tombol "Buat gambar daftar harga" **belum** tampil (RFC-016).
- `MarginNote`: `NoteBox` berisi penjelasan margin vs markup dengan angka resep yang dibuka, misalnya "Markup 70,9% artinya harga jual 70,9% di atas modal. Margin 41,5% artinya dari setiap Rp 5.000 yang kamu terima, Rp 2.075 adalah untung."
- `CurrentPriceInput`: "Harga yang kamu pakai sekarang"; menampilkan margin aktual (CR-06) dan status "Di atas target" / "Di bawah target X%" / "Rugi Rp X per potong".
- Tata letak: dua kolom ≥ 1024 px; satu kolom di bawahnya. Di < 640 px, `ResultCard compact` menempel di atas tab bar; "Detail" membuka sheet Vaul berisi kartu penuh (tutup dengan `Escape` atau geser turun).
- Error hitung (misal `MARGIN_TOO_HIGH`): kartu hasil diganti pesan yang menjelaskan cara memperbaikinya.

## Edge Case
- Resep yang sedang dibuka dihapus di tab lain: layar kembali ke state kosong atau resep lain.
- HPP 0 (semua biaya 0): harga saran Rp 0 dan pesan "Isi bahan atau biaya dulu".

## Aturan Terkait
RU-05, RU-08, RU-13, RU-14, RU-26 (tanpa tombol mati), RU-34, RU-35, RU-40 s.d. RU-44.

## Testing
- `use-calculator.test.ts`: simpan tertunda, batas margin + komisi, jam kerja 0.
- `calculator.spec.ts` (J-1 selesai): contoh brownies, target 40% menampilkan Rp 5.000, margin 41,5%, markup 70,9%; jam kerja 1,5 menampilkan sekitar Rp 22.133/jam; harga sekarang Rp 4.200 menampilkan status di bawah target; semua slider dengan keyboard; tampilan HP dengan sheet.

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] `/` membuka resep terakhir, resep pertama, atau state kosong sesuai urutan itu
- [ ] Slider target untung (10% s.d. 70%, default dari resep) mengubah harga saran secara langsung; "Ketik angka" menerima 1% s.d. 90%
- [ ] Slider jam kerja mengubah untung per jam; jam 0 menyembunyikan angka kedua
- [ ] Perubahan slider tersimpan ke resep setelah jeda 300 ms dan bertahan setelah muat ulang
- [ ] `ResultCard` menampilkan harga saran, untung per jam, pita margin dan markup, dan `IsometricStack` dengan lempeng untung
- [ ] Catatan "upah yang sebenarnya" tampil jika upah tenaga kosong
- [ ] `MarginNote` memakai angka resep yang sedang dibuka
- [ ] "Simpan harga ini" mengisi `currentPrice` dan menampilkan konfirmasi
- [ ] `CurrentPriceInput` menampilkan margin aktual dan salah satu dari tiga status dengan teks
- [ ] Slider saluran dan tombol "Buat gambar daftar harga" tidak tampil di RFC ini
- [ ] Di < 640 px, kartu ringkas menempel di atas tab bar dan "Detail" membuka sheet yang bisa ditutup dengan `Escape`
- [ ] Error hitung menampilkan pesan perbaikan, bukan angka kosong atau `NaN`
- [ ] Contoh brownies menampilkan Rp 5.000, margin 41,5%, markup 70,9%, dan Rp 22.133/jam untuk 1,5 jam
- [ ] `calculator.spec.ts` lulus di 4 lebar x 2 tema; axe tanpa pelanggaran serius
