# RFC-007: Resep dan HPP

## Ringkasan
Layar Resep: membuat dan mengubah resep dengan bahan, takaran, hasil per adonan, kemasan, energi, dan upah tenaga opsional, lalu menampilkan rincian HPP per porsi dengan tumpukan isometrik. Termasuk resep contoh brownies untuk pengguna baru.

**Kompleksitas**: Medium
**Fitur**: F7 (Resep), F8 (Biaya kemasan dan energi), F9 (Rincian HPP dan tumpukan isometrik)
**Dibangun di atas**: RFC-002, RFC-003, RFC-006
**Dibutuhkan oleh**: RFC-008, RFC-011, RFC-013, RFC-017

## Pendekatan Teknis

### File
```
apps/app/src/features/recipes/repository.ts
apps/app/src/features/recipes/schema.ts
apps/app/src/features/recipes/copy.ts
apps/app/src/features/recipes/seed-example.ts        # brownies PRD bagian 7
apps/app/src/features/recipes/use-recipe-results.ts  # useLiveQuery + recalcAll
apps/app/src/features/recipes/components/recipe-list.tsx
apps/app/src/features/recipes/components/recipe-editor.tsx
apps/app/src/features/recipes/components/recipe-item-row.tsx
apps/app/src/features/recipes/components/hpp-breakdown.tsx
apps/app/src/features/recipes/repository.test.ts
apps/app/src/routes/resep.tsx
apps/app/src/routes/resep-detail.tsx                 # /resep/:id
e2e/recipes.spec.ts
```

### Repository
```ts
listRecipes(): Recipe[]
getRecipe(id): Recipe
createRecipe(input): Recipe
updateRecipe(id, input): Recipe
deleteRecipe(id): void        // satu transaksi: recipes + quoteOptions milik resep
seedExample(): Recipe         // membuat 5 bahan brownies (jika belum ada) + resep
```

### Validasi
- Nama 1 s.d. 60 karakter; `yieldPortions` bilangan bulat 1 s.d. 10.000.
- Takaran > 0, satuan harus berdimensi sama dengan bahannya (pilihan satuan di `recipe-item-row` hanya menampilkan satuan yang cocok).
- Kemasan per porsi dan energi per adonan bilangan bulat ≥ 0; upah tenaga per jam opsional, bilangan bulat ≥ 0.
- Bahan yang sama tidak boleh muncul dua kali dalam satu resep.

### Hasil hitung
`useRecipeResults()` membaca bahan dan resep lewat `useLiveQuery`, menjalankan `recalcAll`, dan mengembalikan `Map<recipeId, RecipeResult | CalcError>`. Tidak ada salinan hasil di database.

### UI
- `RecipeList`: baris (bukan grid kartu) berisi nama, HPP per porsi, harga (harga sekarang jika ada, jika tidak harga saran), dan status margin dengan titik warna **dan** teks "Di atas target" / "Di bawah target". Resep dengan error menampilkan pesan error-nya.
- `RecipeEditor`: daftar bahan dengan takaran, tombol "Tambah bahan ke resep" (memilih dari daftar bahan), hasil per adonan, kemasan per porsi, energi per adonan, upah tenaga opsional dengan penjelasan CR-10.
- `HppBreakdown` di `/resep/:id`: kalimat rincian seperti DESIGN 10.1 ("(Bahan Rp 27.800 + energi Rp 3.000) ÷ 16 potong + kemasan Rp 1.000 = HPP Rp 2.925 per potong") dan `IsometricStack` dari `breakdown()`.
- State kosong: "Mulai dari satu resep. Pakai contoh brownies atau buat sendiri." dengan dua tombol ("Pakai contoh brownies", "Buat resep sendiri").
- Referensi hilang (`MISSING_REF`): baris bahan ditandai "Bahan ini sudah dihapus" dan resep tidak bisa disimpan sampai diperbaiki.
- `hpp_first_shown` terkirim saat HPP pertama kali tampil dengan `seconds_bucket` dihitung dari `firstOpenedAt`.

## Edge Case
- Resep tanpa bahan: HPP hanya dari kemasan dan energi; diizinkan, dengan catatan "Belum ada bahan".
- Menghapus resep yang sedang terakhir dibuka (`lastRecipeId`): pengaturan dikosongkan.

## Aturan Terkait
RU-05 s.d. RU-08, RU-11 s.d. RU-14, RU-17, RU-35, RU-43.

## Testing
- Repository: CRUD, validasi, hapus dalam transaksi, `seedExample` idempoten untuk bahan.
- `recipes.spec.ts` (J-1 sebagian): pengguna baru, "Pakai contoh brownies", HPP Rp 2.925 tampil di rincian dan di label tumpukan; buat resep sendiri; ubah takaran dan lihat HPP berubah.

## Acceptance Criteria
- [ ] Semua file di bagian Struktur ada
- [ ] Resep bisa dibuat, diubah, dan dihapus; hapus juga menghapus `quoteOptions` miliknya dalam satu transaksi
- [ ] Pilihan satuan takaran hanya menampilkan satuan yang berdimensi sama dengan bahannya
- [ ] Validasi menolak nama kosong, hasil ≤ 0, takaran ≤ 0, dan bahan ganda, dengan pesan di bawah field
- [ ] Kemasan per porsi, energi per adonan, dan upah tenaga opsional ikut dalam HPP sesuai CR-03, CR-04, CR-10
- [ ] "Pakai contoh brownies" menghasilkan HPP Rp 2.925 per potong
- [ ] Rincian HPP tampil dalam bentuk kalimat DESIGN 10.1 dan dijumlahkan dari nilai presisi penuh
- [ ] `IsometricStack` tampil di detail resep dengan data dari `breakdown()`
- [ ] Daftar resep menampilkan HPP, harga, dan status margin dengan teks, bukan warna saja
- [ ] Bahan yang sudah dihapus ditandai di editor dan mencegah penyimpanan
- [ ] State kosong DESIGN 11 dengan dua tombol tampil saat tidak ada resep
- [ ] `hpp_first_shown` terkirim sekali dengan `seconds_bucket`
- [ ] Test repository dan `recipes.spec.ts` lulus; axe tanpa pelanggaran serius
