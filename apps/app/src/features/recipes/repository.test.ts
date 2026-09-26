import 'fake-indexeddb/auto';
import { recalcAll } from '@takaran/calc';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../../db/db';
import { createIngredient } from '../ingredients/repository';
import {
  createRecipe,
  deleteRecipe,
  type RecipeInput,
  RecipeRepositoryError,
  updateRecipe,
} from './repository';
import { seedExample } from './seed-example';

afterEach(async () => {
  db.close();
  await db.delete();
});

describe('recipe repository', () => {
  it('creates, updates and deletes a recipe and its quote options in one transaction', async () => {
    await db.open();
    const created = await createRecipe({
      name: 'Adonan',
      yieldPortions: 4,
      items: [],
      packagingPerPortion: 0,
      energyPerBatch: 0,
      laborMinutesPerBatch: 0,
      laborRatePerHour: null,
      targetMarginBp: 4000,
      currentPrice: null,
      isSubRecipe: false,
      subRecipeYield: null,
    });
    const changed = await updateRecipe(created.id, {
      ...created,
      name: 'Adonan baru',
    });
    expect(changed.name).toBe('Adonan baru');
    await db.quoteOptions.add({
      id: 'option-1',
      recipeId: created.id,
      name: 'Pita',
      priceAdd: 500,
      costAdd: 100,
      createdAt: '',
      updatedAt: '',
    });
    await db.settings.put({ key: 'lastRecipeId', value: created.id });
    await deleteRecipe(created.id);
    expect(await db.recipes.get(created.id)).toBeUndefined();
    expect(await db.quoteOptions.toArray()).toHaveLength(0);
    expect((await db.settings.get('lastRecipeId'))?.value).toBeNull();
  });

  it('rejects invalid yield, duplicate ingredients and units from another dimension', async () => {
    await db.open();
    const flour = await createIngredient({
      name: 'Tepung',
      buyPrice: 14_000,
      packSize: 1,
      buyUnit: 'kg',
      customUnits: [],
    });
    const base: RecipeInput = {
      name: 'Adonan',
      yieldPortions: 4,
      items: [],
      packagingPerPortion: 0,
      energyPerBatch: 0,
      laborMinutesPerBatch: 0,
      laborRatePerHour: null,
      targetMarginBp: 4000,
      currentPrice: null,
      isSubRecipe: false,
      subRecipeYield: null,
    };
    await expect(
      createRecipe({ ...base, yieldPortions: 0 }),
    ).rejects.toBeInstanceOf(RecipeRepositoryError);
    await expect(
      createRecipe({
        ...base,
        items: [
          { refType: 'ingredient', refId: flour.id, quantity: 1, unit: 'g' },
          { refType: 'ingredient', refId: flour.id, quantity: 2, unit: 'kg' },
        ],
      }),
    ).rejects.toThrow('Bahan yang sama');
    await expect(
      createRecipe({
        ...base,
        items: [
          { refType: 'ingredient', refId: flour.id, quantity: 1, unit: 'ml' },
        ],
      }),
    ).rejects.toThrow('Satuan takaran');
  });

  it('seeds brownies once and matches the PRD HPP', async () => {
    await db.open();
    const recipe = await seedExample();
    expect(await seedExample()).toMatchObject({ id: recipe.id });
    const [ingredients, recipes] = await Promise.all([
      db.ingredients.toArray(),
      db.recipes.toArray(),
    ]);
    const result = recalcAll({
      ingredients: new Map(ingredients.map((item) => [item.id, item])),
      recipes: new Map(recipes.map((item) => [item.id, item])),
      roundingStep: 500,
    }).get(recipe.id);
    expect(result).not.toBeInstanceOf(Error);
    if (result && !(result instanceof Error))
      expect(result.hpp.toNumber()).toBe(2925);
    expect(await db.ingredients.count()).toBe(5);
  });
});
