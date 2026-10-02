import { describe, expect, it } from 'vitest';
import { recipeFormSchema } from './schema';

const input = {
  name: ' Brownies ',
  yieldPortions: '16',
  packagingPerPortion: '1000',
  energyPerBatch: '3000',
  laborMinutesPerBatch: '90',
  laborRatePerHour: '',
  isSubRecipe: false,
  subRecipeYieldQty: '1',
  subRecipeYieldUnit: 'g',
  items: [
    { refType: 'ingredient', refId: 'flour', quantity: '150.125', unit: 'g' },
  ],
};

describe('validasi editor resep', () => {
  it('mengubah teks menjadi input domain dengan presisi dan tenaga opsional', () => {
    expect(recipeFormSchema.parse(input)).toMatchObject({
      name: 'Brownies',
      yieldPortions: 16,
      packagingPerPortion: 1000,
      laborRatePerHour: null,
      items: [{ quantity: 150.125 }],
    });
  });

  it.each([
    { name: ' ' },
    { yieldPortions: '0' },
    { yieldPortions: '10001' },
    { energyPerBatch: '-1' },
    { packagingPerPortion: '1.5' },
    { laborRatePerHour: '9007199254740992' },
    { subRecipeYieldQty: '0' },
    { subRecipeYieldQty: '1.0001' },
  ])('menolak input tidak valid %j', (patch) => {
    expect(recipeFormSchema.safeParse({ ...input, ...patch }).success).toBe(
      false,
    );
  });

  it('kesalahan bahan kembar menunjuk baris kedua', () => {
    const parsed = recipeFormSchema.safeParse({
      ...input,
      items: [input.items[0], input.items[0]],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success)
      expect(parsed.error.issues[0]?.path).toEqual(['items', 1, 'refId']);
  });
});
