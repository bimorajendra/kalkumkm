import Big from 'big.js';
import { CalcError } from './errors';
import { recalcAll } from './recalc';
import type { BaseUnit, CalcContext, Recipe } from './types';
import { unitPrice } from './unit-price';
import { toBaseUnits } from './units';

function ingredientUsage(
  recipe: Recipe,
  ingredientId: string,
  context: CalcContext,
  visiting = new Set<string>(),
): { quantity: Big; unit: BaseUnit } {
  if (visiting.has(recipe.id))
    throw new CalcError('CYCLE', 'Resep memiliki referensi melingkar.', {
      recipeId: recipe.id,
    });
  visiting.add(recipe.id);
  try {
    let quantity = new Big(0);
    let unit: BaseUnit | undefined;
    for (const item of recipe.items) {
      if (item.refType === 'ingredient') {
        if (item.refId !== ingredientId) continue;
        const ingredient = context.ingredients.get(ingredientId);
        if (!ingredient)
          throw new CalcError('MISSING_REF', 'Bahan tidak ditemukan.', {
            ingredientId,
          });
        const base = toBaseUnits(
          item.quantity,
          item.unit,
          ingredient.customUnits,
        );
        if (unit && unit !== base.unit)
          throw new CalcError(
            'UNIT_MISMATCH',
            `Satuan ${item.unit} tidak cocok dengan bahan ${ingredient.name}.`,
            { ingredientId, unit: item.unit },
          );
        unit = base.unit;
        quantity = quantity.plus(base.quantity);
        continue;
      }
      const subRecipe = context.recipes.get(item.refId);
      if (!subRecipe?.subRecipeYield) continue;
      const used = toBaseUnits(item.quantity, item.unit);
      const yieldQuantity = toBaseUnits(
        subRecipe.subRecipeYield.qty,
        subRecipe.subRecipeYield.unit,
      );
      if (used.unit !== yieldQuantity.unit)
        throw new CalcError(
          'UNIT_MISMATCH',
          `Satuan ${item.unit} tidak cocok dengan hasil sub-resep ${subRecipe.name}.`,
          { recipeId: subRecipe.id, unit: item.unit },
        );
      const nested = ingredientUsage(
        subRecipe,
        ingredientId,
        context,
        visiting,
      );
      if (unit && nested.unit !== unit)
        throw new CalcError(
          'UNIT_MISMATCH',
          'Satuan bahan tidak cocok pada resep bertingkat.',
          { ingredientId },
        );
      unit = nested.unit;
      quantity = quantity.plus(
        nested.quantity.times(used.quantity.div(yieldQuantity.quantity)),
      );
    }
    if (!unit) {
      const ingredient = context.ingredients.get(ingredientId);
      if (!ingredient)
        throw new CalcError('MISSING_REF', 'Bahan tidak ditemukan.', {
          ingredientId,
        });
      const pack = toBaseUnits(
        ingredient.packSize,
        ingredient.buyUnit,
        ingredient.customUnits,
      );
      unit = pack.unit;
    }
    return { quantity, unit };
  } finally {
    visiting.delete(recipe.id);
  }
}

export function simulateIngredientPriceIncrease(
  context: CalcContext,
  ingredientId: string,
  increaseBp: number,
) {
  const ingredient = context.ingredients.get(ingredientId);
  if (!ingredient)
    throw new CalcError('MISSING_REF', 'Bahan tidak ditemukan.', {
      ingredientId,
    });
  if (!Number.isSafeInteger(increaseBp) || increaseBp < 0)
    throw new CalcError(
      'INVALID_INPUT',
      'Persentase kenaikan harus bilangan bulat basis poin non-negatif.',
      { increaseBp },
    );

  const currentPrice = new Big(String(ingredient.buyPrice));
  const simulatedPrice = currentPrice
    .times(new Big(String(increaseBp)).plus(10_000))
    .div(10_000);
  const extraCostPerUnit = unitPrice(ingredient).times(increaseBp).div(10_000);
  const results = recalcAll(context);
  // Apply the delta only to affected recipes so the shared HPP path stays lean.
  for (const [recipeId, result] of results) {
    if (result instanceof CalcError) continue;
    const recipe = context.recipes.get(recipeId);
    if (!recipe) continue;
    const totalUsage = ingredientUsage(recipe, ingredientId, context);
    const directUsage = recipe.items.reduce((total, item) => {
      if (item.refType !== 'ingredient' || item.refId !== ingredientId)
        return total;
      const base = toBaseUnits(
        item.quantity,
        item.unit,
        ingredient.customUnits,
      );
      return total.plus(base.quantity);
    }, new Big(0));
    const directDelta = directUsage.times(extraCostPerUnit);
    const subRecipeDelta = totalUsage.quantity
      .minus(directUsage)
      .times(extraCostPerUnit);
    const delta = directDelta.plus(subRecipeDelta);
    const portionDelta = delta.div(recipe.yieldPortions);
    results.set(recipeId, {
      batchCost: result.batchCost.plus(delta),
      hpp: result.hpp.plus(portionDelta),
      breakdown: {
        ...result.breakdown,
        ingredients: result.breakdown.ingredients.plus(
          directDelta.div(recipe.yieldPortions),
        ),
        subRecipes: result.breakdown.subRecipes.plus(
          subRecipeDelta.div(recipe.yieldPortions),
        ),
        hpp: result.breakdown.hpp.plus(portionDelta),
      },
    });
  }
  return { currentPrice, simulatedPrice, results };
}
