# RFC-016: Gambar Daftar Harga untuk Dibagikan

## Ringkasan
Membuat gambar daftar harga menu untuk status WhatsApp dan Instagram, dengan tanda kecil "dihitung dengan Takaran" di versi gratis. Ini jalur distribusi organik (BG-3).

**Kompleksitas**: Medium
**Fitur**: F30 (Gambar daftar harga), F31 (Tanda "dihitung dengan Takaran")
**Dibangun di atas**: RFC-004 (pengukuran `?ref=share` di landing), RFC-008, RFC-011, RFC-015 (penggambar PNG)
**Dibutuhkan oleh**: RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/features/share/price-list-image.tsx     # template SVG, dua format
apps/app/src/features/share/price-list-builder.tsx   # pilih menu, format, pratinjau
apps/app/src/features/share/copy.ts
apps/app/src/routes/bagikan.tsx                      # /bagikan
e2e/share.spec.ts
```

### Perilaku
- Tombol "Buat gambar daftar harga" di `ResultCard` (RFC-008) kini tampil dan membuka `/bagikan` dengan resep aktif sudah terpilih.
- `PriceListBuilder`: centang menu yang dimasukkan (default semua), pilih format 1080×1920 (status) atau 1080×1080 (feed), pratinjau langsung.
- Harga per menu: `currentPrice` jika ada, jika tidak harga saran Langsung.
- `PriceListImage` (DESIGN 9.10): latar `--bg`, judul serif nama usaha, daftar menu dan harga, satu `IsometricGlyph` sebagai motif sudut. **Tidak** menampilkan HPP, margin, atau untung.
- Versi gratis: baris "dihitung dengan Takaran · <domain>" di bawah (setara 13 px, `--ink-muted`). Versi Pro: tanpa baris itu.
- "Bagikan" menggambar lewat `render-png.ts` lalu `navigator.share({ files, text })` dengan teks berisi `https://<domain>/?ref=share`. Jika Web Share file tidak didukung, unduh PNG dan tampilkan tautan untuk disalin.
- Nama usaha diminta jika kosong.
- `share_image_created` terkirim dengan `format`.

## Edge Case
- Lebih dari 12 menu dipilih pada format 1080×1080: ukuran teks mengecil sampai batas 28 px setara; jika masih tidak muat, pengguna diminta mengurangi menu.
- Nama menu sangat panjang: dipotong dengan elipsis di gambar.

## Aturan Terkait
RU-25, RU-26, RU-27, RU-38, RU-58.

## Testing
- `share.spec.ts`: tombol di kartu hasil membuka `/bagikan`; pratinjau kedua format; PNG berukuran benar; versi gratis memuat tanda dan versi Pro tidak; gambar tidak memuat kata "HPP", "margin", atau "untung"; cadangan unduhan saat Web Share tidak tersedia; event terkirim.

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] Tombol "Buat gambar daftar harga" tampil di `ResultCard` dan membuka `/bagikan` dengan resep aktif terpilih
- [ ] Pengguna bisa memilih menu dan format 1080×1920 atau 1080×1080 dengan pratinjau langsung
- [ ] Harga memakai `currentPrice` atau harga saran Langsung
- [ ] Gambar berisi nama usaha dan daftar harga, tanpa HPP, margin, atau untung
- [ ] Versi gratis memuat tanda "dihitung dengan Takaran"; versi Pro tidak
- [ ] Bagikan memakai Web Share dengan teks berisi `https://<domain>/?ref=share`, dengan cadangan unduhan dan tautan salin
- [ ] Nama usaha diminta jika kosong
- [ ] Menu terlalu banyak untuk format 1080×1080 ditangani sesuai Edge Case
- [ ] `share_image_created` terkirim dengan `format`
- [ ] `share.spec.ts` lulus; axe tanpa pelanggaran serius
