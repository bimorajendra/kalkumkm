# RFC-002: Mesin Hitung HPP

## Ringkasan
Membangun `packages/calc`: semua rumus CR-01 s.d. CR-10, harga per saluran, total penawaran, deteksi siklus, dan hitung ulang semua resep. Paket murni tanpa UI atau browser, menjadi sumber kebenaran angka untuk aplikasi dan landing.

**Kompleksitas**: High
**Fitur**: F1 (Mesin hitung HPP)
**Dibangun di atas**: RFC-001
**Dibutuhkan oleh**: RFC-003, RFC-004, RFC-006, RFC-007 (dan secara tidak langsung semua RFC yang menampilkan angka)

## Pendekatan Teknis

### File
```
packages/calc/src/types.ts
packages/calc/src/errors.ts
packages/calc/src/units.ts
packages/calc/src/unit-price.ts
packages/calc/src/recipe-cost.ts
packages/calc/src/pricing.ts
packages/calc/src/profit.ts
packages/calc/src/quote.ts
packages/calc/src/graph.ts
packages/calc/src/recalc.ts
packages/calc/src/index.ts
packages/calc/test/brownies.test.ts
packages/calc/test/pricing.property.test.ts
packages/calc/test/graph.test.ts
packages/calc/test/units.test.ts
packages/calc/bench/recalc.bench.ts
```

### Tipe
```ts
type BaseUnit = 'g' | 'ml' | 'pcs';
type Unit = 'g' | 'kg' | 'ml' | 'l' | 'butir' | 'pcs' | 'bungkus' | string; // string = satuan custom
interface CustomUnit { name: string; qty: number; base: BaseUnit }        // "1 bungkus = 250 g"
interface Ingredient { id: string; name: string; buyPrice: number; packSize: number;
  buyUnit: Unit; customUnits: CustomUnit[] }
interface RecipeItem { refType: 'ingredient' | 'recipe'; refId: string; quantity: number; unit: Unit }
interface Recipe { id: string; name: string; yieldPortions: number; items: RecipeItem[];
  packagingPerPortion: number; energyPerBatch: number; laborMinutesPerBatch: number;
  laborRatePerHour: number | null; targetMarginBp: number; currentPrice: number | null;
  isSubRecipe: boolean; subRecipeYield: { qty: number; unit: Unit } | null }
interface Channel { id: string; name: string; kind: 'commission' | 'discount'; rateBp: number }
interface CalcContext { ingredients: Map<string, Ingredient>; recipes: Map<string, Recipe>; roundingStep: number }
```
`laborMinutesPerBatch` memakai menit bilangan bulat agar tidak ada float (RU-11); konversi ke jam dilakukan dengan `Big`.

### Satuan
- `kg` = 1000 `g`, `l` = 1000 `ml`, `butir` = 1 `pcs`.
- `bungkus` dan satuan custom lain harus didefinisikan di `customUnits` bahan; jika tidak, `CalcError('UNIT_UNDEFINED')`.
- Takaran resep dan satuan beli harus berdimensi sama; jika tidak, `CalcError('UNIT_MISMATCH')`.

### Fungsi publik
```ts
unitPrice(ing): Big                                             // CR-01, rupiah per satuan dasar
batchCost(recipe, ctx): Big                                     // CR-02, CR-03, CR-09, CR-10
hppPerPortion(recipe, ctx): Big                                 // CR-04
breakdown(recipe, ctx): CostBreakdown                           // per porsi: ingredients, subRecipes, energy, labor, packaging, hpp
suggestPrice(hpp, marginBp, commissionBp, roundingStep): number // CR-05, pembulatan ke atas
actualMarginBp(price, hpp, commissionBp): number                // CR-06, dibulatkan ke bp terdekat
markupBp(price, hpp): number                                    // CR-07
profitPerHour(price, hpp, commissionBp, portions, laborMinutes): Big | null  // CR-08; null jika menit 0
priceForChannel(hpp, marginBp, retailPrice, channel, roundingStep): { price: number; marginBp: number }
quoteTotals(hpp, pricePerPortion, portions, options[]): { price: number; cost: Big; profit: Big }
findCycles(recipes): string[][]                                 // CR-09
recalcAll(ctx): Map<string, RecipeResult | CalcError>
```

