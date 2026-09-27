import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { ChannelRow } from '../../../db/schema';
import { PaywallSheet } from '../../license/components/paywall-sheet';
import { FreeLimitError } from '../../license/limits';
import { createChannel, updateChannel } from '../repository';
import { type ChannelFormValues, channelFormSchema } from '../schema';

interface ChannelFormProps {
  open: boolean;
  channel?: ChannelRow;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

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
}: ChannelFormProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<ChannelFormValues>(() =>
    valuesFor(channel),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(valuesFor(channel));
      setErrors({});
      setMessage('');
    }
  }, [channel, open]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    setSaving(true);
    setMessage('');
    try {
      const input = {
        name: parsed.data.name,
        kind: parsed.data.kind,
        rateBp: parsed.data.rate,
      };
      if (channel) await updateChannel(channel.id, input);
      else await createChannel(input);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof FreeLimitError) setPaywallOpen(true);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Saluran belum tersimpan. Coba lagi.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="ingredient-dialog"
      aria-labelledby="channel-form-title"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
    >
      <form className="ingredient-form" onSubmit={save} noValidate>
        <div className="ingredient-form-heading">
          <h2 id="channel-form-title">
            {channel ? 'Ubah saluran' : 'Tambah saluran'}
          </h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Tutup"
            onClick={() => onOpenChange(false)}
          >
            ×
          </button>
        </div>
        <label className="ingredient-label" htmlFor="channel-name">
          Nama saluran
          <input
            id="channel-name"
            maxLength={30}
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label className="ingredient-label" htmlFor="channel-kind">
          Jenis saluran
          <select
            id="channel-kind"
            value={values.kind}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                kind: event.target.value as ChannelFormValues['kind'],
              }))
            }
          >
            <option value="commission">Komisi, seperti ojol</option>
            <option value="discount">Diskon, seperti reseller</option>
          </select>
        </label>
        <label className="ingredient-label" htmlFor="channel-rate">
          {values.kind === 'commission' ? 'Komisi (%)' : 'Diskon (%)'}
          <input
            id="channel-rate"
            inputMode="decimal"
            value={values.rate}
            onChange={(event) =>
              setValues((current) => ({ ...current, rate: event.target.value }))
            }
            aria-invalid={Boolean(errors.rate)}
            aria-describedby={errors.rate ? 'channel-rate-error' : undefined}
          />
          {errors.rate && (
            <span className="field-error" id="channel-rate-error">
              {errors.rate}
            </span>
          )}
        </label>
        {message && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}
        <div className="ingredient-form-actions">
          <button
            className="button"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Menyimpan…' : 'Simpan saluran'}
          </button>
        </div>
      </form>
      <PaywallSheet
        open={paywallOpen}
        trigger="sales_channel"
        onClose={() => setPaywallOpen(false)}
      />
    </dialog>
  );
}
