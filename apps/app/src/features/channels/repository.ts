import type { Channel } from '@takaran/calc';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { ChannelRow } from '../../db/schema';
import { createUlid } from '../../lib/ulid';
import { assertCanCreate, hasProLicense } from '../license/limits';
import { channelInputSchema } from './schema';

export class ChannelRepositoryError extends Error {
  constructor(
    readonly code: 'INVALID' | 'NOT_FOUND' | 'DUPLICATE' | 'DEFAULT',
    message: string,
  ) {
    super(message);
    this.name = 'ChannelRepositoryError';
  }
}

export type ChannelInput = Omit<Channel, 'id'>;

export async function listChannels(): Promise<ChannelRow[]> {
  return (await db.channels.toArray()).sort((left, right) =>
    left.name.localeCompare(right.name, 'id'),
  );
}

export function useChannels() {
  return useLiveQuery(() => listChannels().catch(() => []), [], []);
}

export async function createChannel(input: ChannelInput): Promise<ChannelRow> {
  const normalized = validate(input);
  const isPro = await hasProLicense();
  const now = new Date().toISOString();
  const row: ChannelRow = {
    ...normalized,
    id: createUlid(),
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction('rw', db.channels, async () => {
    await assertUniqueName(row.name);
    await assertCanCreate('channel', isPro);
    await db.channels.add(row);
  });
  return row;
}

export async function updateChannel(
  id: string,
  input: ChannelInput,
): Promise<ChannelRow> {
  const normalized = validate(input);
  let saved: ChannelRow | undefined;
  await db.transaction('rw', db.channels, async () => {
    const current = await db.channels.get(id);
    if (!current)
      throw new ChannelRepositoryError('NOT_FOUND', 'Saluran tidak ditemukan.');
    if (current.name === 'Langsung')
      throw new ChannelRepositoryError(
        'DEFAULT',
        'Saluran Langsung tidak bisa diubah.',
      );
    await assertUniqueName(normalized.name, id);
    saved = { ...current, ...normalized, updatedAt: new Date().toISOString() };
    await db.channels.put(saved);
  });
  if (!saved)
    throw new ChannelRepositoryError('NOT_FOUND', 'Saluran tidak ditemukan.');
  return saved;
}

export async function deleteChannel(id: string): Promise<void> {
  await db.transaction('rw', db.channels, async () => {
    const current = await db.channels.get(id);
    if (!current)
      throw new ChannelRepositoryError('NOT_FOUND', 'Saluran tidak ditemukan.');
    if (current.name === 'Langsung')
      throw new ChannelRepositoryError(
        'DEFAULT',
        'Saluran Langsung tidak bisa dihapus.',
      );
    await db.channels.delete(id);
  });
}

function validate(input: ChannelInput): ChannelInput {
  const parsed = channelInputSchema.safeParse(input);
  if (!parsed.success)
    throw new ChannelRepositoryError(
      'INVALID',
      parsed.error.issues[0]?.message ?? 'Data saluran tidak valid.',
    );
  if (
    parsed.data.name.toLocaleLowerCase('id-ID') === 'langsung' &&
    (parsed.data.kind !== 'commission' || parsed.data.rateBp !== 0)
  )
    throw new ChannelRepositoryError(
      'DEFAULT',
      'Nama Langsung dipakai untuk saluran utama.',
    );
  return parsed.data;
}

async function assertUniqueName(
  name: string,
  exceptId?: string,
): Promise<void> {
  const rows = await db.channels.toArray();
  if (
    rows.some(
      (row) =>
        row.id !== exceptId &&
        row.name.trim().toLocaleLowerCase('id-ID') ===
          name.trim().toLocaleLowerCase('id-ID'),
    )
  )
    throw new ChannelRepositoryError(
      'DUPLICATE',
      'Nama saluran ini sudah dipakai.',
    );
}
