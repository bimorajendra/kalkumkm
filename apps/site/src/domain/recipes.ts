import { findCycles, type Recipe, toBaseUnits } from '@takaran/calc';
import { assertCanCreate } from './limits';
import {
  type Changes,
  type CommandContext,
  DomainError,
  type RecipeRow,
  type Snapshot,
} from './types';

export type RecipeInput = Omit<Recipe, 'id'>;

const hasRecipeRefs = (input: RecipeInput) =>
  input.items.some((item) => item.refType === 'recipe');

function unitDimension(unit: string): string {
  return toBaseUnits(1, unit).unit;
}

function isKnownUnit(unit: string): boolean {
  try {
    toBaseUnits(1, unit);
    return true;
  } catch {
    return false;
  }
}

function assertProForSubRecipe(snapshot: Snapshot, input: RecipeInput) {
  if ((input.isSubRecipe || hasRecipeRefs(input)) && snapshot.plan !== 'pro')
    throw new DomainError(
      'PRO_REQUIRED',
      'Fitur subresep ada di Takaran Pro.',
      'sub_recipe',
    );
}

/** Resep lain yang memakai resep ini sebagai bahan, langsung atau bertingkat. */
export function recipesUsing(recipes: RecipeRow[], id: string): RecipeRow[] {
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

export function validateRecipe(
  snapshot: Snapshot,
  input: RecipeInput,
  id: string,
): void {
  if (
    !input.name.trim() ||
    input.name.trim().length > 60 ||
    !Number.isInteger(input.yieldPortions) ||
    input.yieldPortions < 1 ||
    input.yieldPortions > 10_000
  ) {
    throw new DomainError(
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
    throw new DomainError(
      'INVALID',
      'Biaya dan waktu harus berupa bilangan bulat nol atau lebih.',
    );
  }
  if (
    !Number.isSafeInteger(input.targetMarginBp) ||
    input.targetMarginBp < 0 ||
    input.targetMarginBp >= 10_000 ||
    (input.currentPrice !== null &&
      (!Number.isSafeInteger(input.currentPrice) || input.currentPrice < 0))
  ) {
    throw new DomainError(
      'INVALID',
      'Target untung atau harga jual tidak valid.',
    );
  }
  const refs = input.items.map((item) => `${item.refType}:${item.refId}`);
  if (new Set(refs).size !== refs.length)
    throw new DomainError(
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
    throw new DomainError('INVALID', 'Hasil sub-resep tidak valid.');

  const ingredients = new Map(snapshot.ingredients.map((row) => [row.id, row]));
  const recipes = new Map(snapshot.recipes.map((row) => [row.id, row]));
  for (const item of input.items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0)
      throw new DomainError('INVALID', 'Takaran harus lebih dari 0.');
    if (item.refType === 'ingredient') {
      const ingredient = ingredients.get(item.refId);
      if (!ingredient)
        throw new DomainError('MISSING_REF', 'Bahan ini sudah dihapus.');
      try {
        if (
          toBaseUnits(1, ingredient.buyUnit, ingredient.customUnits).unit !==
          toBaseUnits(1, item.unit, ingredient.customUnits).unit
        )
          throw new Error();
      } catch {
        throw new DomainError(
          'INVALID',
          `Satuan ${item.unit} tidak cocok dengan ${ingredient.name}.`,
        );
      }
    } else {
      const sub = recipes.get(item.refId);
      if (!sub?.isSubRecipe || !sub.subRecipeYield)
        throw new DomainError(
          'MISSING_REF',
          'Sub-resep ini sudah dihapus atau tidak tersedia.',
        );
      try {
        if (unitDimension(item.unit) !== unitDimension(sub.subRecipeYield.unit))
          throw new Error();
      } catch {
        throw new DomainError(
          'INVALID',
          `Satuan ${item.unit} tidak cocok dengan ${sub.name}.`,
        );
      }
    }
  }
  const candidate: Recipe = { ...input, id };
  const graph: Recipe[] = snapshot.recipes.filter((recipe) => recipe.id !== id);
  graph.push(candidate);
  if (findCycles(graph).some((cycle) => cycle.includes(id)))
    throw new DomainError(
      'INVALID',
      'Adonan dasar tidak bisa memakai dirinya sendiri.',
    );
}

export function createRecipe(
  snapshot: Snapshot,
  input: RecipeInput,
  context: CommandContext,
): Changes {
  assertProForSubRecipe(snapshot, input);
  const row: RecipeRow = {
    ...input,
    id: context.newId(),
    createdAt: context.now,
    updatedAt: context.now,
  };
  validateRecipe(snapshot, input, row.id);
  assertCanCreate(snapshot, 'recipe');
  return { recipes: { put: [row] } };
}

export function updateRecipe(
  snapshot: Snapshot,
  id: string,
  input: RecipeInput,
  context: CommandContext,
): Changes {
  assertProForSubRecipe(snapshot, input);
  const existing = snapshot.recipes.find((row) => row.id === id);
  if (!existing) throw new DomainError('NOT_FOUND', 'Resep tidak ditemukan.');
  validateRecipe(snapshot, input, id);
  const parents = recipesUsing(snapshot.recipes, id);
  if (
    parents.length > 0 &&
    (!input.isSubRecipe ||
      !input.subRecipeYield ||
      !existing.subRecipeYield ||
      unitDimension(input.subRecipeYield.unit) !==
        unitDimension(existing.subRecipeYield.unit))
  ) {
    throw new DomainError(
      'IN_USE',
      `Sub-resep ini dipakai di ${parents.length} resep. Hapus dari resep tersebut sebelum mengubah jenis atau satuan hasilnya.`,
    );
  }
  const saved: RecipeRow = {
    ...input,
    id,
    createdAt: existing.createdAt,
    updatedAt: context.now,
  };
  return { recipes: { put: [saved] } };
}

/** Ubah sebagian isian resep (slider, harga jual) lewat validasi yang sama. */
export function patchRecipe(
  snapshot: Snapshot,
  id: string,
  patch: Partial<
    Pick<Recipe, 'targetMarginBp' | 'laborMinutesPerBatch' | 'currentPrice'>
  >,
  context: CommandContext,
): Changes {
  const existing = snapshot.recipes.find((row) => row.id === id);
  if (!existing) throw new DomainError('NOT_FOUND', 'Resep tidak ditemukan.');
  const {
    id: _id,
    createdAt: _created,
    updatedAt: _updated,
    ...rest
  } = existing;
  return updateRecipe(snapshot, id, { ...rest, ...patch }, context);
}

export function duplicateRecipe(
  snapshot: Snapshot,
  id: string,
  context: CommandContext,
): Changes {
  const source = snapshot.recipes.find((row) => row.id === id);
  if (!source) throw new DomainError('NOT_FOUND', 'Resep tidak ditemukan.');
  const suffix = ' (salinan)';
  const { id: _id, createdAt: _created, updatedAt: _updated, ...rest } = source;
  return createRecipe(
    snapshot,
    {
      ...rest,
      name: `${source.name.slice(0, 60 - suffix.length)}${suffix}`,
      items: source.items.map((item) => ({ ...item })),
      currentPrice: null,
    },
    context,
  );
}

export function deleteRecipe(snapshot: Snapshot, id: string): Changes {
  if (!snapshot.recipes.some((row) => row.id === id))
    throw new DomainError('NOT_FOUND', 'Resep tidak ditemukan.');
  const parents = recipesUsing(snapshot.recipes, id);
  if (parents.length > 0)
    throw new DomainError(
      'IN_USE',
      `Sub-resep ini dipakai di ${parents.length} resep. Hapus dari resep tersebut dulu.`,
    );
  return {
    recipes: { del: [id] },
    quoteOptions: {
      del: snapshot.quoteOptions
        .filter((option) => option.recipeId === id)
        .map((option) => option.id),
    },
    ...(snapshot.settings.lastRecipeId === id
      ? { settings: { lastRecipeId: null } }
      : {}),
  };
}
