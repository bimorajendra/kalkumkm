import type { Ingredient } from '@takaran/calc';
import { toBaseUnits, unitPrice } from '@takaran/calc';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { IngredientRow, PriceHistoryRow } from '../../db/schema';
import { createUlid } from '../../lib/ulid';

export type IngredientInput = Omit<Ingredient, 'id'>;

export class IngredientRepositoryError extends Error {
  constructor(
    readonly code:
      | 'DUPLICATE_NAME'
      | 'IN_USE'
      | 'DIMENSION_IN_USE'
      | 'NOT_FOUND'
      | 'INVALID',
    message: string,
  ) {
    super(message);
    this.name = 'IngredientRepositoryError';
  }
}

function validateInput(input: IngredientInput): void {
  if (!input.name.trim() || input.name.trim().length > 60) {
    throw new IngredientRepositoryError(
      'INVALID',
      'Nama bahan harus 1 sampai 60 karakter.',
    );
  }
  if (
    !Number.isSafeInteger(input.buyPrice) ||
    input.buyPrice < 1 ||
    input.buyPrice > 100_000_000
  ) {
    throw new IngredientRepositoryError(
      'INVALID',
      'Harga beli harus Rp 1 sampai Rp 100.000.000.',
    );
  }
  if (
    !Number.isFinite(input.packSize) ||
    input.packSize <= 0 ||
    !/^\d+(?:\.\d{1,3})?$/.test(String(input.packSize))
  ) {
    throw new IngredientRepositoryError(
      'INVALID',
      'Isi kemasan harus lebih dari 0 dan maksimal 3 angka desimal.',
    );
  }
  const fixedUnits = ['kg', 'g', 'l', 'ml', 'butir', 'pcs'];
  if (!fixedUnits.includes(input.buyUnit)) {
    const custom = input.customUnits.find(({ name }) => name === input.buyUnit);
    if (
      !custom ||
      !Number.isFinite(custom.qty) ||
      custom.qty <= 0 ||
      !['g', 'ml', 'pcs'].includes(custom.base)
    ) {
      throw new IngredientRepositoryError(
        'INVALID',
        'Satuan khusus perlu definisi isi dan satuan dasar.',
      );
    }
  }
  try {
    const pack = toBaseUnits(input.packSize, input.buyUnit, input.customUnits);
    if (!pack.quantity.gt(0))
      throw new Error('Isi kemasan harus lebih dari 0.');
    unitPrice({ id: '', ...input });
  } catch (error) {
    throw new IngredientRepositoryError(
      'INVALID',
      error instanceof Error ? error.message : 'Data bahan tidak valid.',
    );
  }
}

function dimension(
  input: Pick<Ingredient, 'buyUnit' | 'customUnits' | 'packSize'>,
) {
  return toBaseUnits(input.packSize, input.buyUnit, input.customUnits).unit;
}

async function assertUniqueName(
  name: string,
  exceptId?: string,
): Promise<void> {
  const existing = await db.ingredients.toArray();
  if (
    existing.some(
      (row) =>
        row.id !== exceptId &&
        row.name.trim().toLocaleLowerCase('id-ID') ===
          name.trim().toLocaleLowerCase('id-ID'),
    )
  ) {
    throw new IngredientRepositoryError(
      'DUPLICATE_NAME',
      'Nama bahan ini sudah ada.',
    );
  }
}

export async function listIngredients(query = ''): Promise<IngredientRow[]> {
  const normalized = query.trim().toLocaleLowerCase('id-ID');
  const rows = await db.ingredients.toArray();
  return rows
    .filter(
      (row) =>
        !normalized || row.name.toLocaleLowerCase('id-ID').includes(normalized),
    )
    .sort((left, right) => left.name.localeCompare(right.name, 'id'));
}

export async function usageCount(id: string): Promise<number> {
  const recipes = await db.recipes.toArray();
  return recipes.filter((recipe) =>
    recipe.items.some(
      (item) => item.refType === 'ingredient' && item.refId === id,
    ),
  ).length;
}

