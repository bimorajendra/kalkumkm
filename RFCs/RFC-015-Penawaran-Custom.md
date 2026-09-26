# RFC-015: Penawaran Pesanan Custom

## Ringkasan
Layar Penawaran: pilih resep dasar, jumlah porsi, dan opsi tambahan (ukuran, tulisan, topper, tema), lalu lihat total harga dan untung dan unduh gambar penawaran untuk dikirim ke pelanggan. Termasuk penggambar PNG yang dipakai ulang oleh RFC-016.

**Kompleksitas**: Medium
**Fitur**: F28 (Penawaran harga custom), F29 (Ekspor penawaran sebagai gambar)
**Dibangun di atas**: RFC-008, RFC-011
**Dibutuhkan oleh**: RFC-016 (penggambar PNG), RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/features/share/render-png.ts          # SVG ke canvas ke PNG Blob, menunggu document.fonts.ready
apps/app/src/features/share/share-or-download.ts   # Web Share files, cadangan unduhan
apps/app/src/features/quote/repository.ts          # quoteOptions per resep
apps/app/src/features/quote/schema.ts
apps/app/src/features/quote/copy.ts
apps/app/src/features/quote/components/quote-builder.tsx
apps/app/src/features/quote/components/quote-option-form.tsx
apps/app/src/features/quote/components/quote-image.tsx     # template SVG penawaran
apps/app/src/routes/penawaran.tsx
apps/app/src/features/quote/repository.test.ts
e2e/quote.spec.ts
```

### Perhitungan
`quoteTotals` dari RFC-002: harga = harga saran per porsi (saluran Langsung) × jumlah porsi + Σ tambahan harga opsi; biaya = HPP × porsi + Σ tambahan biaya opsi; untung = harga − biaya.

### Perilaku
- Route `/penawaran` ditambahkan ke navbar desktop dan ke menu Lainnya di HP.
- Fitur Pro: pengguna gratis yang membuka `/penawaran` melihat `PaywallSheet` dengan `trigger: 'quote'` dan penjelasan fitur.
- `QuoteBuilder` (DESIGN 10.4): kiri resep dasar, jumlah porsi (default `yieldPortions`), daftar opsi dengan checkbox; kanan pratinjau `QuoteImage` dengan nama usaha, rincian opsi terpilih, total, dan tanggal.
- Opsi (`QuoteOption { id, recipeId, name, priceAdd, costAdd }`) bisa ditambah, diubah, dihapus; tersimpan per resep.
- Untung penawaran tampil di layar tetapi **tidak** di gambar.
- "Unduh gambar penawaran" menggambar `QuoteImage` ke PNG 1080×1350 lewat `render-png.ts`, lalu `share-or-download.ts`.
- Jika `businessName` kosong, pengguna diminta mengisinya sebelum mengunduh.
- PDF tidak dibangun di RFC ini (menunggu PRD open question 6).

## Edge Case
- Opsi dengan tambahan biaya lebih besar dari tambahan harga: untung turun; ditampilkan apa adanya dengan status.
- Font belum termuat saat menggambar: `render-png` menunggu `document.fonts.ready`, maksimal 3 detik, lalu memakai font cadangan.

## Aturan Terkait
RU-05, RU-07, RU-13, RU-14, RU-25, RU-53, RU-58.

## Testing
- `repository.test.ts`: CRUD opsi, validasi (nama 1 s.d. 40 karakter, tambahan bilangan bulat ≥ 0).
- `quote.spec.ts` (J-3): pengguna Pro memilih brownies, 16 porsi, mencentang "Tulisan nama" dan "Topper", total sesuai `quoteTotals`, unduh PNG berukuran 1080×1350 berisi nama usaha dan tanpa angka untung; pengguna gratis melihat paywall.

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] `/penawaran` tampil di navbar desktop dan di menu Lainnya di HP
- [ ] Pengguna gratis melihat paywall dengan `trigger: 'quote'`
- [ ] Opsi penawaran bisa ditambah, diubah, dihapus, dan tersimpan per resep dengan validasi
- [ ] Total harga dan untung dihitung dengan `quoteTotals` dan berubah saat opsi atau porsi berubah
- [ ] Pratinjau menampilkan nama usaha, opsi terpilih, total, dan tanggal, tanpa angka untung
- [ ] "Unduh gambar penawaran" menghasilkan PNG 1080×1350 lewat Web Share atau unduhan
- [ ] Nama usaha diminta jika masih kosong
- [ ] `render-png.ts` menunggu font dengan batas 3 detik
- [ ] PDF tidak dibangun
- [ ] `repository.test.ts` dan `quote.spec.ts` lulus; axe tanpa pelanggaran serius
