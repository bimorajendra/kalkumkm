import {
  type CalcError,
  type Ingredient,
  type RecipeResult,
  recalcAll,
  toBaseUnits,
  unitPrice,
} from '@takaran/calc';
import { evaluateAffectedRecipes } from './alarm';
import {
  type Changes,
  type CommandContext,
  DomainError,
  type IngredientRow,
  type MarginAlarm,
  type RecipeRow,
  type Snapshot,
} from './types';

export type IngredientInput = Omit<Ingredient, 'id'>;

const MAX_PRICE = 100_000_000;

export function validateIngredientInput(input: IngredientInput): void {
  if (!input.name.trim() || input.name.trim().length > 60) {
    throw new DomainError('INVALID', 'Nama bahan harus 1 sampai 60 karakter.');
  }
  assertPrice(input.buyPrice);
  if (
    !Number.isFinite(input.packSize) ||
    input.packSize <= 0 ||
    !/^\d+(?:\.\d{1,3})?$/.test(String(input.packSize))
  ) {
    throw new DomainError(
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
      throw new DomainError(
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
    throw new DomainError(
      'INVALID',
      error instanceof Error ? error.message : 'Data bahan tidak valid.',
    );
  }
}

function assertPrice(price: number): void {
  if (!Number.isSafeInteger(price) || price < 1 || price > MAX_PRICE) {
    throw new DomainError(
      'INVALID',
      'Harga beli harus Rp 1 sampai Rp 100.000.000.',
    );
  }
}

function dimension(
  input: Pick<Ingredient, 'buyUnit' | 'customUnits' | 'packSize'>,
) {
  return toBaseUnits(input.packSize, input.buyUnit, input.customUnits).unit;
}

function sameName(left: string, right: string): boolean {
  return (
    left.trim().toLocaleLowerCase('id-ID') ===
    right.trim().toLocaleLowerCase('id-ID')
  );
}

function assertUniqueName(
  ingredients: IngredientRow[],
  name: string,
  exceptId?: string,
): void {
  if (
    ingredients.some((row) => row.id !== exceptId && sameName(row.name, name))
  )
    throw new DomainError('DUPLICATE', 'Nama bahan ini sudah ada.');
}

/** Jumlah resep yang memakai bahan ini, langsung atau lewat sub-resep. */
export function usageCount(recipes: RecipeRow[], id: string): number {
  const uses = (recipeId: string, visited: Set<string>): boolean => {
    if (visited.has(recipeId)) return false;
    visited.add(recipeId);
    const recipe = recipes.find((item) => item.id === recipeId);
    return (
      recipe?.items.some((item) =>
        item.refType === 'ingredient'
          ? item.refId === id
          : uses(item.refId, visited),
      ) ?? false
    );
  };
  return recipes.filter((recipe) => uses(recipe.id, new Set())).length;
}

export function createIngredient(
  snapshot: Snapshot,
  input: IngredientInput,
  context: CommandContext,
): Changes {
  const normalized = { ...input, name: input.name.trim() };
  validateIngredientInput(normalized);
  assertUniqueName(snapshot.ingredients, normalized.name);
  const row: IngredientRow = {
    id: context.newId(),
    ...normalized,
    createdAt: context.now,
    updatedAt: context.now,
  };
  return { ingredients: { put: [row] } };
}

export function updateIngredient(
  snapshot: Snapshot,
  id: string,
  input: IngredientInput,
  context: CommandContext,
): Changes {
  const normalized = { ...input, name: input.name.trim() };
  validateIngredientInput(normalized);
  const current = snapshot.ingredients.find((row) => row.id === id);
  if (!current) throw new DomainError('NOT_FOUND', 'Bahan tidak ditemukan.');
  assertUniqueName(snapshot.ingredients, normalized.name, id);
  if (
    usageCount(snapshot.recipes, id) > 0 &&
    dimension(current) !== dimension(normalized)
  ) {
    throw new DomainError(
      'DIMENSION_IN_USE',
      'Satuan dasar tidak bisa diubah karena bahan ini dipakai di resep.',
    );
  }
  const updated: IngredientRow = {
    ...current,
    ...normalized,
    updatedAt: context.now,
  };
  return { ingredients: { put: [updated] } };
}

export function updatePrice(
  snapshot: Snapshot,
  id: string,
  buyPrice: number,
  context: CommandContext,
): Changes {
  assertPrice(buyPrice);
  const current = snapshot.ingredients.find((row) => row.id === id);
  if (!current) throw new DomainError('NOT_FOUND', 'Bahan tidak ditemukan.');
  if (current.buyPrice === buyPrice) return {};
  const updated: IngredientRow = {
    ...current,
    buyPrice,
    updatedAt: context.now,
  };
  const changes: Changes = {
    ingredients: { put: [updated] },
    priceHistory: [
      {
        ingredientId: id,
        changedAt: context.now,
        oldPrice: current.buyPrice,
        newPrice: buyPrice,
      },
    ],
  };
  if (buyPrice > current.buyPrice) {
    const ingredients = snapshot.ingredients.map((row) =>
      row.id === id ? updated : row,
    );
    const results = recalcAll({
      ingredients: new Map(ingredients.map((item) => [item.id, item])),
      recipes: new Map(snapshot.recipes.map((item) => [item.id, item])),
      roundingStep: snapshot.settings.roundingStep,
    }) as Map<string, RecipeResult | CalcError>;
    const affected = evaluateAffectedRecipes(
      id,
      snapshot.recipes,
      results,
      snapshot.settings.roundingStep,
    );
    const alarm: MarginAlarm = {
      recipeIds: affected.map(({ recipe }) => recipe.id),
      triggeredBy: id,
      createdAt: context.now,
      dismissed: false,
    };
    changes.settings = { marginAlarm: alarm };
  }
  return changes;
}

export function deleteIngredient(snapshot: Snapshot, id: string): Changes {
  if (!snapshot.ingredients.some((row) => row.id === id))
    throw new DomainError('NOT_FOUND', 'Bahan tidak ditemukan.');
  const used = usageCount(snapshot.recipes, id);
  if (used > 0)
    throw new DomainError(
      'IN_USE',
      `Bahan ini dipakai di ${used} resep. Hapus dari resepnya dulu.`,
    );
  return { ingredients: { del: [id] } };
}
