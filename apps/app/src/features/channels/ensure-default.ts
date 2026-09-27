import { db } from '../../db/db';
import { createUlid } from '../../lib/ulid';

export async function ensureDefaultChannel(): Promise<void> {
  await db.transaction('rw', db.channels, async () => {
    if ((await db.channels.where('name').equals('Langsung').count()) > 0)
      return;
    const now = new Date().toISOString();
    await db.channels.add({
      id: createUlid(),
      name: 'Langsung',
      kind: 'commission',
      rateBp: 0,
      createdAt: now,
      updatedAt: now,
    });
  });
}
