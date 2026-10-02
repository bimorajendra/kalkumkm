import { recalcAll } from '@takaran/calc';
import { beforeAll, describe, expect, it } from 'vitest';
import { DomainError } from '@/domain/types';
import type { Db } from './db';
import { exportUserData, getSnapshot, runCommand } from './store';
import { createTestDb, createUser, makePro } from './test-db';

let db: Db;

beforeAll(async () => {
  db = await createTestDb();
  for (const id of ['ani', 'budi', 'cici', 'dedi', 'eko', 'fani', 'gita'])
    await createUser(db, id);
  await makePro(db, 'gita');
}, 30_000);

const flour = {
  name: 'Tepung terigu',
  buyPrice: 14_000,
  packSize: 1000,
  buyUnit: 'g',
  customUnits: [],
};

const recipeBase = {
  name: 'Adonan',
  yieldPortions: 4,
  items: [],
  packagingPerPortion: 0,
  energyPerBatch: 0,
  laborMinutesPerBatch: 0,
  laborRatePerHour: null,
  targetMarginBp: 4000,
  currentPrice: null,
  isSubRecipe: false,
  subRecipeYield: null,
};

const run = (userId: string, command: unknown) =>
  runCommand(db, userId, command);

async function rejects(promise: Promise<unknown>, code: string) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(DomainError);
  expect((error as DomainError).code).toBe(code);
}

describe('akun baru', () => {
  it('mendapat saluran Langsung otomatis dan paket gratis', async () => {
    const snapshot = await getSnapshot(db, 'ani');
    expect(snapshot.plan).toBe('free');
    expect(snapshot.channels.map((row) => row.name)).toEqual(['Langsung']);
    expect(await getSnapshot(db, 'ani')).toMatchObject({
      channels: [{ name: 'Langsung' }],
    });
  });
});

describe('isolasi antar pengguna', () => {
  it('tidak bisa membaca, mengubah, atau menghapus data pengguna lain', async () => {
    const own = await run('budi', { type: 'ingredient.create', input: flour });
    const id = own.ingredients[0]?.id ?? '';
    expect((await getSnapshot(db, 'cici')).ingredients).toHaveLength(0);

    await rejects(
      run('cici', { type: 'ingredient.price', id, buyPrice: 1 }),
      'NOT_FOUND',
    );
    await rejects(run('cici', { type: 'ingredient.delete', id }), 'NOT_FOUND');
    await rejects(
      run('cici', { type: 'ingredient.update', id, input: flour }),
      'NOT_FOUND',
    );
    expect((await getSnapshot(db, 'budi')).ingredients[0]?.buyPrice).toBe(
      14_000,
    );
  });

  it('resep pengguna lain tidak bisa dipakai sebagai bahan', async () => {
    const own = await run('budi', {
      type: 'ingredient.create',
      input: { ...flour, name: 'Gula' },
    });
    const id = own.ingredients.find((row) => row.name === 'Gula')?.id ?? '';
    await rejects(
      run('cici', {
        type: 'recipe.create',
        input: {
          ...recipeBase,
          items: [{ refType: 'ingredient', refId: id, quantity: 1, unit: 'g' }],
        },
      }),
      'MISSING_REF',
    );
  });

  it('ekspor hanya memuat data milik sendiri', async () => {
    const data = await exportUserData(db, 'budi');
    expect(data.ingredients.length).toBeGreaterThan(0);
    expect((await exportUserData(db, 'dedi')).ingredients).toHaveLength(0);
  });
});

