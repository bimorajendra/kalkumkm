import type { Recipe } from '@takaran/calc';
import { findCycles, toBaseUnits } from '@takaran/calc';
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
    readonly code: 'INVALID' | 'NOT_FOUND' | 'MISSING_REF' | 'IN_USE',
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
  if ((input.isSubRecipe || hasRecipeRefs(input)) && !isPro)
    throw new ProRequiredError('sub_recipe');
  await db.transaction('rw', db.ingredients, db.recipes, async () => {
    await validateRecipe(input, row.id);
    await assertCanCreate('recipe', isPro);
    await db.recipes.add(row);
  });
  return row;
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<RecipeRow> {
  const isPro = await hasProLicense();
  if ((input.isSubRecipe || hasRecipeRefs(input)) && !isPro)
    throw new ProRequiredError('sub_recipe');
  let saved: RecipeRow | undefined;
  await db.transaction('rw', db.ingredients, db.recipes, async () => {
    const existing = await db.recipes.get(id);
    if (!existing)
      throw new RecipeRepositoryError('NOT_FOUND', 'Resep tidak ditemukan.');
    await validateRecipe(input, id);
    const parents = await recipesUsing(id);
    if (
      parents.length > 0 &&
      (!input.isSubRecipe ||
        !input.subRecipeYield ||
        !existing.subRecipeYield ||
        unitDimension(input.subRecipeYield.unit) !==
          unitDimension(existing.subRecipeYield.unit))
    ) {
      throw new RecipeRepositoryError(
        'IN_USE',
        `Sub-resep ini dipakai di ${parents.length} resep. Hapus dari resep tersebut sebelum mengubah jenis atau satuan hasilnya.`,
      );
    }
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
      const parents = await recipesUsing(id);
      if (parents.length > 0)
        throw new RecipeRepositoryError(
          'IN_USE',
          `Sub-resep ini dipakai di ${parents.length} resep. Hapus dari resep tersebut dulu.`,
        );
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
  const recipes = new Map(
    (await db.recipes.toArray()).map((recipe) => [recipe.id, recipe]),
  );
  const items = parsed.items.map((item) => {
    if (item.refType === 'ingredient') {
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
    } else {
      const recipe = recipes.get(item.refId);
      if (!recipe?.isSubRecipe || !recipe.subRecipeYield)
        throw new RecipeRepositoryError(
          'MISSING_REF',
          'Sub-resep ini sudah dihapus atau tidak tersedia.',
        );
      if (
        unitDimension(item.unit) !== unitDimension(recipe.subRecipeYield.unit)
      )
        throw new RecipeRepositoryError(
          'INVALID',
          `Satuan ${item.unit} tidak cocok dengan ${recipe.name}.`,
        );
    }
    return { ...item };
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
    isSubRecipe: parsed.isSubRecipe,
    subRecipeYield: parsed.isSubRecipe
      ? { qty: parsed.subRecipeYieldQty, unit: parsed.subRecipeYieldUnit }
      : null,
  };
}

async function validateRecipe(input: RecipeInput, id: string): Promise<void> {
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
  const refs = input.items.map((item) => `${item.refType}:${item.refId}`);
  if (new Set(refs).size !== refs.length)
    throw new RecipeRepositoryError(
      'INVALID',
      'Bahan yang sama atau sub-resep yang sama cukup ditambahkan sekali.',
    );
  if (
    input.isSubRecipe !== Boolean(input.subRecipeYield) ||
    (input.subRecipeYield &&
      (!Number.isFinite(input.subRecipeYield.qty) ||
        input.subRecipeYield.qty <= 0 ||
        !isKnownUnit(input.subRecipeYield.unit)))
  )
    throw new RecipeRepositoryError('INVALID', 'Hasil sub-resep tidak valid.');
  const ingredients = new Map(
    (await db.ingredients.toArray()).map((ingredient) => [
      ingredient.id,
      ingredient,
    ]),
  );
  const recipes = new Map(
    (await db.recipes.toArray()).map((recipe) => [recipe.id, recipe]),
  );
  for (const item of input.items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0)
      throw new RecipeRepositoryError('INVALID', 'Takaran harus lebih dari 0.');
    try {
      if (item.refType === 'ingredient') {
        const ingredient = ingredients.get(item.refId);
        if (!ingredient)
          throw new RecipeRepositoryError(
            'MISSING_REF',
            'Bahan ini sudah dihapus.',
          );
        if (
          toBaseUnits(1, ingredient.buyUnit, ingredient.customUnits).unit !==
          toBaseUnits(1, item.unit, ingredient.customUnits).unit
        )
          throw new Error();
      } else {
        const subRecipe = recipes.get(item.refId);
        if (!subRecipe?.isSubRecipe || !subRecipe.subRecipeYield)
          throw new RecipeRepositoryError(
            'MISSING_REF',
            'Sub-resep ini sudah dihapus atau tidak tersedia.',
          );
        if (
          unitDimension(item.unit) !==
          unitDimension(subRecipe.subRecipeYield.unit)
        )
          throw new Error();
      }
    } catch (error) {
      if (error instanceof RecipeRepositoryError) throw error;
      throw new RecipeRepositoryError(
        'INVALID',
        'Satuan takaran tidak cocok dengan bahan.',
      );
    }
  }
  const candidate: Recipe = { ...input, id };
  const graph: Recipe[] = [...recipes.values()].filter(
    (recipe) => recipe.id !== id,
  );
  graph.push(candidate);
  if (findCycles(graph).some((cycle) => cycle.includes(id)))
    throw new RecipeRepositoryError(
      'INVALID',
      'Adonan dasar tidak bisa memakai dirinya sendiri.',
    );
}

function hasRecipeRefs(input: RecipeInput): boolean {
  return input.items.some((item) => item.refType === 'recipe');
}

function isKnownUnit(unit: string): boolean {
  try {
    toBaseUnits(1, unit);
    return true;
  } catch {
    return false;
  }
}

function unitDimension(unit: string): string {
  return toBaseUnits(1, unit).unit;
}

async function recipesUsing(id: string): Promise<RecipeRow[]> {
  const recipes = await db.recipes.toArray();
  const uses = (
    recipe: RecipeRow,
    target: string,
    visited: Set<string>,
  ): boolean => {
    if (visited.has(recipe.id)) return false;
    visited.add(recipe.id);
    return recipe.items.some((item) => {
      if (item.refType !== 'recipe') return false;
      if (item.refId === target) return true;
      const child = recipes.find((entry) => entry.id === item.refId);
      return child ? uses(child, target, visited) : false;
    });
  };
  return recipes.filter(
    (recipe) => recipe.id !== id && uses(recipe, id, new Set()),
  );
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
