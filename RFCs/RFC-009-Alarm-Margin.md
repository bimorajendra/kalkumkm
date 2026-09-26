# RFC-009: Alarm Margin

## Ringkasan
Setelah harga bahan berubah, aplikasi menandai semua menu yang untungnya turun di bawah target, menampilkan banner, dan menawarkan harga baru per menu.

**Kompleksitas**: Medium
**Fitur**: F11 (Alarm margin)
**Dibangun di atas**: RFC-003, RFC-006, RFC-008
**Dibutuhkan oleh**: RFC-013, RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/features/margin-alarm/evaluate.ts        # fungsi murni: resep terdampak
apps/app/src/features/margin-alarm/repository.ts      # baca/tulis settings.marginAlarm
apps/app/src/features/margin-alarm/copy.ts
apps/app/src/features/margin-alarm/components/margin-alarm-banner.tsx
apps/app/src/features/margin-alarm/components/affected-recipe-list.tsx
apps/app/src/features/margin-alarm/evaluate.test.ts
e2e/margin-alarm.spec.ts
```

### Definisi resep terdampak
Resep yang **punya `currentPrice`** dan margin aktualnya (CR-06, komisi 0 karena `currentPrice` adalah harga jual langsung) di bawah `targetMarginBp`, **dan** yang memakai bahan yang harganya baru berubah (langsung atau lewat sub-resep setelah RFC-013). Resep tanpa `currentPrice` tidak bisa "turun" dan tidak dimasukkan.

### Alur
1. `updatePrice` (RFC-006) memanggil `evaluateAfterPriceChange(ingredientId)` setelah transaksi selesai.
2. Hasilnya disimpan di `settings.marginAlarm = { recipeIds, triggeredBy, createdAt, dismissed: false }`, menggantikan alarm sebelumnya.
3. `MarginAlarmBanner` tampil di Bahan, Hitung, dan Resep saat `recipeIds` tidak kosong dan `dismissed` false: "N menu untungnya turun di bawah target. Lihat menu."
4. "Lihat menu" membuka `AffectedRecipeList`: per menu, harga sekarang, margin sekarang, harga saran baru, dan tombol "Pakai Rp X" yang mengisi `currentPrice`. Menu yang sudah diperbaiki hilang dari daftar.
5. Tombol tutup (atau `Escape`) mengatur `dismissed: true`. Banner muncul lagi hanya jika ada perubahan harga baru yang menghasilkan alarm.
6. `margin_alarm_shown` terkirim dengan `count_bucket` (1, 2 s.d. 5, lebih dari 5).

### Tampilan
- Banner DESIGN 9.8 (`Banner` dari `packages/ui`).
- Di daftar resep, menu terdampak diberi status "Di bawah target" (sudah ada dari RFC-007) dan ikon peringatan dengan teks.

## Edge Case
- Harga bahan turun: tidak ada alarm baru; alarm lama tetap sampai ditutup atau diperbaiki.
- Semua menu terdampak diperbaiki: banner hilang sendiri.

## Aturan Terkait
RU-05, RU-07, RU-27, RU-40, RU-43.

## Testing
- `evaluate.test.ts`: telur naik ke Rp 2.600 pada brownies dengan `currentPrice` Rp 5.000 dan target 4000 bp menghasilkan 1 resep terdampak (margin 3850 bp); resep tanpa `currentPrice` tidak masuk; harga turun tidak memicu alarm.
- `margin-alarm.spec.ts` (J-2): ubah harga telur, banner tampil, buka daftar, "Pakai Rp X", banner hilang; tutup dengan `Escape` dan tidak muncul lagi sampai perubahan berikutnya.

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] Resep terdampak dihitung sesuai definisi di atas oleh fungsi murni yang diuji
- [ ] Alarm tersimpan di `settings.marginAlarm` dan bertahan setelah muat ulang
- [ ] Banner tampil di Bahan, Hitung, dan Resep dengan jumlah menu yang benar
- [ ] Daftar terdampak menampilkan harga sekarang, margin sekarang, dan harga saran baru per menu
- [ ] "Pakai Rp X" mengisi `currentPrice` dan menghapus menu dari daftar; banner hilang saat daftar kosong
- [ ] Banner bisa ditutup dengan tombol dan `Escape`, dan tidak muncul lagi sampai ada perubahan harga baru yang memicu alarm
- [ ] Harga yang turun tidak memicu alarm
- [ ] `margin_alarm_shown` terkirim dengan `count_bucket`
- [ ] `evaluate.test.ts` dan `margin-alarm.spec.ts` lulus; axe tanpa pelanggaran serius
