import 'fake-indexeddb/auto';
import { recalcAll } from '@takaran/calc';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../db/db';
import { createIngredient, updatePrice } from '../ingredients/repository';
import { evaluateAffectedRecipes } from '../margin-alarm/evaluate';
import { duplicateRecipe } from './duplicate';
import {
  createRecipe,
  deleteRecipe,
  type RecipeInput,
  updateRecipe,
} from './repository';

vi.mock('../license/limits', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../license/limits')>();
  return { ...actual, hasProLicense: async () => true };
});

afterEach(async () => {
  db.close();
  await db.delete();
});

const recipe = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  name: 'Adonan',
  yieldPortions: 1,
  items: [],
  packagingPerPortion: 0,
  energyPerBatch: 0,
  laborMinutesPerBatch: 0,
  laborRatePerHour: null,
  targetMarginBp: 4000,
  currentPrice: null,
  isSubRecipe: true,
  subRecipeYield: { qty: 500, unit: 'g' },
  ...overrides,
});

describe('sub-resep', () => {
  it('menghitung biaya adonan dasar ke resep yang memakainya', async () => {
    await db.open();
    const flour = await createIngredient({
      name: 'Tepung',
      buyPrice: 20_000,
      packSize: 1,
      buyUnit: 'kg',
      customUnits: [],
    });
    const base = await createRecipe(
      recipe({
        items: [
          { refType: 'ingredient', refId: flour.id, quantity: 500, unit: 'g' },
        ],
      }),
    );
    const parent = await createRecipe(
      recipe({
        name: 'Roti isi',
        isSubRecipe: false,
        subRecipeYield: null,
        items: [
          { refType: 'recipe', refId: base.id, quantity: 200, unit: 'g' },
        ],
      }),
    );
    const results = recalcAll({
      ingredients: new Map([[flour.id, flour]]),
      recipes: new Map([
        [base.id, base],
        [parent.id, parent],
      ]),
      roundingStep: 500,
    });
    const result = results.get(parent.id);
    expect(result).toBeDefined();
    if (result && 'hpp' in result) expect(result.hpp.toNumber()).toBe(4000);
  });

  it('menolak siklus, penghapusan sub-resep terpakai, dan perubahan dimensinya', async () => {
    await db.open();
    const base = await createRecipe(recipe());
    const parent = await createRecipe(
      recipe({
        name: 'Isian',
        items: [
          { refType: 'recipe', refId: base.id, quantity: 100, unit: 'g' },
        ],
      }),
    );
    await expect(
      updateRecipe(
        base.id,
        recipe({
          items: [
            { refType: 'recipe', refId: parent.id, quantity: 100, unit: 'g' },
          ],
        }),
      ),
    ).rejects.toThrow('Adonan dasar tidak bisa memakai dirinya sendiri.');
    await expect(deleteRecipe(base.id)).rejects.toMatchObject({
      code: 'IN_USE',
    });
    await expect(
      updateRecipe(
        base.id,
        recipe({ subRecipeYield: { qty: 1, unit: 'pcs' } }),
      ),
    ).rejects.toMatchObject({ code: 'IN_USE' });
  });

  it('alarm margin mencakup resep yang memakai bahan lewat sub-resep', async () => {
    await db.open();
    const flour = await createIngredient({
      name: 'Tepung',
      buyPrice: 10_000,
      packSize: 1,
      buyUnit: 'kg',
      customUnits: [],
    });
    const base = await createRecipe(
      recipe({
        items: [
          { refType: 'ingredient', refId: flour.id, quantity: 500, unit: 'g' },
        ],
      }),
    );
    const parent = await createRecipe(
      recipe({
        name: 'Kue',
        isSubRecipe: false,
        subRecipeYield: null,
        currentPrice: 1,
        items: [
          { refType: 'recipe', refId: base.id, quantity: 500, unit: 'g' },
        ],
      }),
    );
    const results = recalcAll({
      ingredients: new Map([[flour.id, flour]]),
      recipes: new Map([
        [base.id, base],
        [parent.id, parent],
      ]),
      roundingStep: 500,
    });
    const affected = evaluateAffectedRecipes(
      flour.id,
      [base, parent],
      results,
      500,
    );
    expect(affected.map((entry) => entry.recipe.id)).toContain(parent.id);
    await updatePrice(flour.id, 20_000);
    expect((await db.settings.get('marginAlarm'))?.value).toMatchObject({
      recipeIds: expect.arrayContaining([parent.id]),
      triggeredBy: flour.id,
    });
  });

  it('menduplikasi resep dengan daftar item baru dan tanpa harga jual', async () => {
    await db.open();
    const original = await createRecipe(recipe({ currentPrice: 15_000 }));
    const copy = await duplicateRecipe(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Adonan (salinan)');
    expect(copy.currentPrice).toBeNull();
    expect(copy.items).not.toBe(original.items);
  });
});
