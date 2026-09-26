import Big from 'big.js';
import { describe, expect, it } from 'vitest';
import { batchCost, findCycles, hppPerPortion, recalcAll } from '../src';
import { makeRecipe } from './fixtures';

describe('graf resep', () => {
  it('mendeteksi siklus langsung dan tidak langsung', () => {
    const direct = [
      makeRecipe('a', [
        { refType: 'recipe', refId: 'a', quantity: 1, unit: 'g' },
      ]),
    ];
    const indirect = [
      makeRecipe('a', [
        { refType: 'recipe', refId: 'b', quantity: 1, unit: 'g' },
      ]),
      makeRecipe('b', [
        { refType: 'recipe', refId: 'c', quantity: 1, unit: 'g' },
      ]),
      makeRecipe('c', [
        { refType: 'recipe', refId: 'a', quantity: 1, unit: 'g' },
      ]),
    ];

    expect(findCycles(direct)).toEqual([['a', 'a']]);
    expect(findCycles(indirect)).toEqual([['a', 'b', 'c', 'a']]);
  });

  it('menerima rantai tanpa siklus dan memisahkan error per resep', () => {
    const flour = makeRecipe('flour');
    flour.isSubRecipe = true;
    flour.subRecipeYield = { qty: 100, unit: 'g' };
    const cake = makeRecipe('cake', [
      { refType: 'recipe', refId: 'flour', quantity: 50, unit: 'g' },
    ]);
    const missing = makeRecipe('missing', [
      { refType: 'ingredient', refId: 'deleted', quantity: 1, unit: 'g' },
    ]);
    const context = {
      ingredients: new Map(),
      recipes: new Map(
        [flour, cake, missing].map((recipe) => [recipe.id, recipe]),
      ),
      roundingStep: 500,
    };

    expect(findCycles([flour, cake, missing])).toEqual([]);
    const results = recalcAll(context);
    expect(results.get('flour')).toMatchObject({ hpp: new Big(0) });
    expect(results.get('cake')).toMatchObject({ hpp: new Big(0) });
    expect(hppPerPortion(cake, context).toNumber()).toBe(0);
    expect(results.get('missing')).toMatchObject({ code: 'MISSING_REF' });
  });

  it('memberi error untuk resep yang bergantung pada siklus atau hasil sub-resep tidak valid', () => {
    const a = makeRecipe('a', [
      { refType: 'recipe', refId: 'b', quantity: 1, unit: 'g' },
    ]);
    a.isSubRecipe = true;
    a.subRecipeYield = { qty: 1, unit: 'g' };
    const b = makeRecipe('b', [
      { refType: 'recipe', refId: 'a', quantity: 1, unit: 'g' },
    ]);
    b.isSubRecipe = true;
    b.subRecipeYield = { qty: 1, unit: 'g' };
    const dependent = makeRecipe('dependent', [
      { refType: 'recipe', refId: 'a', quantity: 1, unit: 'g' },
    ]);
    const invalidYield = makeRecipe('invalid-yield');
    invalidYield.isSubRecipe = true;
    invalidYield.subRecipeYield = { qty: 0, unit: 'g' };
    const usesInvalidYield = makeRecipe('uses-invalid-yield', [
      { refType: 'recipe', refId: invalidYield.id, quantity: 1, unit: 'g' },
    ]);
    const context = {
      ingredients: new Map(),
      recipes: new Map(
        [a, b, dependent, invalidYield, usesInvalidYield].map((recipe) => [
          recipe.id,
          recipe,
        ]),
      ),
      roundingStep: 500,
    };
    const results = recalcAll(context);

    expect(results.get('a')).toMatchObject({ code: 'CYCLE' });
    expect(results.get('b')).toMatchObject({ code: 'CYCLE' });
    expect(results.get('dependent')).toMatchObject({
      code: 'DEPENDENCY_FAILED',
    });
    expect(results.get('uses-invalid-yield')).toMatchObject({
      code: 'INVALID_YIELD',
    });
    const badYield = makeRecipe('bad-yield');
    badYield.yieldPortions = 0;
    expect(
      recalcAll({
        ingredients: new Map(),
        recipes: new Map([[badYield.id, badYield]]),
        roundingStep: 500,
      }).get('bad-yield'),
    ).toMatchObject({ code: 'INVALID_YIELD' });
  });

  it('menghitung biaya tenaga dan menangani referensi sub-resep invalid', () => {
    const paid = makeRecipe('paid');
    paid.laborRatePerHour = 30000;
    paid.laborMinutesPerBatch = 30;
    expect(
      batchCost(paid, {
        ingredients: new Map(),
        recipes: new Map(),
        roundingStep: 500,
      }).toNumber(),
    ).toBe(15000);

    const invalidLabor = makeRecipe('invalid-labor');
    invalidLabor.laborRatePerHour = -1;
    expect(
      recalcAll({
        ingredients: new Map(),
        recipes: new Map([[invalidLabor.id, invalidLabor]]),
        roundingStep: 500,
      }).get('invalid-labor'),
    ).toMatchObject({ code: 'INVALID_INPUT' });

    const noSubRecipe = makeRecipe('no-sub-recipe', [
      { refType: 'recipe', refId: 'deleted', quantity: 1, unit: 'g' },
    ]);
    const noYield = makeRecipe('no-yield');
    noYield.isSubRecipe = true;
    const usesNoYield = makeRecipe('uses-no-yield', [
      { refType: 'recipe', refId: 'no-yield', quantity: 1, unit: 'g' },
    ]);
    const mismatch = makeRecipe('mismatch', [
      { refType: 'recipe', refId: 'no-yield', quantity: 1, unit: 'ml' },
    ]);
    noYield.subRecipeYield = { qty: 1, unit: 'g' };
    const context = {
      ingredients: new Map(),
      recipes: new Map(
        [noSubRecipe, noYield, usesNoYield, mismatch].map((recipe) => [
          recipe.id,
          recipe,
        ]),
      ),
      roundingStep: 500,
    };
    expect(recalcAll(context).get('no-sub-recipe')).toMatchObject({
      code: 'MISSING_REF',
    });
    noYield.subRecipeYield = null;
    expect(recalcAll(context).get('uses-no-yield')).toMatchObject({
      code: 'INVALID_YIELD',
    });
    noYield.subRecipeYield = { qty: 1, unit: 'g' };
    expect(recalcAll(context).get('mismatch')).toMatchObject({
      code: 'UNIT_MISMATCH',
    });
  });

  it('memakai cache batch dan menolak siklus saat dipanggil langsung', () => {
    const sub = makeRecipe('sub', [
      { refType: 'ingredient', refId: 'flour', quantity: 10, unit: 'g' },
    ]);
    sub.isSubRecipe = true;
    sub.subRecipeYield = { qty: 10, unit: 'g' };
    const parent = makeRecipe('parent', [
      { refType: 'recipe', refId: 'sub', quantity: 5, unit: 'g' },
      { refType: 'recipe', refId: 'sub', quantity: 5, unit: 'g' },
    ]);
    const ingredient = {
      id: 'flour',
      name: 'Tepung',
      buyPrice: 1000,
      packSize: 1000,
      buyUnit: 'g',
      customUnits: [],
    };
    const context = {
      ingredients: new Map([[ingredient.id, ingredient]]),
      recipes: new Map([
        [sub.id, sub],
        [parent.id, parent],
      ]),
      roundingStep: 500,
    };
    expect(batchCost(parent, context).toNumber()).toBe(10);

    const cyclic = makeRecipe('cyclic', [
      { refType: 'recipe', refId: 'cyclic', quantity: 1, unit: 'g' },
    ]);
    cyclic.subRecipeYield = { qty: 1, unit: 'g' };
    expect(() =>
      batchCost(cyclic, {
        ingredients: new Map(),
        recipes: new Map([[cyclic.id, cyclic]]),
        roundingStep: 500,
      }),
    ).toThrowError(expect.objectContaining({ code: 'CYCLE' }));
  });

  it('menolak biaya energi atau kemasan yang tidak valid', () => {
    const badEnergy = makeRecipe('bad-energy');
    badEnergy.energyPerBatch = -1;
    expect(
      recalcAll({
        ingredients: new Map(),
        recipes: new Map([[badEnergy.id, badEnergy]]),
        roundingStep: 500,
      }).get('bad-energy'),
    ).toMatchObject({ code: 'INVALID_INPUT' });
    const badPackaging = makeRecipe('bad-packaging');
    badPackaging.packagingPerPortion = -1;
    expect(
      recalcAll({
        ingredients: new Map(),
        recipes: new Map([[badPackaging.id, badPackaging]]),
        roundingStep: 500,
      }).get('bad-packaging'),
    ).toMatchObject({ code: 'INVALID_INPUT' });
  });
});
