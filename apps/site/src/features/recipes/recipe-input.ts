import type { RecipeInput } from '@/domain/recipes';
import type { RecipeRow } from '@/domain/types';
import type { ParsedRecipeFormValues } from './schema';

/**
 * Isian formulir menjadi masukan resep. Server tetap memeriksa ulang semuanya
 * (bahan ada, satuan cocok, tanpa siklus). Saat mengubah resep, target untung
 * dan harga jual yang sudah ada dipertahankan.
 */
export function recipeInputFromForm(
  parsed: ParsedRecipeFormValues,
  defaults: { targetMarginBp: number },
  existing?: RecipeRow,
): RecipeInput {
  return {
    name: parsed.name,
    yieldPortions: parsed.yieldPortions,
    items: parsed.items.map((item) => ({ ...item })),
    packagingPerPortion: parsed.packagingPerPortion,
    energyPerBatch: parsed.energyPerBatch,
    laborMinutesPerBatch: parsed.laborMinutesPerBatch,
    laborRatePerHour: parsed.laborRatePerHour,
    targetMarginBp: existing?.targetMarginBp ?? defaults.targetMarginBp,
    currentPrice: existing?.currentPrice ?? null,
    isSubRecipe: parsed.isSubRecipe,
    subRecipeYield: parsed.isSubRecipe
      ? { qty: parsed.subRecipeYieldQty, unit: parsed.subRecipeYieldUnit }
      : null,
  };
}
