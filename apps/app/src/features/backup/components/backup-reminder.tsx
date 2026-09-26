import { Banner } from '@takaran/ui';
import { useState } from 'react';
import { useRecipeResults } from '../../recipes/use-recipe-results';
import { setSetting, useSetting } from '../../settings/repository';
import { backupCopy } from '../copy';
import { exportBackup } from '../export';

export function BackupReminder() {
  const { recipes } = useRecipeResults();
  const lastBackupAt = useSetting('lastBackupAt');
  const dismissedUntil = useSetting('backupReminderDismissedUntil');
  const [error, setError] = useState('');
  const now = Date.now();
  const lastBackupTime = lastBackupAt ? Date.parse(lastBackupAt) : Number.NaN;
  const isDue =
    !Number.isFinite(lastBackupTime) || now - lastBackupTime > 14 * 86400000;
  const isSnoozed = dismissedUntil !== null && Date.parse(dismissedUntil) > now;
  if (recipes.length === 0 || !isDue || isSnoozed) return null;

  async function dismiss() {
    await setSetting(
      'backupReminderDismissedUntil',
      new Date(now + 7 * 86400000).toISOString(),
    );
  }

  async function backupNow() {
    setError('');
    try {
      await exportBackup();
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === 'AbortError'))
        setError(backupCopy.exportError);
    }
  }

  return (
    <div className="backup-reminder">
      <Banner
        dismissLabel={backupCopy.dismiss}
        onDismiss={() => void dismiss()}
      >
        <span>{backupCopy.reminder} </span>
        <button
          className="text-button"
          onClick={() => void backupNow()}
          type="button"
        >
          {backupCopy.reminderAction}
        </button>
      </Banner>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
