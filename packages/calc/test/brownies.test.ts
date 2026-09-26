import Big from 'big.js';
import { describe, expect, it } from 'vitest';
import {
  actualMarginBp,
  batchCost,
  breakdown,
  hppPerPortion,
  markupBp,
  priceForChannel,
  profitPerHour,
  quoteTotals,
  suggestPrice,
} from '../src';
import { browniesContext, browniesRecipe } from './fixtures';

describe('contoh acuan brownies PRD', () => {
  it('menghitung bahan, HPP, saran harga, margin, dan markup', () => {
    const context = browniesContext();
    const recipe = browniesRecipe(context);

    expect(batchCost(recipe, context).toNumber()).toBe(30800);
    expect(breakdown(recipe, context).ingredients.toNumber()).toBe(1737.5);
    expect(hppPerPortion(recipe, context).toNumber()).toBe(2925);
    expect(suggestPrice(new Big(2925), 4000, 0, 500)).toBe(5000);
    expect(actualMarginBp(5000, new Big(2925), 0)).toBe(4150);
    expect(markupBp(5000, new Big(2925))).toBe(7094);
  });

  it('menghitung harga ojol dan untung per jam', () => {
    const context = browniesContext();
    const recipe = browniesRecipe(context);
    const hpp = hppPerPortion(recipe, context);
    const ojol = priceForChannel(
      hpp,
      4000,
      5000,
      { id: 'ojol', name: 'Ojol', kind: 'commission', rateBp: 2000 },
      500,
    );

    expect(ojol).toEqual({ price: 7500, marginBp: 4100 });
    expect(profitPerHour(5000, hpp, 0, 16, 90)?.round(0).toNumber()).toBe(
      22133,
    );
    expect(profitPerHour(5000, hpp, 0, 16, 0)).toBeNull();
  });

  it('menghitung harga setelah telur naik dan contoh edukasi margin', () => {
    const context = browniesContext(2600);
    const recipe = browniesRecipe(context);

    expect(hppPerPortion(recipe, context).toNumber()).toBe(3075);
    expect(actualMarginBp(5000, new Big(3075), 0)).toBe(3850);
    expect(actualMarginBp(4200, new Big(3000), 0)).toBe(2857);
    expect(markupBp(4200, new Big(3000))).toBe(4000);
  });

  it('menghitung total penawaran dengan dan tanpa opsi', () => {
    expect(quoteTotals(new Big(2925), 5000, 2, [])).toEqual({
      price: 10000,
      cost: new Big(5850),
      profit: new Big(4150),
    });
    expect(
      quoteTotals(new Big(2925), 5000, 2, [
        { priceAdd: 1500, costAdd: 700 },
        { priceAdd: 500, costAdd: 200 },
      ]),
    ).toEqual({
      price: 12000,
      cost: new Big(6750),
      profit: new Big(5250),
    });
  });
});
