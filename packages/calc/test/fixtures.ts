import type { CalcContext, Ingredient, Recipe } from '../src/index';

export function browniesContext(eggPrice = 2000): CalcContext {
  const ingredients: Ingredient[] = [
    {
      id: 'flour',
      name: 'Tepung terigu',
      buyPrice: 14000,
      packSize: 1,
      buyUnit: 'kg',
      customUnits: [],
    },
    {
      id: 'chocolate',
      name: 'Cokelat masak',
      buyPrice: 50000,
      packSize: 1,
      buyUnit: 'kg',
      customUnits: [],
    },
    {
      id: 'egg',
      name: 'Telur',
      buyPrice: eggPrice,
      packSize: 1,
      buyUnit: 'butir',
      customUnits: [],
    },
    {
      id: 'sugar',
      name: 'Gula pasir',
      buyPrice: 16000,
      packSize: 1,
      buyUnit: 'kg',
      customUnits: [],
    },
    {
      id: 'margarine',
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
      { refType: 'ingredient', refId: 'flour', quantity: 150, unit: 'g' },
      { refType: 'ingredient', refId: 'chocolate', quantity: 200, unit: 'g' },
      { refType: 'ingredient', refId: 'egg', quantity: 4, unit: 'butir' },
      { refType: 'ingredient', refId: 'sugar', quantity: 200, unit: 'g' },
      { refType: 'ingredient', refId: 'margarine', quantity: 150, unit: 'g' },
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

  return {
    ingredients: new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    ),
    recipes: new Map([[recipe.id, recipe]]),
    roundingStep: 500,
  };
}

export function makeRecipe(id: string, items: Recipe['items'] = []): Recipe {
  return {
    id,
    name: id,
    yieldPortions: 1,
    items,
    packagingPerPortion: 0,
    energyPerBatch: 0,
    laborMinutesPerBatch: 0,
    laborRatePerHour: null,
    targetMarginBp: 4000,
    currentPrice: null,
    isSubRecipe: false,
    subRecipeYield: null,
  };
}

export function browniesRecipe(context: CalcContext): Recipe {
  const recipe = context.recipes.get('brownies');
  if (!recipe) throw new Error('Brownies tidak ada di fixture.');
  return recipe;
}
