import Big from 'big.js';
import { describe, expect, it } from 'vitest';
import { calculateOrder, shoppingListForOrder } from '../src/order';
import { browniesContext, browniesRecipe } from './fixtures';

describe('kalkulator pesanan dan daftar belanja', () => {
  it('menghitung biaya, omzet, komisi, dan laba untuk jumlah persis', () => {
    const context = browniesContext();
    const recipe = browniesRecipe(context);
    const order = calculateOrder(recipe, 50, 5000, 0, context);
    expect(order.productionCost).toEqual(new Big(146250));
    expect(order.grossRevenue).toEqual(new Big(250000));
    expect(order.profit).toEqual(new Big(103750));
    expect(order.portions).toBe(50);
  });

  it('menghitung kebutuhan bahan dan membulatkan pembelian ke kemasan utuh', () => {
    const context = browniesContext();
    const list = shoppingListForOrder(browniesRecipe(context), 50, context);
    const flour = list.find((item) => item.ingredientId === 'flour');
    const eggs = list.find((item) => item.ingredientId === 'egg');
    expect(flour?.neededQuantity).toEqual(new Big('468.75'));
    expect(flour?.packageCount).toBe(1);
    expect(eggs?.neededQuantity).toEqual(new Big('12.5'));
    expect(eggs?.packageCount).toBe(13);
    expect(eggs?.estimatedPurchaseCost).toEqual(new Big(26000));
  });

  it('menolak jumlah atau harga pesanan yang tidak valid', () => {
    const context = browniesContext();
    const recipe = browniesRecipe(context);
    expect(() => calculateOrder(recipe, 0, 5000, 0, context)).toThrow();
    expect(() => calculateOrder(recipe, 1, 5.5, 0, context)).toThrow();
    expect(() => shoppingListForOrder(recipe, -1, context)).toThrow();
  });
});
