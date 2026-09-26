import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/db';
import { getSetting } from '../features/settings/repository';
import { initializePersistence } from './persist';

afterEach(async () => {
  db.close();
  await db.delete();
  vi.unstubAllGlobals();
});

describe('local storage persistence', () => {
  it('requests persistence once and saves the first open time', async () => {
    await db.open();
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { storage: { persist } });

    await initializePersistence();
    const firstOpenedAt = await getSetting('firstOpenedAt');
    await initializePersistence();

    expect(firstOpenedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
