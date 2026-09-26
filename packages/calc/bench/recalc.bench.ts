import { expect, test } from 'vitest';
import type { CalcContext, Ingredient, Recipe } from '../src';
import { recalcAll } from '../src';

const ingredients: Ingredient[] = Array.from({ length: 10 }, (_, index) => ({
  id: `ingredient-${index}`,
  name: `Bahan ${index}`,
  buyPrice: 10000 + index,
  packSize: 1000,
  buyUnit: 'g',
  customUnits: [],
}));
const base: Recipe = {
  id: 'recipe-0',
  name: 'Resep 0',
  yieldPortions: 10,
  items: ingredients.map((ingredient) => ({
    refType: 'ingredient',
    refId: ingredient.id,
    quantity: 10,
    unit: 'g',
  })),
  packagingPerPortion: 0,
  energyPerBatch: 0,
  laborMinutesPerBatch: 0,
  laborRatePerHour: null,
  targetMarginBp: 4000,
  currentPrice: null,
  isSubRecipe: true,
  subRecipeYield: { qty: 100, unit: 'g' },
};
const recipes: Recipe[] = [base];
for (let index = 1; index < 100; index += 1) {
  recipes.push({
    ...base,
    id: `recipe-${index}`,
    name: `Resep ${index}`,
    isSubRecipe: false,
    subRecipeYield: null,
    items: [
      ...base.items,
      { refType: 'recipe', refId: base.id, quantity: 5, unit: 'g' },
    ],
  });
}
const context: CalcContext = {
  ingredients: new Map(
    ingredients.map((ingredient) => [ingredient.id, ingredient]),
  ),
  recipes: new Map(recipes.map((recipe) => [recipe.id, recipe])),
  roundingStep: 500,
};

test('100 resep, 10 bahan, satu tingkat sub-resep; estimasi CPU 4× lebih lambat < 200 ms', async ({
  bench,
}) => {
  const recalculate = recalcAll;
  const result = await bench('recalcAll', () => {
    expect(recalculate(context)).toHaveProperty('size', 100);
  }).run();

  // 20 operations/s means <=50 ms each, or <=200 ms when estimated at 4× slower.
  expect(result.throughput.mean).toBeGreaterThan(20);
});
