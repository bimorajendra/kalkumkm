import {
  type BackupData,
  backupSchema,
  backupSchemaV1,
  decodeLicenseCode,
} from '@takaran/schema';
import { db } from '../../db/db';
import { sha256 } from './checksum';
import { backupCopy } from './copy';

const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
const CURRENT_SCHEMA_VERSION = 2;

export async function parseBackupFile(file: File): Promise<BackupData> {
  if (file.size > MAX_BACKUP_BYTES) throw new Error(backupCopy.tooLarge);
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error(backupCopy.invalidFile);
  }
  const candidate = parsed as { app?: unknown; schemaVersion?: unknown } | null;
  if (candidate?.app !== 'takaran') throw new Error(backupCopy.invalidFile);
  if (
    typeof candidate.schemaVersion === 'number' &&
    candidate.schemaVersion > CURRENT_SCHEMA_VERSION
  )
    throw new Error(backupCopy.newer);

  if (candidate.schemaVersion === 1) {
    const result = backupSchemaV1.safeParse(parsed);
    if (!result.success) throw new Error(backupCopy.invalidFile);
    if ((await sha256(result.data.data)) !== result.data.sha256)
      throw new Error(backupCopy.corrupt);
    return {
      ...result.data.data,
      settings: result.data.data.settings.map((setting) => {
        if (setting.key !== 'license') return setting;
        if (setting.value === null)
          return { key: 'license' as const, value: null };
        let payload = null;
        try {
          payload = decodeLicenseCode(setting.value).payload;
        } catch {
          // Keep older local values so other backup data can still be restored.
        }
        return {
          key: 'license' as const,
          value: { code: setting.value, payload, activatedAt: null },
        };
      }),
    };
  }

  const result = backupSchema.safeParse(parsed);
  if (!result.success) throw new Error(backupCopy.invalidFile);
  if ((await sha256(result.data.data)) !== result.data.sha256)
    throw new Error(backupCopy.corrupt);
  return result.data.data;
}

export async function restoreBackup(data: BackupData): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.ingredients,
      db.recipes,
      db.channels,
      db.quoteOptions,
      db.priceHistory,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.ingredients.clear(),
        db.recipes.clear(),
        db.channels.clear(),
        db.quoteOptions.clear(),
        db.priceHistory.clear(),
        db.settings.clear(),
      ]);
      await Promise.all([
        db.ingredients.bulkAdd(data.ingredients),
        db.recipes.bulkAdd(data.recipes),
        db.channels.bulkAdd(data.channels),
        db.quoteOptions.bulkAdd(data.quoteOptions),
        db.priceHistory.bulkAdd(data.priceHistory),
        db.settings.bulkAdd(data.settings),
      ]);
    },
  );
}
