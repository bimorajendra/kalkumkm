import * as z from 'zod';
import { assertPro } from './limits';
import {
  type Changes,
  type CommandContext,
  DomainError,
  type QuoteOptionRow,
  type Snapshot,
} from './types';

export const quoteOptionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama opsi perlu diisi.')
    .max(40, 'Nama opsi maksimal 40 karakter.'),
  priceAdd: z
    .number()
    .int('Tambahan harga harus rupiah bulat.')
    .safe('Tambahan harga terlalu besar.')
    .min(0, 'Tambahan harga tidak boleh kurang dari Rp 0.'),
  costAdd: z
    .number()
    .int('Tambahan biaya harus rupiah bulat.')
    .safe('Tambahan biaya terlalu besar.')
    .min(0, 'Tambahan biaya tidak boleh kurang dari Rp 0.'),
});

export type QuoteOptionInput = z.infer<typeof quoteOptionSchema>;

function validate(input: QuoteOptionInput): QuoteOptionInput {
  const parsed = quoteOptionSchema.safeParse(input);
  if (!parsed.success)
    throw new DomainError(
      'INVALID',
      parsed.error.issues[0]?.message ?? 'Data opsi tidak valid.',
    );
  return parsed.data;
}

export function createQuoteOption(
  snapshot: Snapshot,
  recipeId: string,
  input: QuoteOptionInput,
  context: CommandContext,
): Changes {
  assertPro(snapshot, 'quote');
  const value = validate(input);
  if (!snapshot.recipes.some((recipe) => recipe.id === recipeId))
    throw new DomainError('NOT_FOUND', 'Resep tidak ditemukan.');
  const row: QuoteOptionRow = {
    ...value,
    id: context.newId(),
    recipeId,
    createdAt: context.now,
    updatedAt: context.now,
  };
  return { quoteOptions: { put: [row] } };
}

export function updateQuoteOption(
  snapshot: Snapshot,
  id: string,
  input: QuoteOptionInput,
  context: CommandContext,
): Changes {
  assertPro(snapshot, 'quote');
  const value = validate(input);
  const current = snapshot.quoteOptions.find((row) => row.id === id);
  if (!current) throw new DomainError('NOT_FOUND', 'Opsi tidak ditemukan.');
  return {
    quoteOptions: { put: [{ ...current, ...value, updatedAt: context.now }] },
  };
}

export function deleteQuoteOption(snapshot: Snapshot, id: string): Changes {
  assertPro(snapshot, 'quote');
  if (!snapshot.quoteOptions.some((row) => row.id === id))
    throw new DomainError('NOT_FOUND', 'Opsi tidak ditemukan.');
  return { quoteOptions: { del: [id] } };
}
