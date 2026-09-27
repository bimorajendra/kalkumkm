import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../db/db';
import { createRecipe } from '../recipes/repository';
import {
  createQuoteOption,
  deleteQuoteOption,
  listQuoteOptions,
  QuoteRepositoryError,
  updateQuoteOption,
} from './repository';

vi.mock('../license/limits', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../license/limits')>();
  return { ...actual, hasProLicense: async () => true };
});

afterEach(async () => {
  db.close();
  await db.delete();
});

describe('quote repository', () => {
  it('creates, updates, and deletes recipe-specific options', async () => {
    await db.open();
    const recipe = await createRecipe({
      name: 'Brownies',
      yieldPortions: 16,
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
    const option = await createQuoteOption(recipe.id, {
      name: 'Tulisan nama',
      priceAdd: 3000,
      costAdd: 1200,
    });
    expect(
      await db.quoteOptions.where('recipeId').equals(recipe.id).toArray(),
    ).toMatchObject([{ name: 'Tulisan nama', priceAdd: 3000, costAdd: 1200 }]);
    await expect(listQuoteOptions(recipe.id)).resolves.toHaveLength(1);
    const updated = await updateQuoteOption(option.id, {
      name: 'Topper',
      priceAdd: 5000,
      costAdd: 2000,
    });
    expect(updated).toMatchObject({
      name: 'Topper',
      priceAdd: 5000,
      costAdd: 2000,
    });
    await deleteQuoteOption(option.id);
    expect(
      await db.quoteOptions.where('recipeId').equals(recipe.id).count(),
    ).toBe(0);
  });

  it('validates name and non-negative safe integer amounts', async () => {
    await db.open();
    const recipe = await createRecipe({
      name: 'Brownies',
      yieldPortions: 16,
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
    await expect(
      createQuoteOption(recipe.id, { name: '   ', priceAdd: 0, costAdd: 0 }),
    ).rejects.toMatchObject({ code: 'INVALID' });
    await expect(
      createQuoteOption(recipe.id, {
        name: 'x'.repeat(41),
        priceAdd: 0,
        costAdd: 0,
      }),
    ).rejects.toBeInstanceOf(QuoteRepositoryError);
    await expect(
      createQuoteOption(recipe.id, { name: 'Opsi', priceAdd: -1, costAdd: 0 }),
    ).rejects.toMatchObject({ code: 'INVALID' });
    await expect(
      createQuoteOption(recipe.id, {
        name: 'Opsi',
        priceAdd: Number.MAX_SAFE_INTEGER + 1,
        costAdd: 0,
      }),
    ).rejects.toMatchObject({ code: 'INVALID' });
  });
});