### Aturan bisnis
- `suggestPrice` menolak `marginBp + commissionBp >= 10000` dengan `CalcError('MARGIN_TOO_HIGH')`.
- `priceForChannel`: saluran `commission` memakai `suggestPrice(hpp, marginBp, rateBp)`. Saluran `discount` memakai `retailPrice × (1 − rateBp/10000)` dibulatkan ke bawah ke `roundingStep`, lalu melaporkan margin aktualnya (bisa di bawah target).
- `quoteTotals`: harga = `pricePerPortion × portions + Σ option.priceAdd`; biaya = `hpp × portions + Σ option.costAdd`.
- Tenaga (CR-10): jika `laborRatePerHour` null, biaya tenaga 0.
- Sub-resep: harga per satuan dasar = `batchCost(sub) ÷ subRecipeYield` (dalam satuan dasar). Sub-resep tanpa `subRecipeYield` memicu `CalcError('INVALID_YIELD')`.
- `recalcAll` mengurutkan resep secara topologis, menghitung sekali per resep, dan menyimpan error per resep tanpa menghentikan resep lain.

### Pseudocode `findCycles`
DFS dengan status putih/abu/hitam pada graf resep ke sub-resep; setiap tepi ke node abu menghasilkan satu siklus.

## Edge Case
- `yieldPortions` 0 atau negatif: `INVALID_YIELD`.
- Referensi ke bahan atau resep yang sudah dihapus: `MISSING_REF` dengan id-nya.
- Harga sangat besar (Rp 100 juta) dan takaran sangat kecil (0,1 g): tetap presisi dengan `Big`.

## Aturan Terkait
RU-05, RU-11 s.d. RU-13, RU-45, RU-47, RU-54.

## Testing
- `brownies.test.ts`: contoh PRD bagian 7 sebagai test tetap.
- `pricing.property.test.ts`: untuk semua `hpp > 0`, `m + c < 10000`, `step ∈ {100, 500, 1000}`, `actualMarginBp(suggestPrice(...)) >= m`.
- `graph.test.ts`: A ke B ke A terdeteksi; rantai tanpa siklus lolos.
- `units.test.ts`: konversi kg, l, butir, satuan custom, dan error dimensi.
- `recalc.bench.ts`: 100 resep dengan 10 bahan dan 1 tingkat sub-resep.

## Acceptance Criteria
- [x] Semua file di bagian Struktur ada dan hanya `index.ts` yang menjadi titik ekspor publik
- [x] Paket tidak mengimpor React, Dexie, DOM, atau API browser (dicek dengan lint rule atau test impor)
- [x] Bahan brownies menghasilkan total Rp 27.800 dan HPP per potong tepat Rp 2.925
- [x] `suggestPrice` dengan margin 4000 bp dan pembulatan 500 menghasilkan Rp 5.000; `actualMarginBp` 4150; `markupBp` 7094
- [x] Harga ojol (komisi 2000 bp) Rp 7.500 dengan margin bersih 4100 bp
- [x] `profitPerHour` untuk 90 menit menghasilkan 22.133 setelah dibulatkan; mengembalikan `null` untuk 0 menit
- [x] Setelah telur menjadi Rp 2.600, HPP Rp 3.075 dan margin pada Rp 5.000 adalah 3850 bp
- [x] HPP Rp 3.000 dengan harga Rp 4.200 menghasilkan margin 2857 bp dan markup 4000 bp (contoh edukasi)
- [x] `MARGIN_TOO_HIGH`, `UNIT_MISMATCH`, `UNIT_UNDEFINED`, `MISSING_REF`, `INVALID_YIELD`, dan `CYCLE` masing-masing punya test
- [x] `priceForChannel` dan `quoteTotals` punya test untuk kedua jenis saluran dan untuk penawaran dengan dan tanpa opsi
- [x] Property test margin lulus dengan minimal 1.000 kasus
- [x] `findCycles` mendeteksi siklus langsung dan tidak langsung
- [x] `recalcAll` untuk 100 resep < 200 ms dengan estimasi empat kali waktu pengukuran (benchmark)
- [x] Cakupan baris paket ≥ 95%
