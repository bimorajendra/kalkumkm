import type { Recipe } from '@takaran/calc';
import { toBaseUnits } from '@takaran/calc';
import { db } from '../../db/db';
import type { RecipeRow } from '../../db/schema';
import { createUlid } from '../../lib/ulid';
import {
  assertCanCreate,
  hasProLicense,
  ProRequiredError,
} from '../license/limits';
import type { ParsedRecipeFormValues } from './schema';

export class RecipeRepositoryError extends Error {
  constructor(
    readonly code: 'INVALID' | 'NOT_FOUND' | 'MISSING_REF',
    message: string,
  ) {
    super(message);
    this.name = 'RecipeRepositoryError';
  }
}

export type RecipeInput = Omit<Recipe, 'id'>;

export async function listRecipes(): Promise<RecipeRow[]> {
  return (await db.recipes.toArray()).sort((a, b) =>
    a.name.localeCompare(b.name, 'id'),
  );
}

export async function getRecipe(id: string): Promise<RecipeRow | undefined> {
  return db.recipes.get(id);
}

export async function createRecipe(input: RecipeInput): Promise<RecipeRow> {
  const now = new Date().toISOString();
  const row: RecipeRow = {
    ...input,
    id: createUlid(),
    createdAt: now,
    updatedAt: now,
  };
  const isPro = await hasProLicense();
  if (input.isSubRecipe && !isPro) throw new ProRequiredError();
  await db.transaction('rw', db.ingredients, db.recipes, async () => {
    await validateRecipe(input);
    await assertCanCreate('recipe', isPro);
    await db.recipes.add(row);
  });
  return row;
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<RecipeRow> {
  let saved: RecipeRow | undefined;
  await db.transaction('rw', db.ingredients, db.recipes, async () => {
    await validateRecipe(input);
    const existing = await db.recipes.get(id);
    if (!existing)
      throw new RecipeRepositoryError('NOT_FOUND', 'Resep tidak ditemukan.');
    saved = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await db.recipes.put(saved);
  });
  if (!saved)
    throw new RecipeRepositoryError('NOT_FOUND', 'Resep tidak ditemukan.');
  return saved;
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.recipes,
    db.quoteOptions,
    db.settings,
    async () => {
      await db.recipes.delete(id);
      await db.quoteOptions.where('recipeId').equals(id).delete();
      const lastRecipe = await db.settings.get('lastRecipeId');
      if (lastRecipe?.value === id)
        await db.settings.put({ key: 'lastRecipeId', value: null });
    },
  );
}

export async function recipeInputFromForm(
  parsed: ParsedRecipeFormValues,
): Promise<RecipeInput> {
  const ingredients = new Map(
    (await db.ingredients.toArray()).map((ingredient) => [
      ingredient.id,
      ingredient,
    ]),
  );
  const items = parsed.items.map((item) => {
    const ingredient = ingredients.get(item.refId);
    if (!ingredient)
      throw new RecipeRepositoryError(
        'MISSING_REF',
        'Bahan ini sudah dihapus.',
      );
    const expected = toBaseUnits(
      1,
      ingredient.buyUnit,
      ingredient.customUnits,
    ).unit;
    const actual = toBaseUnits(1, item.unit, ingredient.customUnits).unit;
    if (expected !== actual)
      throw new RecipeRepositoryError(
        'INVALID',
        `Satuan ${item.unit} tidak cocok dengan ${ingredient.name}.`,
      );
    return {
      refType: 'ingredient' as const,
      refId: item.refId,
      quantity: item.quantity,
      unit: item.unit,
    };
  });
  return {
    name: parsed.name,
    yieldPortions: parsed.yieldPortions,
    items,
    packagingPerPortion: parsed.packagingPerPortion,
    energyPerBatch: parsed.energyPerBatch,
    laborMinutesPerBatch: parsed.laborMinutesPerBatch,
    laborRatePerHour: parsed.laborRatePerHour,
    targetMarginBp: await db.settings
      .get('defaultMarginBp')
      .then((row) => (typeof row?.value === 'number' ? row.value : 4000)),
    currentPrice: null,
    isSubRecipe: false,
    subRecipeYield: null,
  };
}

async function validateRecipe(input: RecipeInput): Promise<void> {
  if (
    !input.name.trim() ||
    input.name.trim().length > 60 ||
    !Number.isInteger(input.yieldPortions) ||
    input.yieldPortions < 1 ||
    input.yieldPortions > 10_000
  ) {
    throw new RecipeRepositoryError(
      'INVALID',
      'Nama wajib diisi dan hasil harus 1 sampai 10.000 porsi.',
    );
  }
  if (
    [
      input.packagingPerPortion,
      input.energyPerBatch,
      input.laborMinutesPerBatch,
    ].some((value) => !Number.isSafeInteger(value) || value < 0) ||
    (input.laborRatePerHour !== null &&
      (!Number.isSafeInteger(input.laborRatePerHour) ||
        input.laborRatePerHour < 0))
  ) {
    throw new RecipeRepositoryError(
      'INVALID',
      'Biaya dan waktu harus berupa bilangan bulat nol atau lebih.',
    );
  }
  const refs = input.items.map((item) => item.refId);
  if (new Set(refs).size !== refs.length)
    throw new RecipeRepositoryError(
      'INVALID',
      'Bahan yang sama cukup ditambahkan sekali.',
    );
  const ingredients = new Map(
    (await db.ingredients.toArray()).map((ingredient) => [
      ingredient.id,
      ingredient,
    ]),
  );
  for (const item of input.items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0)
      throw new RecipeRepositoryError('INVALID', 'Takaran harus lebih dari 0.');
    const ingredient = ingredients.get(item.refId);
    if (!ingredient)
      throw new RecipeRepositoryError(
        'MISSING_REF',
        'Bahan ini sudah dihapus.',
      );
    try {
      if (
        toBaseUnits(1, ingredient.buyUnit, ingredient.customUnits).unit !==
        toBaseUnits(1, item.unit, ingredient.customUnits).unit
      )
        throw new Error();
    } catch {
      throw new RecipeRepositoryError(
        'INVALID',
        'Satuan takaran tidak cocok dengan bahan.',
      );
    }
  }
}

export async function claimFirstHppEvent(): Promise<{
  first: boolean;
  secondsBucket: 'lt_5' | '5_30' | 'gt_30';
}> {
  return db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get('hppFirstShownAt');
    const opened = await db.settings.get('firstOpenedAt');
    const openedTime =
      typeof opened?.value === 'string' ? Date.parse(opened.value) : Number.NaN;
    const elapsed = Number.isFinite(openedTime)
      ? Math.max(0, Date.now() - openedTime) / 1000
      : 0;
    const secondsBucket =
      elapsed < 5 ? 'lt_5' : elapsed <= 30 ? '5_30' : 'gt_30';
    if (existing?.value) return { first: false, secondsBucket };
    await db.settings.put({
      key: 'hppFirstShownAt',
      value: new Date().toISOString(),
    });
    return { first: true, secondsBucket };
  });
}
