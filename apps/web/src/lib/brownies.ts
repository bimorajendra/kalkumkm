import type { Ingredient, Recipe } from '@takaran/calc';
import {
  actualMarginBp,
  breakdown,
  hppPerPortion,
  markupBp,
  profitPerHour,
  suggestPrice,
} from '@takaran/calc';

const baseIngredients: Ingredient[] = [
  {
    id: 'tepung',
    name: 'Tepung terigu',
    buyPrice: 14000,
    packSize: 1,
    buyUnit: 'kg',
    customUnits: [],
  },
  {
    id: 'cokelat',
    name: 'Cokelat masak',
    buyPrice: 50000,
    packSize: 1,
    buyUnit: 'kg',
    customUnits: [],
  },
  {
    id: 'telur',
    name: 'Telur',
    buyPrice: 2000,
    packSize: 1,
    buyUnit: 'butir',
    customUnits: [],
  },
  {
    id: 'gula',
    name: 'Gula pasir',
    buyPrice: 16000,
    packSize: 1,
    buyUnit: 'kg',
    customUnits: [],
  },
  {
    id: 'margarin',
    name: 'Margarin',
    buyPrice: 30000,
    packSize: 1,
    buyUnit: 'kg',
    customUnits: [],
  },
];

const recipe: Recipe = {
  id: 'brownies',
  name: 'Brownies',
  yieldPortions: 16,
  items: [
    { refType: 'ingredient', refId: 'tepung', quantity: 150, unit: 'g' },
    { refType: 'ingredient', refId: 'cokelat', quantity: 200, unit: 'g' },
    { refType: 'ingredient', refId: 'telur', quantity: 4, unit: 'butir' },
    { refType: 'ingredient', refId: 'gula', quantity: 200, unit: 'g' },
    { refType: 'ingredient', refId: 'margarin', quantity: 150, unit: 'g' },
  ],
  packagingPerPortion: 1000,
  energyPerBatch: 3000,
  laborMinutesPerBatch: 90,
  laborRatePerHour: null,
  targetMarginBp: 4000,
  currentPrice: 5000,
  isSubRecipe: false,
  subRecipeYield: null,
};

export function calculateBrownies(
  eggPrice: number,
  marginBp: number,
  currentPrice?: number,
) {
  const ingredients = new Map(
    baseIngredients.map((ingredient) => [
      ingredient.id,
      ingredient.id === 'telur'
        ? { ...ingredient, buyPrice: eggPrice }
        : ingredient,
    ]),
  );
  const recipes = new Map([
    [recipe.id, { ...recipe, targetMarginBp: marginBp }],
  ]);
  const context = { ingredients, recipes, roundingStep: 500 };
  const hpp = hppPerPortion(recipe, context);
  const price =
    currentPrice ?? suggestPrice(hpp, marginBp, 0, context.roundingStep);
  const costs = breakdown(recipe, context);
  const profit = profitPerHour(price, hpp, 0, 1, 60) ?? 0;
  return {
    hpp,
    price,
    marginBp: actualMarginBp(price, hpp, 0),
    markupBp: markupBp(price, hpp),
    profitPerHour: profitPerHour(
      price,
      hpp,
      0,
      recipe.yieldPortions,
      recipe.laborMinutesPerBatch,
    ),
    layers: [
      {
        key: 'ingredients',
        label: 'Bahan',
        value: costs.ingredients.plus(costs.subRecipes),
      },
      { key: 'energy', label: 'Energi', value: costs.energy },
      { key: 'packaging', label: 'Kemasan', value: costs.packaging },
      ...(costs.labor.gt(0)
        ? [{ key: 'labor', label: 'Tenaga', value: costs.labor }]
        : []),
    ],
    profit,
  };
}
