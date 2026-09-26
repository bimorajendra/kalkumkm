import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/db';
import { getSetting, setSetting } from './repository';

afterEach(async () => {
  db.close();
  await db.delete();
});

beforeEach(async () => {
  await db.open();
});

describe('settings repository', () => {
  it('returns defaults for settings that have not been saved', async () => {
    expect(await getSetting('roundingStep')).toBe(500);
    expect(await getSetting('defaultMarginBp')).toBe(4000);
  });

  it('persists a value and returns it on the next read', async () => {
    await setSetting('businessName', 'Dapur Rina');

    expect(await getSetting('businessName')).toBe('Dapur Rina');
  });
});
