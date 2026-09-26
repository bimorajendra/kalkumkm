import type { BackupData, BackupFile } from '@takaran/schema';
import { backupSchema, decodeLicenseCode } from '@takaran/schema';
import { db } from '../../db/db';
import { track } from '../../lib/analytics';
import { setSetting } from '../settings/repository';
import { sha256 } from './checksum';

export async function createBackup(): Promise<BackupFile> {
  const data = await db.transaction(
    'r',
    [
      db.ingredients,
      db.recipes,
      db.channels,
      db.quoteOptions,
      db.priceHistory,
      db.settings,
    ],
    async () => {
      const [
        ingredients,
        recipes,
        channels,
        quoteOptions,
        priceHistory,
        settings,
      ] = await Promise.all([
        db.ingredients.toArray(),
        db.recipes.toArray(),
        db.channels.toArray(),
        db.quoteOptions.toArray(),
        db.priceHistory.toArray(),
        db.settings.toArray(),
      ]);
      return {
        ingredients,
        recipes,
        channels,
        quoteOptions,
        priceHistory,
        settings: settings
          .filter((row) => row.key !== ('pendingCheckout' as string))
          .map((row) => {
            if (row.key !== 'license' || typeof row.value !== 'string')
              return row;
            let payload = null;
            try {
              payload = decodeLicenseCode(row.value).payload;
            } catch {
              // Preserve older local values; they stay inactive until verified.
            }
            return {
              key: 'license' as const,
              value: { code: row.value, payload, activatedAt: null },
            };
          }),
      } as BackupData;
    },
  );
  const backup = backupSchema.parse({
    app: 'takaran',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    data,
    sha256: await sha256(data),
  });
  return backup;
}

export async function exportBackup(): Promise<void> {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const fileName = `takaran-cadangan-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([blob], fileName, { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Cadangan Takaran' });
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const exportedAt = new Date().toISOString();
  await setSetting('lastBackupAt', exportedAt);
  track('backup_exported', {});
}
