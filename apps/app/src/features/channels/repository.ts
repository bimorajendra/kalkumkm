import type { Channel } from '@takaran/calc';
import { db } from '../../db/db';
import { createUlid } from '../../lib/ulid';
import { assertCanCreate, hasProLicense } from '../license/limits';

export async function createChannel(input: Omit<Channel, 'id'>) {
  const isPro = await hasProLicense();
  const now = new Date().toISOString();
  const row = { ...input, id: createUlid(), createdAt: now, updatedAt: now };
  await db.transaction('rw', db.channels, db.settings, async () => {
    await assertCanCreate('channel', isPro);
    await db.channels.add(row);
  });
  return row;
}
