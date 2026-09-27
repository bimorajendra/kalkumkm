'use client';

import { type FormEvent, useEffect, useState } from 'react';
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
import type { QuoteOptionRow } from '@/domain/types';
import { type QuoteOptionFormValues, quoteOptionFormSchema } from './schema';

const blank: QuoteOptionFormValues = { name: '', priceAdd: '0', costAdd: '0' };

export function QuoteOptionForm({
  recipeId,
  open,
  option,
  onOpenChange,
  onSaved,
}: {
  recipeId: string;
  open: boolean;
  option?: QuoteOptionRow;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const run = useRun();
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      option
        ? {
            name: option.name,
            priceAdd: String(option.priceAdd),
            costAdd: String(option.costAdd),
          }
        : blank,
    );
    setErrors({});
    setMessage('');
  }, [open, option]);

  const set = (field: keyof QuoteOptionFormValues, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = quoteOptionFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await run(
        option
          ? { type: 'quote.update', id: option.id, input: parsed.data }
          : { type: 'quote.create', recipeId, input: parsed.data },
      );
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setMessage(errorMessage(error, 'Opsi belum tersimpan. Coba lagi.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">
            {option ? 'Ubah opsi' : 'Tambah opsi'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Isi nama opsi tambahan, tambahan harga, dan tambahan biayanya.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={save} noValidate>
          <Field id="quote-option-name" label="Nama opsi" error={errors.name}>
            <Input
              {...fieldProps('quote-option-name', errors.name)}
              maxLength={40}
              value={values.name}
              onChange={(event) => set('name', event.target.value)}
            />
          </Field>
          <Field
            id="quote-option-price"
            label="Tambahan harga, rupiah bulat"
            error={errors.priceAdd}
          >
            <Input
              {...fieldProps('quote-option-price', errors.priceAdd)}
              inputMode="numeric"
              value={values.priceAdd}
              onChange={(event) => set('priceAdd', event.target.value)}
            />
          </Field>
          <Field
            id="quote-option-cost"
            label="Tambahan biaya, rupiah bulat"
            error={errors.costAdd}
          >
            <Input
              {...fieldProps('quote-option-cost', errors.costAdd)}
              inputMode="numeric"
              value={values.costAdd}
              onChange={(event) => set('costAdd', event.target.value)}
            />
          </Field>
          {message ? (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan opsi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
