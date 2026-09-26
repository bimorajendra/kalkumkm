# RFC-013: Resep Lanjutan

## Ringkasan
Mempercepat pengisian dan memperluas resep: daftar bahan umum sebagai titik awal, sub-resep (adonan dasar, isian, topping), dan duplikasi resep.

**Kompleksitas**: High
**Fitur**: F24 (Daftar bahan umum), F25 (Sub-resep), F26 (Duplikasi resep)
**Dibangun di atas**: RFC-006, RFC-007, RFC-009, RFC-011
**Dibutuhkan oleh**: RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/features/ingredients/common-ingredients.ts     # daftar tanpa harga
apps/app/src/features/ingredients/components/common-ingredient-picker.tsx
apps/app/src/features/recipes/components/sub-recipe-settings.tsx
apps/app/src/features/recipes/components/ingredient-or-recipe-picker.tsx
apps/app/src/features/recipes/duplicate.ts
apps/app/src/features/recipes/sub-recipe.test.ts
e2e/recipes-advanced.spec.ts
```

### Daftar bahan umum (F24)
- Sekitar 30 bahan kue dan masakan rumahan (tepung terigu, gula pasir, telur, mentega, margarin, cokelat masak, susu cair, keju, dll.) dengan satuan beli bawaan. **Tanpa harga**: harga selalu diisi pengguna.
- Saat mengetik nama di `IngredientForm`, saran dari daftar muncul; memilih saran mengisi nama dan satuan.

### Sub-resep (F25, Pro)
- `SubRecipeSettings` di editor: toggle "Pakai sebagai bahan di resep lain" dan isian hasil (jumlah + satuan, misal 800 g).
- `IngredientOrRecipePicker` menggantikan pemilih bahan di editor resep, menampilkan bahan dan sub-resep dalam dua kelompok berlabel.
- Sebelum menyimpan, `findCycles` dijalankan pada resep baru; siklus ditolak dengan "Adonan dasar tidak bisa memakai dirinya sendiri."
- Menghapus sub-resep yang dipakai resep lain ditolak dengan pesan berisi jumlah resep pemakai.
- Alarm margin (RFC-009) ikut memperhitungkan resep yang memakai bahan lewat sub-resep.
- Pengguna gratis yang menyalakan toggle mendapat `PaywallSheet` dengan `trigger: 'sub_recipe'`.

### Duplikasi (F26)
- Tombol "Duplikat" di detail resep membuat salinan mendalam (item baru, ULID baru) bernama "<nama> (salinan)"; `currentPrice` tidak ikut disalin.
- Menghormati `assertCanCreate('recipe')`.

## Edge Case
- Sub-resep bertingkat dua (isian memakai adonan dasar): didukung; urutan hitung dari `recalcAll`.
- Mengubah dimensi hasil sub-resep (g ke pcs) saat sudah dipakai: ditolak seperti perubahan satuan bahan di RFC-006.

## Aturan Terkait
RU-05, RU-07, RU-17, RU-18, RU-43.

## Testing
- `sub-recipe.test.ts`: HPP resep dengan sub-resep sama dengan hitung manual; siklus ditolak; hapus sub-resep terpakai ditolak; alarm terpicu lewat sub-resep.
- `recipes-advanced.spec.ts`: saran bahan umum; buat adonan dasar dan pakai di dua resep; ubah harga mentega dan lihat kedua resep berubah; duplikasi; paywall untuk pengguna gratis.

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] Daftar bahan umum memberi saran nama dan satuan tanpa harga
- [ ] Resep bisa ditandai sebagai sub-resep dengan hasil jumlah + satuan, dan dipilih sebagai bahan di resep lain
- [ ] Pemilih menampilkan bahan dan sub-resep dalam dua kelompok berlabel
- [ ] Perubahan harga bahan mengalir ke semua resep yang memakainya lewat sub-resep
- [ ] Siklus ditolak dengan pesan "Adonan dasar tidak bisa memakai dirinya sendiri."
- [ ] Hapus sub-resep yang dipakai dan perubahan dimensi hasilnya ditolak dengan pesan jelas
- [ ] Alarm margin memperhitungkan resep yang terdampak lewat sub-resep
- [ ] Sub-resep adalah fitur Pro; pengguna gratis melihat paywall dengan `trigger: 'sub_recipe'`
- [ ] Duplikat membuat salinan mendalam bernama "(salinan)" tanpa `currentPrice` dan menghormati batas gratis
- [ ] `sub-recipe.test.ts` dan `recipes-advanced.spec.ts` lulus; axe tanpa pelanggaran serius