export async function listIngredientUsage(
  query = '',
): Promise<Array<{ ingredient: IngredientRow; usageCount: number }>> {
  const ingredients = await listIngredients(query);
  const counts = await Promise.all(ingredients.map(({ id }) => usageCount(id)));
  return ingredients.map((ingredient, index) => ({
    ingredient,
    usageCount: counts[index] ?? 0,
  }));
}

export function useIngredients(query: string) {
  return useLiveQuery(
    () =>
      listIngredientUsage(query)
        .then((data) => ({ data }))
        .catch(() => ({ data: [], error: true as const })),
    [query],
    { data: [] },
  );
}

export async function createIngredient(
  input: IngredientInput,
): Promise<IngredientRow> {
  const name = input.name.trim();
  const normalized = { ...input, name };
  validateInput(normalized);
  const now = new Date().toISOString();
  const row: IngredientRow = {
    id: createUlid(),
    ...normalized,
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction('rw', db.ingredients, async () => {
    await assertUniqueName(name);
    await db.ingredients.add(row);
  });
  return row;
}

export async function updateIngredient(
  id: string,
  input: IngredientInput,
): Promise<IngredientRow> {
  const name = input.name.trim();
  const normalized = { ...input, name };
  validateInput(normalized);
  let updated: IngredientRow | undefined;
  await db.transaction('rw', db.ingredients, db.recipes, async () => {
    const current = await db.ingredients.get(id);
    if (!current)
      throw new IngredientRepositoryError(
        'NOT_FOUND',
        'Bahan tidak ditemukan.',
      );
    await assertUniqueName(name, id);
    const used = (await usageCount(id)) > 0;
    if (used && dimension(current) !== dimension(normalized)) {
      throw new IngredientRepositoryError(
        'DIMENSION_IN_USE',
        'Satuan dasar tidak bisa diubah karena bahan ini dipakai di resep.',
      );
    }
    updated = {
      ...current,
      ...normalized,
      updatedAt: new Date().toISOString(),
    };
    await db.ingredients.put(updated);
  });
  if (!updated)
    throw new IngredientRepositoryError('NOT_FOUND', 'Bahan tidak ditemukan.');
  return updated;
}

export async function updatePrice(id: string, buyPrice: number): Promise<void> {
  if (
    !Number.isSafeInteger(buyPrice) ||
    buyPrice < 1 ||
    buyPrice > 100_000_000
  ) {
    throw new IngredientRepositoryError(
      'INVALID',
      'Harga beli harus Rp 1 sampai Rp 100.000.000.',
    );
  }
  await db.transaction('rw', db.ingredients, db.priceHistory, async () => {
    const current = await db.ingredients.get(id);
    if (!current)
      throw new IngredientRepositoryError(
        'NOT_FOUND',
        'Bahan tidak ditemukan.',
      );
    if (current.buyPrice === buyPrice) return;
    const history: PriceHistoryRow = {
      ingredientId: id,
      changedAt: new Date().toISOString(),
      oldPrice: current.buyPrice,
      newPrice: buyPrice,
    };
    await db.ingredients.update(id, { buyPrice, updatedAt: history.changedAt });
    await db.priceHistory.add(history);
  });
}

export async function deleteIngredient(id: string): Promise<void> {
  await db.transaction('rw', db.ingredients, db.recipes, async () => {
    const used = await usageCount(id);
    if (used > 0)
      throw new IngredientRepositoryError(
        'IN_USE',
        `Bahan ini dipakai di ${used} resep. Hapus dari resepnya dulu.`,
      );
    await db.ingredients.delete(id);
  });
}

export async function claimFirstIngredientEvent(): Promise<boolean> {
  return db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get('firstIngredientAddedAt');
    if (existing?.value) return false;
    await db.settings.put({
      key: 'firstIngredientAddedAt',
      value: new Date().toISOString(),
    });
    return true;
  });
}
