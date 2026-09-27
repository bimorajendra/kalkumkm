import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../db/db';
import { ensureDefaultChannel } from './ensure-default';
import {
  ChannelRepositoryError,
  createChannel,
  deleteChannel,
  updateChannel,
} from './repository';
import { channelFormSchema } from './schema';

vi.mock('../license/limits', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../license/limits')>();
  return { ...actual, hasProLicense: async () => true };
});

afterEach(async () => {
  db.close();
  await db.delete();
});

describe('channel repository', () => {
  it('creates the direct channel only once and protects it from deletion', async () => {
    await db.open();
    await ensureDefaultChannel();
    await ensureDefaultChannel();
    expect(await db.channels.toArray()).toMatchObject([
      { name: 'Langsung', kind: 'commission', rateBp: 0 },
    ]);
    const direct = (await db.channels.toArray())[0];
    expect(direct).toBeDefined();
    if (direct)
      await expect(deleteChannel(direct.id)).rejects.toMatchObject({
        code: 'DEFAULT',
      });
  });

  it('restores the direct channel if older local data has another channel only', async () => {
    await db.open();
    const now = new Date().toISOString();
    await db.channels.add({
      id: 'legacy-channel',
      name: 'Ojol',
      kind: 'commission',
      rateBp: 2000,
      createdAt: now,
      updatedAt: now,
    });
    await ensureDefaultChannel();
    expect(await db.channels.count()).toBe(2);
    expect(await db.channels.where('name').equals('Langsung').count()).toBe(1);
  });

  it('creates, edits, and deletes a validated channel', async () => {
    await db.open();
    await ensureDefaultChannel();
    const channel = await createChannel({
      name: 'Ojol',
      kind: 'commission',
      rateBp: 2000,
    });
    const changed = await updateChannel(channel.id, {
      name: 'Reseller',
      kind: 'discount',
      rateBp: 1500,
    });
    expect(changed).toMatchObject({
      name: 'Reseller',
      kind: 'discount',
      rateBp: 1500,
    });
    await deleteChannel(channel.id);
    expect(await db.channels.get(channel.id)).toBeUndefined();
  });

  it('rejects duplicate names and invalid rate or reserved direct name', async () => {
    await db.open();
    await ensureDefaultChannel();
    await expect(
      createChannel({ name: 'langsung', kind: 'commission', rateBp: 0 }),
    ).rejects.toBeInstanceOf(ChannelRepositoryError);
    await createChannel({ name: 'Ojol', kind: 'commission', rateBp: 2000 });
    await expect(
      createChannel({ name: 'ojol', kind: 'discount', rateBp: 1500 }),
    ).rejects.toMatchObject({ code: 'DUPLICATE' });
    await expect(
      createChannel({ name: 'Kemitraan', kind: 'discount', rateBp: 9001 }),
    ).rejects.toMatchObject({ code: 'INVALID' });
    await expect(
      createChannel({ name: 'Langsung', kind: 'discount', rateBp: 0 }),
    ).rejects.toMatchObject({ code: 'DEFAULT' });
  });

  it('converts decimal percentages to integer basis points', () => {
    expect(
      channelFormSchema.parse({ name: 'Ojol', kind: 'commission', rate: '20' }),
    ).toEqual({ name: 'Ojol', kind: 'commission', rate: 2000 });
    expect(
      channelFormSchema.parse({
        name: 'Reseller',
        kind: 'discount',
        rate: '2.5',
      }).rate,
    ).toBe(250);
    expect(
      channelFormSchema.safeParse({
        name: 'Ojol',
        kind: 'commission',
        rate: '90.01',
      }).success,
    ).toBe(false);
  });
});
