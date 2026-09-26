import type { Ingredient, Recipe } from '@takaran/calc';
import { db } from '../../db/db';
import type { IngredientRow, RecipeRow } from '../../db/schema';
import { createUlid } from '../../lib/ulid';
import { listIngredients } from '../ingredients/repository';

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

export async function seedExample(): Promise<RecipeRow> {
  const existingRecipe = (await db.recipes.toArray()).find(
    (row) => row.name === 'Brownies',
  );
  if (existingRecipe) return existingRecipe;
  const now = new Date().toISOString();
  let result!: RecipeRow;
  await db.transaction('rw', db.ingredients, db.recipes, async () => {
    const existing = await listIngredients();
    const savedRecipe = (await db.recipes.toArray()).find(
      (row) => row.name === 'Brownies',
    );
    if (savedRecipe) {
      result = savedRecipe;
      return;
    }
    const byName = new Map(
      existing.map((row) => [row.name.trim().toLocaleLowerCase('id-ID'), row]),
    );
    const rows: IngredientRow[] = [];
    for (const ingredient of exampleIngredients) {
      let row = byName.get(ingredient.name.toLocaleLowerCase('id-ID'));
      if (
        row &&
        (row.buyPrice !== ingredient.buyPrice ||
          row.packSize !== ingredient.packSize ||
          row.buyUnit !== ingredient.buyUnit)
      ) {
        const exampleName = `${ingredient.name} (contoh brownies)`;
        row = byName.get(exampleName.toLocaleLowerCase('id-ID'));
        if (!row) {
          row = {
            id: createUlid(),
            ...ingredient,
            name: exampleName,
            createdAt: now,
            updatedAt: now,
          };
          await db.ingredients.add(row);
          byName.set(exampleName.toLocaleLowerCase('id-ID'), row);
        }
      }
      if (!row) {
        row = {
          id: createUlid(),
          ...ingredient,
          createdAt: now,
          updatedAt: now,
        };
        await db.ingredients.add(row);
        byName.set(ingredient.name.toLocaleLowerCase('id-ID'), row);
      }
      rows.push(row);
    }
    const quantities = [150, 200, 4, 200, 150];
    const units = ['g', 'g', 'butir', 'g', 'g'];
    const recipe: Recipe = {
      id: createUlid(),
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
    };
    result = { ...recipe, createdAt: now, updatedAt: now };
    await db.recipes.add(result);
  });
  return result;
}
