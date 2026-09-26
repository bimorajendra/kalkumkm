import 'fake-indexeddb/auto';
import * as ed from '@noble/ed25519';
import {
  type BackupData,
  backupSchemaV1,
  encodeLicenseCode,
} from '@takaran/schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../db/db';
import { sha256 } from './checksum';
import { createBackup, exportBackup } from './export';
import { parseBackupFile, restoreBackup } from './import';

const now = '2026-09-26T00:00:00.000Z';
const licensePayload = {
  v: 1 as const,
  id: 'lic_01J8M9G5QZ0E3T2A1B7C6D5F4G',
  n: 'Dapur Sari',
  p: 'pro' as const,
  t: 1790000000,
};
const licenseSeed = Uint8Array.from({ length: 32 }, (_, index) => index + 1);

function textFile(text: string, size = new TextEncoder().encode(text).length) {
  return { size, text: async () => text } as File;
}

async function fillDatabase() {
  await db.ingredients.add({
    id: 'ingredient-1',
    name: 'Tepung',
    buyPrice: 14000,
    packSize: 1000,
    buyUnit: 'g',
    customUnits: [],
    createdAt: now,
    updatedAt: now,
  });
  await db.recipes.add({
    id: 'recipe-1',
    name: 'Brownies',
    yieldPortions: 16,
    items: [
      {
        refType: 'ingredient',
        refId: 'ingredient-1',
        quantity: 150,
        unit: 'g',
      },
    ],
    packagingPerPortion: 1000,
    energyPerBatch: 3000,
    laborMinutesPerBatch: 90,
    laborRatePerHour: null,
    targetMarginBp: 4000,
    currentPrice: 5000,
    isSubRecipe: false,
    subRecipeYield: null,
    createdAt: now,
    updatedAt: now,
  });
  await db.channels.add({
    id: 'channel-1',
    name: 'Ojol',
    kind: 'commission',
    rateBp: 2000,
    createdAt: now,
    updatedAt: now,
  });
  await db.quoteOptions.add({
    id: 'option-1',
    recipeId: 'recipe-1',
    name: 'Topper',
    priceAdd: 5000,
    costAdd: 2000,
    createdAt: now,
    updatedAt: now,
  });
  await db.priceHistory.add({
    ingredientId: 'ingredient-1',
    changedAt: now,
    oldPrice: 13000,
    newPrice: 14000,
  });
  await db.settings.bulkAdd([
    { key: 'businessName', value: 'Dapur Rina' },
    {
      key: 'license',
      value: {
        code: 'signed-license',
        payload: null,
        activatedAt: now,
      },
    },
  ]);
}

describe('backup and restore', () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    db.close();
    await db.delete();
  });

  it('exports all six tables and restores identical local data, including license', async () => {
    await fillDatabase();
    const backup = await createBackup();
    expect(Object.keys(backup.data).sort()).toEqual([
      'channels',
      'ingredients',
      'priceHistory',
      'quoteOptions',
      'recipes',
      'settings',
    ]);
    expect(backup.data.settings).toContainEqual({
      key: 'license',
      value: {
        code: 'signed-license',
        payload: null,
        activatedAt: now,
      },
    });

    await db.ingredients.clear();
    await db.recipes.clear();
    await db.channels.clear();
    await db.quoteOptions.clear();
    await db.priceHistory.clear();
    await db.settings.clear();
    const restored = await parseBackupFile(textFile(JSON.stringify(backup)));
    await restoreBackup(restored);

    expect(await createBackup()).toMatchObject({ data: backup.data });
  });

  it('rejects malformed JSON, the wrong app, invalid data, and files over 20 MB', async () => {
    await expect(parseBackupFile(textFile('{'))).rejects.toThrow(
      'File cadangan tidak valid',
    );
    await expect(
      parseBackupFile(textFile(JSON.stringify({ app: 'other' }))),
    ).rejects.toThrow('File cadangan tidak valid');
    await expect(
      parseBackupFile(textFile('{}', 20 * 1024 * 1024 + 1)),
    ).rejects.toThrow('maksimal 20 MB');
    await fillDatabase();
    const backup = await createBackup();
    const invalid = {
      ...backup,
      data: { ...backup.data, recipes: [{ id: '' }] },
    };
    await expect(
      parseBackupFile(textFile(JSON.stringify(invalid))),
    ).rejects.toThrow('File cadangan tidak valid');
  });

  it('rejects a changed checksum and a backup from a newer version', async () => {
    await fillDatabase();
    const backup = await createBackup();
    await expect(
      parseBackupFile(
        textFile(JSON.stringify({ ...backup, sha256: '0'.repeat(64) })),
      ),
    ).rejects.toThrow('rusak atau sudah diubah');
    await expect(
      parseBackupFile(
        textFile(JSON.stringify({ ...backup, schemaVersion: 3 })),
      ),
    ).rejects.toThrow('versi Takaran yang lebih baru');
  });

  it('migrates version 1 backups and keeps their signed license', async () => {
    const signature = await ed.signAsync(
      new TextEncoder().encode(JSON.stringify(licensePayload)),
      licenseSeed,
    );
    const code = encodeLicenseCode(licensePayload, signature);
    const current = await createBackup();
    const data = {
      ...current.data,
      settings: [
        ...current.data.settings.filter((setting) => setting.key !== 'license'),
        { key: 'license' as const, value: code },
      ],
    };
    const legacy = backupSchemaV1.parse({
      app: 'takaran',
      schemaVersion: 1,
      exportedAt: now,
      data,
      sha256: await sha256(data),
    });

    const migrated = await parseBackupFile(textFile(JSON.stringify(legacy)));

    expect(migrated.settings).toContainEqual({
      key: 'license',
      value: { code, payload: licensePayload, activatedAt: null },
    });
  });

  it('keeps existing data when a write fails during restore', async () => {
    await fillDatabase();
    const valid = await createBackup();
    const invalidData = {
      ...valid.data,
      ingredients: [valid.data.ingredients[0], valid.data.ingredients[0]],
    } as BackupData;

    await expect(restoreBackup(invalidData)).rejects.toThrow();
    expect(await db.ingredients.toArray()).toHaveLength(1);
    expect(await db.recipes.toArray()).toHaveLength(1);
  });

  it('sets the last backup time and tracks export only after sharing succeeds', async () => {
    class TestFile extends Blob {
      name: string;
      constructor(parts: BlobPart[], name: string, options?: FilePropertyBag) {
        super(parts, options);
        this.name = name;
      }
    }
    const tracked = vi.fn();
    vi.stubGlobal('File', TestFile);
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: vi.fn().mockResolvedValue(undefined),
    });
    vi.stubGlobal('window', { umami: { track: tracked } });
    await fillDatabase();

    await exportBackup();

    expect(await db.settings.get('lastBackupAt')).toMatchObject({
      key: 'lastBackupAt',
    });
    expect(tracked).toHaveBeenCalledWith('backup_exported', {});
  });
});