describe('bahan', () => {
  it('menolak nama kembar tanpa membedakan huruf besar kecil', async () => {
    await run('dedi', { type: 'ingredient.create', input: flour });
    await rejects(
      run('dedi', {
        type: 'ingredient.create',
        input: { ...flour, name: 'tEpUnG tErIgU' },
      }),
      'DUPLICATE',
    );
  });

  it('mencatat riwayat harga dan melewati harga yang sama', async () => {
    const snapshot = await getSnapshot(db, 'dedi');
    const id = snapshot.ingredients[0]?.id ?? '';
    await run('dedi', { type: 'ingredient.price', id, buyPrice: 15_000 });
    await run('dedi', { type: 'ingredient.price', id, buyPrice: 15_000 });
    const data = await exportUserData(db, 'dedi');
    expect(data.priceHistory).toMatchObject([
      { ingredientId: id, oldPrice: 14_000, newPrice: 15_000 },
    ]);
  });

  it('menolak harga tidak valid dan input yang bukan perintah', async () => {
    const id = (await getSnapshot(db, 'dedi')).ingredients[0]?.id ?? '';
    await rejects(
      run('dedi', { type: 'ingredient.price', id, buyPrice: 0 }),
      'INVALID',
    );
    await rejects(
      run('dedi', { type: 'ingredient.price', id, buyPrice: 1.5 }),
      'INVALID',
    );
    await rejects(run('dedi', { type: 'hapus.semua' }), 'INVALID');
    await rejects(
      run('dedi', {
        type: 'ingredient.create',
        input: { ...flour, buyPrice: 'murah' },
      }),
      'INVALID',
    );
  });

  it('memblokir hapus dan ganti dimensi bahan yang dipakai resep', async () => {
    const id = (await getSnapshot(db, 'dedi')).ingredients[0]?.id ?? '';
    await run('dedi', {
      type: 'recipe.create',
      input: {
        ...recipeBase,
        items: [{ refType: 'ingredient', refId: id, quantity: 100, unit: 'g' }],
      },
    });
    await rejects(run('dedi', { type: 'ingredient.delete', id }), 'IN_USE');
    await rejects(
      run('dedi', {
        type: 'ingredient.update',
        id,
        input: { ...flour, buyUnit: 'pcs', packSize: 1 },
      }),
      'DIMENSION_IN_USE',
    );
  });
});

describe('resep', () => {
  it('membuat, mengubah, lalu menghapus resep beserta opsi penawarannya', async () => {
    const created = await run('gita', {
      type: 'recipe.create',
      input: recipeBase,
    });
    const recipe = created.recipes[0];
    if (!recipe) throw new Error('resep tidak dibuat');
    await run('gita', {
      type: 'quote.create',
      recipeId: recipe.id,
      input: { name: 'Pita', priceAdd: 500, costAdd: 100 },
    });
    await run('gita', {
      type: 'settings.update',
      values: { lastRecipeId: recipe.id },
    });
    const after = await run('gita', { type: 'recipe.delete', id: recipe.id });
    expect(after.recipes).toHaveLength(0);
    expect(after.quoteOptions).toHaveLength(0);
    expect(after.settings.lastRecipeId).toBeNull();
  });

  it('menolak hasil nol, bahan kembar, dan satuan beda dimensi', async () => {
    const id = (await getSnapshot(db, 'dedi')).ingredients[0]?.id ?? '';
    await rejects(
      run('gita', {
        type: 'recipe.create',
        input: { ...recipeBase, yieldPortions: 0 },
      }),
      'INVALID',
    );
    await rejects(
      run('dedi', {
        type: 'recipe.create',
        input: {
          ...recipeBase,
          items: [
            { refType: 'ingredient', refId: id, quantity: 1, unit: 'g' },
            { refType: 'ingredient', refId: id, quantity: 2, unit: 'kg' },
          ],
        },
      }),
      'INVALID',
    );
    await rejects(
      run('dedi', {
        type: 'recipe.create',
        input: {
          ...recipeBase,
          items: [
            { refType: 'ingredient', refId: id, quantity: 1, unit: 'ml' },
          ],
        },
      }),
      'INVALID',
    );
  });

  it('menyalin resep tanpa harga jual', async () => {
    await run('gita', {
      type: 'recipe.create',
      input: { ...recipeBase, name: 'Roti', currentPrice: 9000 },
    });
    const source = (await getSnapshot(db, 'gita')).recipes.find(
      (row) => row.name === 'Roti',
    );
    const copied = await run('gita', {
      type: 'recipe.duplicate',
      id: source?.id,
    });
    const copy = copied.recipes.find((row) => row.name === 'Roti (salinan)');
    expect(copy).toMatchObject({ currentPrice: null });
    expect(copy?.id).not.toBe(source?.id);
  });
});

