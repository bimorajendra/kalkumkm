import Big from 'big.js';
import { CalcError } from './errors';
import { profitPerPortion } from './profit';
import { hppPerPortion } from './recipe-cost';
import type {
  CalcContext,
  OrderTotals,
  Recipe,
  ShoppingListItem,
} from './types';
import { toBaseUnits } from './units';

export function calculateOrder(
  recipe: Recipe,
  portions: number,
  pricePerPortion: number,
  commissionBp: number,
  context: CalcContext,
): OrderTotals {
  if (!Number.isSafeInteger(portions) || portions <= 0)
    throw new CalcError(
      'INVALID_INPUT',
      'Jumlah pesanan harus bilangan bulat lebih dari 0.',
    );
  if (!Number.isSafeInteger(pricePerPortion) || pricePerPortion < 0)
    throw new CalcError('INVALID_INPUT', 'Harga per porsi tidak valid.');
  if (
    !Number.isSafeInteger(commissionBp) ||
    commissionBp < 0 ||
    commissionBp >= 10000
  )
    throw new CalcError('INVALID_INPUT', 'Komisi saluran tidak valid.');

  const hpp = hppPerPortion(recipe, context);
  const grossRevenue = new Big(String(pricePerPortion)).times(portions);
  const netProfitPerPortion = profitPerPortion(
    pricePerPortion,
    hpp,
    commissionBp,
  );
  return {
    portions,
    pricePerPortion,
    productionCost: hpp.times(portions),
    grossRevenue,
    commissionCost: grossRevenue.times(commissionBp).div(10_000),
    profit: netProfitPerPortion.times(portions),
  };
}

export function shoppingListForOrder(
  recipe: Recipe,
  portions: number,
  context: CalcContext,
): ShoppingListItem[] {
  if (!Number.isSafeInteger(portions) || portions <= 0)
    throw new CalcError(
      'INVALID_INPUT',
      'Jumlah pesanan harus bilangan bulat lebih dari 0.',
    );
  hppPerPortion(recipe, context);

  const requiredByIngredient = new Map<
    string,
    { quantity: Big; unit: ShoppingListItem['baseUnit'] }
  >();
  const visiting = new Set<string>();

  function addRecipeIngredients(current: Recipe, batchMultiplier: Big): void {
    if (visiting.has(current.id))
      throw new CalcError('CYCLE', 'Resep memiliki referensi melingkar.', {
        recipeId: current.id,
      });
    visiting.add(current.id);
    try {
      for (const item of current.items) {
        const scaledQuantity = new Big(String(item.quantity)).times(
          batchMultiplier,
        );
        if (item.refType === 'ingredient') {
          const ingredient = context.ingredients.get(item.refId);
          if (!ingredient)
            throw new CalcError('MISSING_REF', 'Bahan tidak ditemukan.', {
              ingredientId: item.refId,
            });
          const needed = toBaseUnits(
            scaledQuantity,
            item.unit,
            ingredient.customUnits,
          );
          const currentNeeded = requiredByIngredient.get(ingredient.id);
          if (currentNeeded && currentNeeded.unit !== needed.unit)
            throw new CalcError(
              'UNIT_MISMATCH',
              `Satuan ${item.unit} tidak cocok dengan bahan ${ingredient.name}.`,
              { ingredientId: ingredient.id, unit: item.unit },
            );
          requiredByIngredient.set(ingredient.id, {
            quantity: (currentNeeded?.quantity ?? new Big(0)).plus(
              needed.quantity,
            ),
            unit: needed.unit,
          });
          continue;
        }

        const subRecipe = context.recipes.get(item.refId);
        if (!subRecipe)
          throw new CalcError('MISSING_REF', 'Sub-resep tidak ditemukan.', {
            recipeId: item.refId,
          });
        if (!subRecipe.subRecipeYield)
          throw new CalcError(
            'INVALID_YIELD',
            `Hasil sub-resep ${subRecipe.name} belum diisi.`,
            { recipeId: subRecipe.id },
          );
        const usedQuantity = toBaseUnits(scaledQuantity, item.unit);
        const yieldQuantity = toBaseUnits(
          subRecipe.subRecipeYield.qty,
          subRecipe.subRecipeYield.unit,
        );
        if (usedQuantity.unit !== yieldQuantity.unit)
          throw new CalcError(
            'UNIT_MISMATCH',
            `Satuan ${item.unit} tidak cocok dengan hasil sub-resep ${subRecipe.name}.`,
            { recipeId: subRecipe.id, unit: item.unit },
          );
        if (yieldQuantity.quantity.lte(0))
          throw new CalcError(
            'INVALID_YIELD',
            `Hasil sub-resep ${subRecipe.name} harus lebih dari 0.`,
            { recipeId: subRecipe.id },
          );
        addRecipeIngredients(
          subRecipe,
          usedQuantity.quantity.div(yieldQuantity.quantity),
        );
      }
    } finally {
      visiting.delete(current.id);
    }
  }

  const recipeMultiplier = new Big(String(portions)).div(recipe.yieldPortions);
  addRecipeIngredients(recipe, recipeMultiplier);

  return [...requiredByIngredient.entries()]
    .map(([ingredientId, needed]) => {
      const ingredient = context.ingredients.get(ingredientId);
      if (!ingredient)
        throw new CalcError('MISSING_REF', 'Bahan tidak ditemukan.', {
          ingredientId,
        });
      const packQuantity = toBaseUnits(
        ingredient.packSize,
        ingredient.buyUnit,
        ingredient.customUnits,
      );
      if (packQuantity.unit !== needed.unit)
        throw new CalcError(
          'UNIT_MISMATCH',
          `Satuan kemasan tidak cocok dengan bahan ${ingredient.name}.`,
          { ingredientId, unit: ingredient.buyUnit },
        );
      if (packQuantity.quantity.lte(0))
        throw new CalcError(
          'INVALID_YIELD',
          `Isi kemasan ${ingredient.name} harus lebih dari 0.`,
          { ingredientId },
        );
      const packageCountBig = needed.quantity
        .div(packQuantity.quantity)
        .round(0, Big.roundUp);
      const packageCount = packageCountBig.toNumber();
      if (!Number.isSafeInteger(packageCount))
        throw new CalcError(
          'INVALID_INPUT',
          `Jumlah kemasan ${ingredient.name} melebihi batas aman.`,
          { ingredientId },
        );
      return {
        ingredientId,
        name: ingredient.name,
        neededQuantity: needed.quantity,
        baseUnit: needed.unit,
        purchaseQuantity: new Big(String(ingredient.packSize)).times(
          packageCount,
        ),
        purchaseUnit: ingredient.buyUnit,
        packageCount,
        estimatedPurchaseCost: new Big(String(ingredient.buyPrice)).times(
          packageCount,
        ),
      } satisfies ShoppingListItem;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}
