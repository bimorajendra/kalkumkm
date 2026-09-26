# RFC-003: Komponen UI Bersama

## Ringkasan
Membangun komponen visual di `packages/ui` yang dipakai aplikasi dan landing: slider bertitik, kartu hasil, tumpukan isometrik, tombol, chip, kotak catatan, banner, dan formatter angka. Dibuat sebelum landing agar demo di hero dan aplikasi memakai komponen yang sama.

**Kompleksitas**: Medium
**Fitur**: Komponen bersama untuk F9, F10, F11, F12, F13, F19
**Dibangun di atas**: RFC-001, RFC-002 (tipe `CostBreakdown`)
**Dibutuhkan oleh**: RFC-004, RFC-007, RFC-008, RFC-009

## Pendekatan Teknis

### File
```
packages/ui/src/format.ts
packages/ui/src/button.tsx
packages/ui/src/chip.tsx
packages/ui/src/note-box.tsx
packages/ui/src/banner.tsx
packages/ui/src/segmented-slider.tsx
packages/ui/src/result-card.tsx
packages/ui/src/isometric-stack.tsx
packages/ui/src/isometric-glyph.tsx
packages/ui/src/use-tweened-number.ts
packages/ui/src/index.ts
apps/app/src/routes/dev-ui.tsx      # galeri komponen, hanya saat import.meta.env.DEV
e2e/ui-gallery.spec.ts
```

### Spesifikasi komponen (mengikuti DESIGN bagian 9)
- **format.ts**: `formatRupiah(n | Big)` menghasilkan `Rp 5.000`; `formatPercent(bp)` menghasilkan `41,5%`; memakai `Intl.NumberFormat('id-ID')`.
- **Button**: varian `primary` (kapsul ink), `secondary`, `card`, `link`; tinggi minimal 44 px (primary 48 px); prop `navigates` menampilkan chevron hanya untuk tombol yang membuka layar lain.
- **Chip**: latar `--peach-100`, teks `--caramel-700`, `IsometricGlyph` 16 px di kiri.
- **NoteBox**: garis `--ink-muted` 40%, radius 12 px.
- **Banner**: latar `--peach-100`, ikon `triangle-alert`, tombol tutup, `role="status"`, bisa ditutup dengan `Escape` saat fokus di dalamnya.
- **SegmentedSlider**: berbasis Radix Slider. Props: `stops` (nilai + label), `value`, `onChange`, `formatValueText`, `allowCustom`. Track 44 px dengan pemisah di tiap titik, isi `--caramel-400` 55%, thumb garis 2 px `--caramel-600` + bulatan 12 px, area sentuh 44 px. Panah pindah satu titik, `Home`/`End` ke ujung. `allowCustom` menampilkan tombol "Ketik angka" yang membuka input angka tervalidasi.
- **ResultCard**: gradasi 160° `--caramel-300` ke `--caramel-500`, radius 28 px, teks `--ink`. Slot: tab chip, angka utama (`display-num`), label, angka kedua opsional (untung per jam), pita margin/markup, `IsometricStack`, slot aksi. Varian `compact` untuk HP (harga + margin + tombol "Detail").
- **IsometricStack**: SVG isometrik 30°. Props: `layers` (`{ key, label, value }`), `profit`. Tinggi lempeng sebanding nilai terhadap total, minimum 6 px, tinggi total tetap. Lempeng non-untung memakai `--tan-100` s.d. `--tan-400`; lempeng untung `--caramel-500`. Label teks nama + rupiah di samping tiap lempeng. Untung negatif: garis putus-putus `--danger` di bawah dasar dengan label "Rugi Rp X per porsi". `role="img"` dengan `aria-label` berisi kalimat ringkasan komposisi.
- **use-tweened-number**: tween 180 ms `ease-out`; langsung jika `prefers-reduced-motion: reduce`.

## Edge Case
- Semua komponen biaya bernilai 0 kecuali bahan: lempeng lain tetap minimal 6 px agar labelnya terbaca, dengan label "Rp 0".
- Angka sangat panjang (Rp 12.500.000): `display-num` mengecil agar tidak meluap di lebar 320 px.

## Aturan Terkait
RU-10, RU-14, RU-33, RU-34, RU-39 s.d. RU-44.

## Testing
- Unit test `format.ts` dan perhitungan tinggi lempeng.
- `ui-gallery.spec.ts`: galeri dibuka di 4 lebar x 2 tema, axe tanpa pelanggaran serius, slider dioperasikan dengan keyboard, banner ditutup dengan `Escape`.

## Acceptance Criteria
- [x] Semua file di bagian Struktur ada dan diekspor dari `packages/ui/src/index.ts` (kecuali galeri)
- [x] `formatRupiah` dan `formatPercent` menghasilkan format Indonesia dan diuji
- [x] `Button` memiliki 4 varian, tinggi minimal 44 px, dan chevron hanya jika `navigates`
- [x] `SegmentedSlider` bisa dipakai dengan mouse, sentuhan, dan keyboard (panah, `Home`, `End`) dengan `aria-valuetext` dari `formatValueText`
- [x] `SegmentedSlider` dengan `allowCustom` menerima nilai di luar titik lewat input angka tervalidasi
- [x] `ResultCard` menampilkan semua slot, varian `compact`, dan teks `--ink` di atas gradasi
- [x] `IsometricStack` menggambar tinggi sebanding nilai, minimum 6 px, dengan label teks di setiap lempeng
- [x] `IsometricStack` menggambar rugi sebagai garis putus-putus `--danger` berlabel "Rugi Rp X per porsi"
- [x] `IsometricStack` punya `role="img"` dan `aria-label` ringkasan
- [x] Tween angka berjalan 180 ms dan mati saat `prefers-reduced-motion: reduce`
- [x] Galeri `/dev-ui` hanya ada di build pengembangan
- [x] `ui-gallery.spec.ts` lulus di 4 lebar x 2 tema dengan nol pelanggaran axe serius
