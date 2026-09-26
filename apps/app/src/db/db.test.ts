import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { db, TakaranDatabase } from './db';

afterEach(async () => {
  db.close();
  await db.delete();
});

describe('Dexie v2', () => {
  it('creates all six stores and their indexed fields', async () => {
    await db.open();

    expect(db.tables.map(({ name }) => name).sort()).toEqual([
      'channels',
      'ingredients',
      'priceHistory',
      'quoteOptions',
      'recipes',
      'settings',
    ]);
    const indexes = Object.fromEntries(
      db.tables.map((table) => [
        table.name,
        table.schema.indexes.map(({ name }) => name),
      ]),
    );
    expect(indexes).toEqual({
      channels: ['name'],
      ingredients: ['name', 'updatedAt'],
      priceHistory: ['ingredientId', 'changedAt'],
      quoteOptions: ['recipeId'],
      recipes: ['name', 'isSubRecipe', 'updatedAt'],
      settings: [],
    });
  });

  it('writes and reads a row while keeping amounts as integer rupiah', async () => {
    await db.open();
    const now = new Date().toISOString();
    await db.ingredients.add({
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      name: 'Tepung terigu',
      buyPrice: 14000,
      packSize: 1000,
      buyUnit: 'g',
      customUnits: [],
      createdAt: now,
      updatedAt: now,
    });

    expect(
      await db.ingredients.get('01ARZ3NDEKTSV4RRFFQ69G5FAV'),
    ).toMatchObject({ name: 'Tepung terigu', buyPrice: 14000, packSize: 1000 });
  });

  it('migrates v1 price history field names without losing values', async () => {
    const name = 'takaran-v1-migration';
    const legacy = new Dexie(name);
    legacy.version(1).stores({
      ingredients: 'id, name, updatedAt',
      recipes: 'id, name, isSubRecipe, updatedAt',
      channels: 'id, name',
      quoteOptions: 'id, recipeId',
      priceHistory: '++id, ingredientId, changedAt',
      settings: 'key',
    });
    await legacy.open();
    await legacy.table('priceHistory').add({
      ingredientId: 'ingredient-1',
      changedAt: '2026-01-01T00:00:00.000Z',
      previousBuyPrice: 10_000,
      buyPrice: 11_000,
    });
    legacy.close();

    const migrated = new TakaranDatabase(name);
    await migrated.open();
    expect(await migrated.priceHistory.toArray()).toMatchObject([
      { ingredientId: 'ingredient-1', oldPrice: 10_000, newPrice: 11_000 },
    ]);
    await migrated.delete();
  });
});
