import type { BackupData } from '@takaran/schema';
import { useEffect, useRef, useState } from 'react';
import { db } from '../../../db/db';
import { getLicenseCode } from '../../license/record';
import { verifyLicenseCode } from '../../license/verify';
import { backupCopy } from '../copy';
import { restoreBackup } from '../import';

export function RestoreDialog({
  data,
  onClose,
  onRestored,
}: {
  data: BackupData | null;
  onClose: () => void;
  onRestored: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  const [licenseWarning, setLicenseWarning] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (data && !dialog.open) dialog.showModal();
    if (!data && dialog.open) dialog.close();
  }, [data]);

  useEffect(() => {
    let active = true;
    async function checkLicense() {
      setLicenseWarning(false);
      if (!data) return;
      const current = await db.settings.get('license');
      const currentCode = getLicenseCode(current?.value);
      if (!currentCode) return;
      try {
        await verifyLicenseCode(currentCode);
      } catch {
        return;
      }
      const incoming = data.settings.find(
        (setting) => setting.key === 'license',
      )?.value;
      const incomingCode = getLicenseCode(incoming);
      try {
        if (!incomingCode) throw new Error();
        await verifyLicenseCode(incomingCode);
      } catch {
        if (active) setLicenseWarning(true);
      }
    }
    void checkLicense();
    return () => {
      active = false;
    };
  }, [data]);
  async function confirmRestore() {
    if (!data) return;
    setError('');
    try {
      await restoreBackup(data);
      dialogRef.current?.close();
      onRestored();
    } catch {
      setError(backupCopy.restoreError);
    }
  }

  return (
    <dialog
      aria-labelledby="restore-title"
      className="backup-dialog"
      onCancel={onClose}
      onClose={onClose}
      ref={dialogRef}
    >
      {data ? (
        <>
          <h2 id="restore-title">{backupCopy.restoreTitle}</h2>
          <p>
            {data.ingredients.length} bahan, {data.recipes.length} resep,{' '}
            {data.channels.length} saluran akan menggantikan data sekarang.
          </p>
          <p>{backupCopy.restoreWarning}</p>
          {licenseWarning ? (
            <p role="alert">
              Cadangan ini tidak membawa lisensi Pro yang aktif. Siapkan kode
              lisensi untuk mengaktifkannya lagi setelah pemulihan.
            </p>
          ) : null}
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="backup-actions">
            <button className="button" onClick={onClose} type="button">
              {backupCopy.cancel}
            </button>
            <button
              className="button button-primary"
              onClick={confirmRestore}
              type="button"
            >
              {backupCopy.restore}
            </button>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
