import Big from 'big.js';
import { CalcError } from './errors';
import type {
  CalcContext,
  CostBreakdown,
  Ingredient,
  Recipe,
  RecipeResult,
} from './types';
import { unitPrice } from './unit-price';
import { toBaseUnits } from './units';

export interface BatchParts {
  ingredients: Big;
  subRecipes: Big;
  energy: Big;
  labor: Big;
}
export type BatchCache = Map<string, { cost: Big; parts: BatchParts }>;
const zeroParts = (): BatchParts => ({
  ingredients: new Big(0),
  subRecipes: new Big(0),
  energy: new Big(0),
  labor: new Big(0),
});

function assertYield(recipe: Recipe): void {
  if (
    !Number.isSafeInteger(recipe.yieldPortions) ||
    recipe.yieldPortions <= 0
  ) {
    throw new CalcError(
      'INVALID_YIELD',
      'Hasil adonan harus berupa bilangan bulat lebih dari 0.',
      { recipeId: recipe.id },
    );
  }
}
function assertMoney(value: number, label: string, recipeId: string): Big {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new CalcError(
      'INVALID_INPUT',
      `${label} harus berupa rupiah bulat dan tidak negatif.`,
      { recipeId },
    );
  return new Big(String(value));
}
function ingredientCost(
  item: Recipe['items'][number],
  ingredient: Ingredient,
): Big {
  const packUnit = toBaseUnits(1, ingredient.buyUnit, ingredient.customUnits);
  const useQuantity = toBaseUnits(
    item.quantity,
    item.unit,
    ingredient.customUnits,
  );
  if (packUnit.unit !== useQuantity.unit) {
    throw new CalcError(
      'UNIT_MISMATCH',
      `Satuan ${item.unit} tidak cocok dengan bahan ${ingredient.name}.`,
      { ingredientId: ingredient.id, unit: item.unit },
    );
  }
  return unitPrice(ingredient).times(useQuantity.quantity);
}
function calculateBatch(
  recipe: Recipe,
  context: CalcContext,
  visiting: Set<string>,
  cache: BatchCache,
): { cost: Big; parts: BatchParts } {
  assertYield(recipe);
  const cached = cache.get(recipe.id);
  if (cached) return cached;
  if (visiting.has(recipe.id))
    throw new CalcError('CYCLE', 'Resep memiliki referensi melingkar.', {
      recipeId: recipe.id,
    });
  visiting.add(recipe.id);
  try {
    const parts = zeroParts();
    for (const item of recipe.items) {
      if (item.refType === 'ingredient') {
        const ingredient = context.ingredients.get(item.refId);
        if (!ingredient)
          throw new CalcError(
            'MISSING_REF',
            `Bahan ${item.refId} tidak ditemukan.`,
            { id: item.refId },
          );
        parts.ingredients = parts.ingredients.plus(
          ingredientCost(item, ingredient),
        );
        continue;
      }
      const sub = context.recipes.get(item.refId);
      if (!sub)
        throw new CalcError(
          'MISSING_REF',
          `Resep ${item.refId} tidak ditemukan.`,
          { id: item.refId },
        );
      if (!sub.subRecipeYield)
        throw new CalcError(
          'INVALID_YIELD',
          `Hasil sub-resep ${sub.name} belum diisi.`,
          { recipeId: sub.id },
        );
      const made = calculateBatch(sub, context, visiting, cache);
      const yieldQuantity = toBaseUnits(
        sub.subRecipeYield.qty,
        sub.subRecipeYield.unit,
      );
      const usedQuantity = toBaseUnits(item.quantity, item.unit);
      if (yieldQuantity.unit !== usedQuantity.unit) {
        throw new CalcError(
          'UNIT_MISMATCH',
          `Satuan ${item.unit} tidak cocok dengan hasil sub-resep ${sub.name}.`,
          { recipeId: sub.id, unit: item.unit },
        );
      }
      if (yieldQuantity.quantity.lte(0))
        throw new CalcError(
          'INVALID_YIELD',
          `Hasil sub-resep ${sub.name} harus lebih dari 0.`,
          { recipeId: sub.id },
        );
      parts.subRecipes = parts.subRecipes.plus(
        made.cost.div(yieldQuantity.quantity).times(usedQuantity.quantity),
      );
    }
    parts.energy = assertMoney(
      recipe.energyPerBatch,
      'Biaya energi',
      recipe.id,
    );
    if (recipe.laborRatePerHour !== null) {
      if (
        !Number.isSafeInteger(recipe.laborRatePerHour) ||
        recipe.laborRatePerHour < 0 ||
        !Number.isSafeInteger(recipe.laborMinutesPerBatch) ||
        recipe.laborMinutesPerBatch < 0
      ) {
        throw new CalcError(
          'INVALID_INPUT',
          'Upah dan waktu tenaga harus bilangan bulat non-negatif.',
          { recipeId: recipe.id },
        );
      }
      parts.labor = new Big(String(recipe.laborRatePerHour))
        .times(recipe.laborMinutesPerBatch)
        .div(60);
    }
    const result = {
      cost: parts.ingredients
        .plus(parts.subRecipes)
        .plus(parts.energy)
        .plus(parts.labor),
      parts,
    };
    cache.set(recipe.id, result);
    return result;
  } finally {
    visiting.delete(recipe.id);
  }
}

export function calculateRecipeResult(
  recipe: Recipe,
  context: CalcContext,
  cache: BatchCache,
): RecipeResult {
  const { cost: batchCostValue, parts } = calculateBatch(
    recipe,
    context,
    new Set(),
    cache,
  );
  const portions = new Big(String(recipe.yieldPortions));
  const packaging = assertMoney(
    recipe.packagingPerPortion,
    'Biaya kemasan',
    recipe.id,
  );
  const itemBreakdown: CostBreakdown = {
    ingredients: parts.ingredients.div(portions),
    subRecipes: parts.subRecipes.div(portions),
    energy: parts.energy.div(portions),
    labor: parts.labor.div(portions),
    packaging,
    hpp: batchCostValue.div(portions).plus(packaging),
  };
  return {
    batchCost: batchCostValue,
    breakdown: itemBreakdown,
    hpp: itemBreakdown.hpp,
  };
}

export function batchCost(recipe: Recipe, context: CalcContext): Big {
  return calculateBatch(recipe, context, new Set(), new Map()).cost;
}
export function breakdown(recipe: Recipe, context: CalcContext): CostBreakdown {
  return calculateRecipeResult(recipe, context, new Map()).breakdown;
}
export function hppPerPortion(recipe: Recipe, context: CalcContext): Big {
  return calculateRecipeResult(recipe, context, new Map()).hpp;
}
