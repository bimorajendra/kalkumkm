import type { Ingredient } from '@takaran/calc';
import { assertCanCreate } from './limits';
import type {
  Changes,
  CommandContext,
  IngredientRow,
  RecipeRow,
  Snapshot,
} from './types';

const exampleIngredients: Array<Omit<Ingredient, 'id'>> = [
  {
    name: 'Tepung terigu',
    buyPrice: 14_000,
    packSize: 1,
    buyUnit: 'kg',
    customUnits: [],
  },
  {
    name: 'Cokelat masak',
    buyPrice: 50_000,
    packSize: 1,
    buyUnit: 'kg',
    customUnits: [],
  },
  {
    name: 'Telur',
    buyPrice: 2_000,
    packSize: 1,
    buyUnit: 'butir',
    customUnits: [],
  },
  {
    name: 'Gula pasir',
    buyPrice: 16_000,
    packSize: 1,
    buyUnit: 'kg',
    customUnits: [],
  },
  {
    name: 'Margarin',
    buyPrice: 30_000,
    packSize: 1,
    buyUnit: 'kg',
    customUnits: [],
  },
];

const lower = (value: string) => value.trim().toLocaleLowerCase('id-ID');

/**
 * Resep contoh Brownies dari PRD bagian 7. Bahan yang sudah ada dengan nama
 * sama dipakai ulang; jika harganya beda, dibuat bahan "(contoh brownies)"
 * agar harga milik pengguna tidak berubah.
 */
export function seedExample(
  snapshot: Snapshot,
  context: CommandContext,
): Changes & { recipeId: string } {
  const existingRecipe = snapshot.recipes.find(
    (row) => row.name === 'Brownies',
  );
  if (existingRecipe) return { recipeId: existingRecipe.id };
  assertCanCreate(snapshot, 'recipe');

  const byName = new Map(
    snapshot.ingredients.map((row) => [lower(row.name), row]),
  );
  const created: IngredientRow[] = [];
  const rows: IngredientRow[] = [];
  const make = (ingredient: Omit<Ingredient, 'id'>, name: string) => {
    const row: IngredientRow = {
      id: context.newId(),
      ...ingredient,
      name,
      createdAt: context.now,
      updatedAt: context.now,
    };
    created.push(row);
    byName.set(lower(name), row);
    return row;
  };
  for (const ingredient of exampleIngredients) {
    let row = byName.get(lower(ingredient.name));
    if (
      row &&
      (row.buyPrice !== ingredient.buyPrice ||
        row.packSize !== ingredient.packSize ||
        row.buyUnit !== ingredient.buyUnit)
    ) {
      const exampleName = `${ingredient.name} (contoh brownies)`;
      row = byName.get(lower(exampleName)) ?? make(ingredient, exampleName);
    }
    rows.push(row ?? make(ingredient, ingredient.name));
  }
  const quantities = [150, 200, 4, 200, 150];
  const units = ['g', 'g', 'butir', 'g', 'g'];
  const recipe: RecipeRow = {
    id: context.newId(),
    name: 'Brownies',
    yieldPortions: 16,
    items: rows.map((ingredient, index) => ({
      refType: 'ingredient',
      refId: ingredient.id,
      quantity: quantities[index] ?? 1,
      unit: units[index] ?? 'g',
    })),
    packagingPerPortion: 1_000,
    energyPerBatch: 3_000,
    laborMinutesPerBatch: 90,
    laborRatePerHour: null,
    targetMarginBp: 4_000,
    currentPrice: 5_000,
    isSubRecipe: false,
    subRecipeYield: null,
    createdAt: context.now,
    updatedAt: context.now,
  };
  return {
    ingredients: { put: created },
    recipes: { put: [recipe] },
    recipeId: recipe.id,
  };
}
