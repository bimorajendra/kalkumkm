import type { Channel } from '@takaran/calc';
import { z } from 'zod';
import { assertCanCreate } from './limits';
import {
  type Changes,
  type ChannelRow,
  type CommandContext,
  DomainError,
  type Snapshot,
} from './types';

export const DEFAULT_CHANNEL = 'Langsung';

export const channelInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama saluran wajib diisi.')
    .max(30, 'Nama maksimal 30 karakter.'),
  kind: z.enum(['commission', 'discount']),
  rateBp: z
    .number()
    .int()
    .min(0, 'Nilai tidak boleh negatif.')
    .max(9000, 'Nilai maksimal 90%.'),
});

export type ChannelInput = Omit<Channel, 'id'>;

function validate(input: ChannelInput): ChannelInput {
  const parsed = channelInputSchema.safeParse(input);
  if (!parsed.success)
    throw new DomainError(
      'INVALID',
      parsed.error.issues[0]?.message ?? 'Data saluran tidak valid.',
    );
  if (
    parsed.data.name.toLocaleLowerCase('id-ID') === 'langsung' &&
    (parsed.data.kind !== 'commission' || parsed.data.rateBp !== 0)
  )
    throw new DomainError(
      'DEFAULT',
      'Nama Langsung dipakai untuk saluran utama.',
    );
  return parsed.data;
}

function assertUniqueName(
  rows: ChannelRow[],
  name: string,
  exceptId?: string,
): void {
  if (
    rows.some(
      (row) =>
        row.id !== exceptId &&
        row.name.trim().toLocaleLowerCase('id-ID') ===
          name.trim().toLocaleLowerCase('id-ID'),
    )
  )
    throw new DomainError('DUPLICATE', 'Nama saluran ini sudah dipakai.');
}

export function createChannel(
  snapshot: Snapshot,
  input: ChannelInput,
  context: CommandContext,
): Changes {
  const normalized = validate(input);
  assertUniqueName(snapshot.channels, normalized.name);
  assertCanCreate(snapshot, 'channel');
  const row: ChannelRow = {
    ...normalized,
    id: context.newId(),
    createdAt: context.now,
    updatedAt: context.now,
  };
  return { channels: { put: [row] } };
}

export function updateChannel(
  snapshot: Snapshot,
  id: string,
  input: ChannelInput,
  context: CommandContext,
): Changes {
  const normalized = validate(input);
  const current = snapshot.channels.find((row) => row.id === id);
  if (!current) throw new DomainError('NOT_FOUND', 'Saluran tidak ditemukan.');
  if (current.name === DEFAULT_CHANNEL)
    throw new DomainError('DEFAULT', 'Saluran Langsung tidak bisa diubah.');
  assertUniqueName(snapshot.channels, normalized.name, id);
  return {
    channels: { put: [{ ...current, ...normalized, updatedAt: context.now }] },
  };
}

export function deleteChannel(snapshot: Snapshot, id: string): Changes {
  const current = snapshot.channels.find((row) => row.id === id);
  if (!current) throw new DomainError('NOT_FOUND', 'Saluran tidak ditemukan.');
  if (current.name === DEFAULT_CHANNEL)
    throw new DomainError('DEFAULT', 'Saluran Langsung tidak bisa dihapus.');
  return { channels: { del: [id] } };
}

/** Saluran utama dibuat otomatis sekali per akun. */
export function defaultChannelRow(context: CommandContext): ChannelRow {
  return {
    id: context.newId(),
    name: DEFAULT_CHANNEL,
    kind: 'commission',
    rateBp: 0,
    createdAt: context.now,
    updatedAt: context.now,
  };
}
