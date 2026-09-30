import Big from 'big.js';
import { describe, expect, it } from 'vitest';
import { hppPerPortion } from '../src';
import { simulateIngredientPriceIncrease } from '../src/scenario';
import { browniesContext, browniesRecipe, makeRecipe } from './fixtures';

describe('simulasi kenaikan harga bahan', () => {
  it('menghitung dampak tanpa mengubah konteks asli', () => {
    const context = browniesContext();
    const recipe = browniesRecipe(context);

    const scenario = simulateIngredientPriceIncrease(context, 'egg', 1500);

    expect(scenario.currentPrice).toEqual(new Big(2000));
    expect(scenario.simulatedPrice).toEqual(new Big(2300));
    expect(scenario.results.get(recipe.id)).toMatchObject({
      hpp: new Big(3000),
    });
    expect(context.ingredients.get('egg')?.buyPrice).toBe(2000);
    expect(hppPerPortion(recipe, context)).toEqual(new Big(2925));
  });

  it('mempertahankan presisi harga simulasi desimal', () => {
    const context = browniesContext();
    const recipe = browniesRecipe(context);

    const scenario = simulateIngredientPriceIncrease(context, 'egg', 3333);

    expect(scenario.simulatedPrice).toEqual(new Big('2666.6'));
    expect(scenario.results.get(recipe.id)).toMatchObject({
      hpp: new Big('3091.65'),
    });
  });

  it('menolak bahan yang tidak ditemukan dan persentase invalid', () => {
    const context = browniesContext();
    expect(() =>
      simulateIngredientPriceIncrease(context, 'missing', 1000),
    ).toThrowError(expect.objectContaining({ code: 'MISSING_REF' }));
    expect(() =>
      simulateIngredientPriceIncrease(context, 'egg', -1),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
    expect(() =>
      simulateIngredientPriceIncrease(context, 'egg', 1000.5),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
  });
  it('menghitung perubahan harga sampai ke bahan dalam sub-resep', () => {
    const context = browniesContext();
    const egg = context.ingredients.get('egg');
    if (!egg) throw new Error('Telur tidak ada di fixture.');
    context.ingredients.set('egg', { ...egg, buyPrice: 100 });
    const base = makeRecipe('base', [
      { refType: 'ingredient', refId: 'egg', quantity: 2, unit: 'butir' },
    ]);
    base.subRecipeYield = { qty: 1, unit: 'kg' };
    context.recipes.set(base.id, base);
    const product = makeRecipe('product', [
      { refType: 'recipe', refId: 'base', quantity: 500, unit: 'g' },
    ]);
    context.recipes.set(product.id, product);

    const scenario = simulateIngredientPriceIncrease(context, 'egg', 10000);

    expect(scenario.results.get(product.id)).toMatchObject({
      hpp: new Big(200),
      breakdown: { subRecipes: new Big(200) },
    });
  });
});