describe('batas paket gratis', () => {
  it('membolehkan 3 resep lalu menolak yang keempat', async () => {
    for (const name of ['A', 'B', 'C'])
      await run('eko', {
        type: 'recipe.create',
        input: { ...recipeBase, name },
      });
    await rejects(
      run('eko', {
        type: 'recipe.create',
        input: { ...recipeBase, name: 'D' },
      }),
      'FREE_LIMIT',
    );
  });

  it('dua permintaan bersamaan tidak melewati batas', async () => {
    const results = await Promise.allSettled(
      ['A', 'B', 'C', 'D', 'E'].map((name) =>
        run('fani', { type: 'recipe.create', input: { ...recipeBase, name } }),
      ),
    );
    expect(results.filter((item) => item.status === 'fulfilled')).toHaveLength(
      3,
    );
    expect((await getSnapshot(db, 'fani')).recipes).toHaveLength(3);
  });

  it('menolak saluran tambahan, sub-resep, dan penawaran untuk paket gratis', async () => {
    await rejects(
      run('eko', {
        type: 'channel.create',
        input: { name: 'Ojol', kind: 'commission', rateBp: 2000 },
      }),
      'FREE_LIMIT',
    );
    await rejects(
      run('eko', {
        type: 'recipe.update',
        id: (await getSnapshot(db, 'eko')).recipes[0]?.id,
        input: {
          ...recipeBase,
          isSubRecipe: true,
          subRecipeYield: { qty: 500, unit: 'g' },
        },
      }),
      'PRO_REQUIRED',
    );
    await rejects(
      run('eko', {
        type: 'quote.create',
        recipeId: (await getSnapshot(db, 'eko')).recipes[0]?.id,
        input: { name: 'Pita', priceAdd: 1, costAdd: 1 },
      }),
      'PRO_REQUIRED',
    );
  });

  it('Pro bisa menambah saluran dan sub-resep', async () => {
    const channels = await run('gita', {
      type: 'channel.create',
      input: { name: 'Ojol', kind: 'commission', rateBp: 2000 },
    });
    expect(channels.channels.map((row) => row.name).sort()).toEqual([
      'Langsung',
      'Ojol',
    ]);
    const sub = await run('gita', {
      type: 'recipe.create',
      input: {
        ...recipeBase,
        name: 'Adonan dasar',
        isSubRecipe: true,
        subRecipeYield: { qty: 800, unit: 'g' },
      },
    });
    expect(sub.recipes.some((row) => row.isSubRecipe)).toBe(true);
  });
});

describe('sub-resep', () => {
  it('menolak siklus dan hapus sub-resep yang dipakai', async () => {
    const snapshot = await getSnapshot(db, 'gita');
    const base = snapshot.recipes.find((row) => row.name === 'Adonan dasar');
    if (!base) throw new Error('sub-resep tidak ada');
    const parent = await run('gita', {
      type: 'recipe.create',
      input: {
        ...recipeBase,
        name: 'Roti isi',
        isSubRecipe: true,
        subRecipeYield: { qty: 400, unit: 'g' },
        items: [
          { refType: 'recipe', refId: base.id, quantity: 400, unit: 'g' },
        ],
      },
    });
    const parentId = parent.recipes.find((row) => row.name === 'Roti isi')?.id;
    await rejects(
      run('gita', { type: 'recipe.delete', id: base.id }),
      'IN_USE',
    );
    const { id: _id, createdAt: _c, updatedAt: _u, ...input } = base;
    await rejects(
      run('gita', {
        type: 'recipe.update',
        id: base.id,
        input: {
          ...input,
          items: [
            { refType: 'recipe', refId: parentId, quantity: 1, unit: 'g' },
          ],
        },
      }),
      'INVALID',
    );
  });
});

describe('contoh brownies (PRD bagian 7)', () => {
  it('membuat resep contoh sekali dengan HPP Rp 2.925', async () => {
    const first = await run('ani', { type: 'recipe.seedExample' });
    const second = await run('ani', { type: 'recipe.seedExample' });
    expect(second.recipes).toHaveLength(1);
    expect(second.ingredients).toHaveLength(5);
    const recipe = first.recipes[0];
    const result = recalcAll({
      ingredients: new Map(second.ingredients.map((item) => [item.id, item])),
      recipes: new Map(second.recipes.map((item) => [item.id, item])),
      roundingStep: 500,
    }).get(recipe?.id ?? '');
    expect(result).not.toBeInstanceOf(Error);
    if (result && !(result instanceof Error))
      expect(result.hpp.toNumber()).toBe(2925);
  });
});

