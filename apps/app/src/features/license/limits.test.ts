import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../../db/db';
import { createChannel } from '../channels/repository';
import { createRecipe } from '../recipes/repository';
import { FreeLimitError } from './limits';

afterEach(async () => {
  db.close();
  await db.delete();
});

const recipe = (name: string) => ({
  name,
  yieldPortions: 1,
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

describe('batas paket gratis', () => {
  it('menolak resep keempat tanpa mengubah data yang sudah ada', async () => {
    await db.open();
    await createRecipe(recipe('Satu'));
    await createRecipe(recipe('Dua'));
    await createRecipe(recipe('Tiga'));
    await expect(createRecipe(recipe('Empat'))).rejects.toBeInstanceOf(
      FreeLimitError,
    );
    expect(await db.recipes.count()).toBe(3);
  });

  it('mengunci pembuatan subresep untuk paket Pro', async () => {
    await db.open();
    await expect(
      createRecipe({
        ...recipe('Subresep'),
        isSubRecipe: true,
        subRecipeYield: { qty: 1, unit: 'g' },
      }),
    ).rejects.toThrow('Takaran Pro');
    expect(await db.recipes.count()).toBe(0);
  });

  it('menolak saluran kedua tanpa menghapus saluran pertama', async () => {
    await db.open();
    await createChannel({ name: 'Langsung', kind: 'commission', rateBp: 0 });
    await expect(
      createChannel({ name: 'Titip jual', kind: 'commission', rateBp: 1000 }),
    ).rejects.toBeInstanceOf(FreeLimitError);
    expect(await db.channels.count()).toBe(1);
  });
});
