import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/db';
import {
  claimFirstIngredientEvent,
  createIngredient,
  deleteIngredient,
  IngredientRepositoryError,
  listIngredients,
  updateIngredient,
  updatePrice,
  usageCount,
} from './repository';
import { ingredientFormSchema, ingredientInputFromForm } from './schema';

afterEach(async () => {
  db.close();
  await db.delete();
});

beforeEach(async () => {
  await db.open();
});

const flour = {
  name: 'Tepung terigu',
  buyPrice: 14_000,
  packSize: 1000,
  buyUnit: 'g',
  customUnits: [],
};

describe('ingredient repository', () => {
  it('creates and searches ingredients case insensitively', async () => {
    const saved = await createIngredient(flour);
    expect(saved).toMatchObject({
      name: 'Tepung terigu',
      buyPrice: 14_000,
      packSize: 1000,
    });
    expect((await listIngredients('TERIGU')).map(({ id }) => id)).toEqual([
      saved.id,
    ]);
    await expect(
      createIngredient({ ...flour, name: 'tEpUnG tErIgU' }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_NAME' });
  });

  it('keeps a custom package unit and computes its stored definition', () => {
    const parsed = ingredientFormSchema.parse({
      name: 'Cokelat',
      buyPrice: '12500',
      packSize: '1',
      buyUnit: 'bungkus',
      customName: '',
      customQty: '250',
      customBase: 'g',
    });
    expect(ingredientInputFromForm(parsed)).toMatchObject({
      buyUnit: 'bungkus',
      customUnits: [{ name: 'bungkus', qty: 250, base: 'g' }],
    });
  });

  it('rejects invalid money and more than three decimals', () => {
    const form = {
      name: 'Tepung',
      buyPrice: '100',
      packSize: '1',
      buyUnit: 'g',
      customName: '',
      customQty: '',
      customBase: 'g',
    };
    expect(
      ingredientFormSchema.safeParse({ ...form, buyPrice: '1.5' }).success,
    ).toBe(false);
    expect(
      ingredientFormSchema.safeParse({ ...form, packSize: '1.0001' }).success,
    ).toBe(false);
  });

  it('writes price history atomically and skips an unchanged price', async () => {
    const saved = await createIngredient(flour);
    await updatePrice(saved.id, 15_000);
    await updatePrice(saved.id, 15_000);
    expect((await db.ingredients.get(saved.id))?.buyPrice).toBe(15_000);
    expect(await db.priceHistory.toArray()).toMatchObject([
      { ingredientId: saved.id, oldPrice: 14_000, newPrice: 15_000 },
    ]);
  });

  it('blocks deleting an ingredient that a recipe uses', async () => {
    const saved = await createIngredient(flour);
    const now = new Date().toISOString();
    await db.recipes.add({
      id: 'recipe-1',
      name: 'Brownies',
      yieldPortions: 1,
      items: [
        { refType: 'ingredient', refId: saved.id, quantity: 100, unit: 'g' },
      ],
      packagingPerPortion: 0,
      energyPerBatch: 0,
      laborMinutesPerBatch: 0,
      laborRatePerHour: null,
      targetMarginBp: 4000,
      currentPrice: null,
      isSubRecipe: false,
      subRecipeYield: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(await usageCount(saved.id)).toBe(1);
    await expect(deleteIngredient(saved.id)).rejects.toThrow(
      'Bahan ini dipakai di 1 resep. Hapus dari resepnya dulu.',
    );
    await expect(
      updateIngredient(saved.id, { ...flour, buyUnit: 'pcs', packSize: 1 }),
    ).rejects.toMatchObject({ code: 'DIMENSION_IN_USE' });
    expect(await db.ingredients.get(saved.id)).toBeTruthy();
  });

  it('allows deleting unused ingredients and claims first-add analytics once', async () => {
    const saved = await createIngredient(flour);
    expect(await claimFirstIngredientEvent()).toBe(true);
    expect(await claimFirstIngredientEvent()).toBe(false);
    await deleteIngredient(saved.id);
    expect(await db.ingredients.get(saved.id)).toBeUndefined();
  });

  it('returns an explicit missing-row error', async () => {
    await expect(updatePrice('missing', 100)).rejects.toBeInstanceOf(
      IngredientRepositoryError,
    );
  });
});