describe('alarm margin', () => {
  it('form ubah bahan mencatat harga dan alarm seperti ubah harga langsung', async () => {
    await createUser(db, 'ingredient-edit');
    const before = await run('ingredient-edit', { type: 'recipe.seedExample' });
    const egg = before.ingredients.find((row) => row.name === 'Telur');
    if (!egg) throw new Error('Telur tidak ada');
    const after = await run('ingredient-edit', {
      type: 'ingredient.update',
      id: egg.id,
      input: { ...egg, buyPrice: 2600 },
    });
    expect(after.priceHistory).toMatchObject([
      { ingredientId: egg.id, oldPrice: 2000, newPrice: 2600 },
    ]);
    expect(after.settings.marginAlarm?.recipeIds).toEqual([
      before.recipes[0]?.id,
    ]);
    const again = await run('ingredient-edit', {
      type: 'ingredient.update',
      id: egg.id,
      input: { ...egg, buyPrice: 2600, name: 'Telur ayam' },
    });
    expect(again.priceHistory).toHaveLength(1);
  });

  it('kemasan mengecil memicu alarm tanpa mengarang riwayat harga beli', async () => {
    await createUser(db, 'pack-edit');
    const before = await run('pack-edit', { type: 'recipe.seedExample' });
    const flour = before.ingredients.find(
      (row) => row.name === 'Tepung terigu',
    );
    if (!flour) throw new Error('Tepung tidak ada');
    const after = await run('pack-edit', {
      type: 'ingredient.update',
      id: flour.id,
      input: { ...flour, packSize: flour.packSize / 2 },
    });
    expect(after.settings.marginAlarm?.recipeIds).toEqual([
      before.recipes[0]?.id,
    ]);
    expect(after.priceHistory).toEqual([]);
  });

  it('kenaikan bahan lain tidak menghapus alarm yang belum ditangani', async () => {
    await createUser(db, 'alarm-merge');
    const before = await run('alarm-merge', { type: 'recipe.seedExample' });
    const egg = before.ingredients.find((row) => row.name === 'Telur');
    await run('alarm-merge', {
      type: 'ingredient.price',
      id: egg?.id,
      buyPrice: 2600,
    });
    const added = await run('alarm-merge', {
      type: 'ingredient.create',
      input: { ...flour, name: 'Bahan belum dipakai' },
    });
    const unused = added.ingredients.find(
      (row) => row.name === 'Bahan belum dipakai',
    );
    const after = await run('alarm-merge', {
      type: 'ingredient.price',
      id: unused?.id,
      buyPrice: 16000,
    });
    expect(after.settings.marginAlarm?.recipeIds).toEqual([
      before.recipes[0]?.id,
    ]);
  });

  it('menandai resep yang untungnya turun setelah harga bahan naik', async () => {
    const snapshot = await getSnapshot(db, 'ani');
    const egg = snapshot.ingredients.find((row) => row.name === 'Telur');
    const after = await run('ani', {
      type: 'ingredient.price',
      id: egg?.id,
      buyPrice: 6_000,
    });
    expect(after.settings.marginAlarm?.recipeIds).toEqual([
      snapshot.recipes[0]?.id,
    ]);
    const dismissed = await run('ani', { type: 'alarm.dismiss' });
    expect(dismissed.settings.marginAlarm?.dismissed).toBe(true);
  });
});

describe('perintah alarm dan perubahan sebagian', () => {
  it('memakai harga saran menghapus resep dari alarm dan menyimpan harga', async () => {
    const snapshot = await getSnapshot(db, 'ani');
    const recipe = snapshot.recipes[0];
    // Alarm dari tes sebelumnya sudah ditutup; picu lagi dengan kenaikan harga.
    const egg = snapshot.ingredients.find((row) => row.name === 'Telur');
    await run('ani', {
      type: 'ingredient.price',
      id: egg?.id,
      buyPrice: 7_000,
    });
    const after = await run('ani', {
      type: 'alarm.applyPrice',
      recipeId: recipe?.id,
      price: 8_000,
    });
    expect(after.recipes[0]?.currentPrice).toBe(8_000);
    expect(after.settings.marginAlarm).toBeNull();
  });

  it('recipe.patch mengubah slider tanpa mengubah isi resep dan menolak nilai buruk', async () => {
    const recipe = (await getSnapshot(db, 'ani')).recipes[0];
    const patched = await run('ani', {
      type: 'recipe.patch',
      id: recipe?.id,
      patch: { targetMarginBp: 5_000, laborMinutesPerBatch: 120 },
    });
    expect(patched.recipes[0]).toMatchObject({
      targetMarginBp: 5_000,
      laborMinutesPerBatch: 120,
      items: recipe?.items,
    });
    await rejects(
      run('ani', {
        type: 'recipe.patch',
        id: recipe?.id,
        patch: { targetMarginBp: 10_000 },
      }),
      'INVALID',
    );
  });
});
