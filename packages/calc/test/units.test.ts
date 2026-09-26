import Big from 'big.js';
import { describe, expect, it } from 'vitest';
import { batchCost, CalcError, toBaseUnits, unitPrice } from '../src';
import { makeRecipe } from './fixtures';

describe('konversi satuan', () => {
  it.each([
    ['kg', 2, 'g', 2000],
    ['l', 1.5, 'ml', 1500],
    ['butir', 3, 'pcs', 3],
  ] as const)('mengonversi %s ke satuan dasar', (unit, quantity, base, value) => {
    expect(toBaseUnits(quantity, unit)).toEqual({
      quantity: new Big(value),
      unit: base,
    });
  });

  it('mengonversi satuan custom dan memakai konversi bahan saat menghitung harga', () => {
    const customUnits = [{ name: 'bungkus', qty: 250, base: 'g' as const }];
    expect(toBaseUnits(2, 'bungkus', customUnits)).toEqual({
      quantity: new Big(500),
      unit: 'g',
    });
    expect(
      unitPrice({
        id: 'flour',
        name: 'Tepung',
        buyPrice: 5000,
        packSize: 2,
        buyUnit: 'bungkus',
        customUnits,
      }).toNumber(),
    ).toBe(10);
  });

  it('menolak satuan custom yang belum didefinisikan dan dimensi yang tidak cocok', () => {
    expect(() => toBaseUnits(1, 'bungkus')).toThrowError(
      expect.objectContaining({ code: 'UNIT_UNDEFINED' }),
    );
    const recipe = makeRecipe('cake', [
      { refType: 'ingredient', refId: 'milk', quantity: 1, unit: 'g' },
    ]);
    expect(() =>
      batchCost(recipe, {
        ingredients: new Map([
          [
            'milk',
            {
              id: 'milk',
              name: 'Susu',
              buyPrice: 10000,
              packSize: 1,
              buyUnit: 'l',
              customUnits: [],
            },
          ],
        ]),
        recipes: new Map(),
        roundingStep: 500,
      }),
    ).toThrowError(expect.objectContaining({ code: 'UNIT_MISMATCH' }));
  });

  it('menolak konversi custom dan kuantitas yang tidak valid', () => {
    expect(() =>
      toBaseUnits(1, 'bungkus', [{ name: 'bungkus', qty: 0, base: 'g' }]),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
    expect(() => toBaseUnits(-1, 'g')).toThrowError(CalcError);
    expect(() => toBaseUnits('bad', 'g')).toThrowError(
      expect.objectContaining({ code: 'INVALID_INPUT' }),
    );
    expect(() =>
      unitPrice({
        id: 'bad-price',
        name: 'Bahan',
        buyPrice: -1,
        packSize: 1,
        buyUnit: 'g',
        customUnits: [],
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
    expect(() =>
      unitPrice({
        id: 'empty-pack',
        name: 'Bahan',
        buyPrice: 1,
        packSize: 0,
        buyUnit: 'g',
        customUnits: [],
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_YIELD' }));
  });
});
