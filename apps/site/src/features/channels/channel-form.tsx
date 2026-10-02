'use client';

import { type FormEvent, useEffect, useState } from 'react';
import {
  CommandError,
  errorMessage,
  useRun,
} from '@/components/takaran/data-provider';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChannelRow } from '@/domain/types';
import { PaywallDialog } from '@/features/billing/paywall-dialog';
import type { ChannelFormValues } from './schema';

const blank: ChannelFormValues = { name: '', kind: 'commission', rate: '20' };

function valuesFor(channel?: ChannelRow): ChannelFormValues {
  return channel
    ? {
        name: channel.name,
        kind: channel.kind,
        rate: String(channel.rateBp / 100),
      }
    : blank;
}

export function ChannelForm({
  open,
  channel,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  channel?: ChannelRow;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const run = useRun();
  const [values, setValues] = useState(() => valuesFor(channel));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(valuesFor(channel));
      setErrors({});
      setMessage('');
    }
  }, [channel, open]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { channelFormSchema } = await import('./schema');
      const parsed = channelFormSchema.safeParse(values);
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
      const input = {
        name: parsed.data.name,
        kind: parsed.data.kind,
        rateBp: parsed.data.rate,
      };
      await run(
        channel
          ? { type: 'channel.update', id: channel.id, input }
          : { type: 'channel.create', input },
      );
      onSaved();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof CommandError && error.code === 'FREE_LIMIT')
        setPaywall(true);
      setMessage(errorMessage(error, 'Saluran belum tersimpan. Coba lagi.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-semibold">
            {channel ? 'Ubah saluran' : 'Tambah saluran'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Isi nama saluran jual dan besar komisi atau diskonnya.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={save} noValidate>
          <Field id="channel-name" label="Nama saluran" error={errors.name}>
            <Input
              {...fieldProps('channel-name', errors.name)}
              maxLength={30}
              value={values.name}
              onChange={(event) =>
                setValues((c) => ({ ...c, name: event.target.value }))
              }
            />
          </Field>
          <Field id="channel-kind" label="Jenis saluran">
            <Select
              value={values.kind}
              onValueChange={(kind) =>
                setValues((c) => ({
                  ...c,
                  kind: kind as ChannelFormValues['kind'],
                }))
              }
            >
              <SelectTrigger id="channel-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commission">Komisi, seperti ojol</SelectItem>
                <SelectItem value="discount">
                  Diskon, seperti reseller
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            id="channel-rate"
            label={values.kind === 'commission' ? 'Komisi (%)' : 'Diskon (%)'}
            error={errors.rate}
          >
            <Input
              {...fieldProps('channel-rate', errors.rate)}
              inputMode="decimal"
              value={values.rate}
              onChange={(event) =>
                setValues((c) => ({ ...c, rate: event.target.value }))
              }
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
              {saving ? 'Menyimpan…' : 'Simpan saluran'}
            </Button>
          </DialogFooter>
        </form>
        <PaywallDialog
          open={paywall}
          trigger="channel"
          onClose={() => setPaywall(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
