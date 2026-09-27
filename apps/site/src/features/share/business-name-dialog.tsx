'use client';

import { type FormEvent, useState } from 'react';
import { errorMessage, useRun } from '@/components/takaran/data-provider';
import { Field, fieldProps } from '@/components/takaran/field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

/** Gambar yang dibagikan wajib memuat nama usaha, jadi ditanyakan sekali di sini. */
export function BusinessNameDialog({
  open,
  description,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  description: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const run = useRun();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = value.trim();
    if (!name || name.length > 120) {
      setError('Nama usaha wajib diisi, maksimal 120 karakter.');
      return;
    }
    try {
      await run({ type: 'settings.update', values: { businessName: name } });
      setError('');
      onOpenChange(false);
      onSaved();
    } catch (cause) {
      setError(errorMessage(cause, 'Nama usaha belum tersimpan. Coba lagi.'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">
            Nama usaha
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={save} noValidate>
          <Field id="business-name" label="Nama usaha" error={error}>
            <Input
              {...fieldProps('business-name', error)}
              maxLength={120}
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit">Simpan nama</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
