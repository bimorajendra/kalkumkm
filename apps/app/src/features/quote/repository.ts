import { db } from '../../db/db';
import type { QuoteOptionRow } from '../../db/schema';
import { createUlid } from '../../lib/ulid';
import { hasProLicense, ProRequiredError } from '../license/limits';
import { type QuoteOptionInput, quoteOptionSchema } from './schema';

export class QuoteRepositoryError extends Error {
  constructor(
    readonly code: 'INVALID' | 'NOT_FOUND' | 'RECIPE_NOT_FOUND',
    message: string,
  ) {
    super(message);
    this.name = 'QuoteRepositoryError';
  }
}

export async function listQuoteOptions(
  recipeId: string,
): Promise<QuoteOptionRow[]> {
  await requirePro();
  return (
    await db.quoteOptions.where('recipeId').equals(recipeId).toArray()
  ).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function createQuoteOption(
  recipeId: string,
  input: QuoteOptionInput,
): Promise<QuoteOptionRow> {
  await requirePro();
  const value = validate(input);
  const now = new Date().toISOString();
  const row: QuoteOptionRow = {
    ...value,
    id: createUlid(),
    recipeId,
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction('rw', db.recipes, db.quoteOptions, async () => {
    if (!(await db.recipes.get(recipeId)))
      throw new QuoteRepositoryError(
        'RECIPE_NOT_FOUND',
        'Resep tidak ditemukan.',
      );
    await db.quoteOptions.add(row);
  });
  return row;
}

export async function updateQuoteOption(
  id: string,
  input: QuoteOptionInput,
): Promise<QuoteOptionRow> {
  await requirePro();
  const value = validate(input);
  const current = await db.quoteOptions.get(id);
  if (!current)
    throw new QuoteRepositoryError('NOT_FOUND', 'Opsi tidak ditemukan.');
  const saved = { ...current, ...value, updatedAt: new Date().toISOString() };
  await db.quoteOptions.put(saved);
  return saved;
}

export async function deleteQuoteOption(id: string): Promise<void> {
  await requirePro();
  const current = await db.quoteOptions.get(id);
  if (!current)
    throw new QuoteRepositoryError('NOT_FOUND', 'Opsi tidak ditemukan.');
  await db.quoteOptions.delete(id);
}

async function requirePro(): Promise<void> {
  if (!(await hasProLicense())) throw new ProRequiredError('quote');
}

function validate(input: QuoteOptionInput): QuoteOptionInput {
  const parsed = quoteOptionSchema.safeParse(input);
  if (!parsed.success)
    throw new QuoteRepositoryError(
      'INVALID',
      parsed.error.issues[0]?.message ?? 'Data opsi tidak valid.',
    );
  return parsed.data;
}
