import type { BackupData } from '@takaran/schema';
import { useRef, useState } from 'react';
import { backupCopy } from '../copy';
import { exportBackup } from '../export';
import { parseBackupFile } from '../import';
import { RestoreDialog } from './restore-dialog';

export function BackupPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [restoreData, setRestoreData] = useState<BackupData | null>(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setError('');
    setExporting(true);
    try {
      await exportBackup();
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError')
        return;
      setError(backupCopy.exportError);
    } finally {
      setExporting(false);
    }
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setError('');
    try {
      setRestoreData(await parseBackupFile(file));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : backupCopy.invalidFile,
      );
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <section className="settings-card" aria-labelledby="backup-title">
      <h2 id="backup-title">{backupCopy.title}</h2>
      <p>{backupCopy.description}</p>
      <div className="backup-actions">
        <button
          className="button button-primary"
          disabled={exporting}
          onClick={handleExport}
          type="button"
        >
          {exporting ? 'Membuat file' : backupCopy.export}
        </button>
        <button
          className="button"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {backupCopy.import}
        </button>
        <input
          accept="application/json,.json"
          aria-label="Pilih file cadangan Takaran"
          className="sr-only"
          onChange={(event) => void handleFile(event.currentTarget.files?.[0])}
          ref={inputRef}
          type="file"
        />
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <RestoreDialog
        data={restoreData}
        onClose={() => setRestoreData(null)}
        onRestored={() => {
          setRestoreData(null);
          setError('');
        }}
      />
    </section>
  );
}
