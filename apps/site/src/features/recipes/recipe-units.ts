import { unitFactor } from '@takaran/calc';
import type { IngredientRow, RecipeRow } from '@/domain/types';
import type { RecipeFormValues } from './schema';

export const commonUnits = ['g', 'kg', 'ml', 'l', 'butir', 'pcs'];

/** Satuan yang boleh dipakai satu baris harus satu dimensi dengan bahannya. */
export function unitsFor(
  item: RecipeFormValues['items'][number],
  ingredients: IngredientRow[],
  recipes: RecipeRow[],
): string[] {
  const ingredient =
    item.refType === 'ingredient'
      ? ingredients.find((row) => row.id === item.refId)
      : undefined;
  const subRecipe =
    item.refType === 'recipe'
      ? recipes.find((row) => row.id === item.refId)
      : undefined;
  const unit = ingredient?.buyUnit ?? subRecipe?.subRecipeYield?.unit;
  if (!unit) return [];
  const customUnits = ingredient?.customUnits ?? [];
  let dimension: string;
  try {
    dimension = unitFactor(unit, customUnits).base;
  } catch {
    return [unit];
  }
  return [
    ...new Set([...commonUnits, ...customUnits.map((row) => row.name)]),
  ].filter((candidate) => {
    try {
      return unitFactor(candidate, customUnits).base === dimension;
    } catch {
      return false;
    }
  });
}
