import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { QuoteOptionRow } from '../../../db/schema';
import { createQuoteOption, updateQuoteOption } from '../repository';
import { type QuoteOptionFormValues, quoteOptionFormSchema } from '../schema';

interface QuoteOptionFormProps {
  recipeId: string;
  open: boolean;
  option?: QuoteOptionRow;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const blank: QuoteOptionFormValues = { name: '', priceAdd: '0', costAdd: '0' };

export function QuoteOptionForm({
  recipeId,
  open,
  option,
  onOpenChange,
  onSaved,
}: QuoteOptionFormProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<QuoteOptionFormValues>(blank);
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
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

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
      if (option) await updateQuoteOption(option.id, parsed.data);
      else await createQuoteOption(recipeId, parsed.data);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Opsi belum tersimpan. Coba lagi.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="ingredient-dialog"
      aria-labelledby="quote-option-title"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
    >
      <form className="ingredient-form" onSubmit={save} noValidate>
        <div className="ingredient-form-heading">
          <h2 id="quote-option-title">
            {option ? 'Ubah opsi' : 'Tambah opsi'}
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
        <label className="ingredient-label" htmlFor="quote-option-name">
          Nama opsi
          <input
            id="quote-option-name"
            maxLength={40}
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            aria-invalid={Boolean(errors.name)}
            aria-describedby={
              errors.name ? 'quote-option-name-error' : undefined
            }
          />
          {errors.name && (
            <span className="field-error" id="quote-option-name-error">
              {errors.name}
            </span>
          )}
        </label>
        <label className="ingredient-label" htmlFor="quote-option-price">
          Tambahan harga, rupiah bulat
          <input
            id="quote-option-price"
            inputMode="numeric"
            value={values.priceAdd}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                priceAdd: event.target.value,
              }))
            }
            aria-invalid={Boolean(errors.priceAdd)}
            aria-describedby={
              errors.priceAdd ? 'quote-option-price-error' : undefined
            }
          />
          {errors.priceAdd && (
            <span className="field-error" id="quote-option-price-error">
              {errors.priceAdd}
            </span>
          )}
        </label>
        <label className="ingredient-label" htmlFor="quote-option-cost">
          Tambahan biaya, rupiah bulat
          <input
            id="quote-option-cost"
            inputMode="numeric"
            value={values.costAdd}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                costAdd: event.target.value,
              }))
            }
            aria-invalid={Boolean(errors.costAdd)}
            aria-describedby={
              errors.costAdd ? 'quote-option-cost-error' : undefined
            }
          />
          {errors.costAdd && (
            <span className="field-error" id="quote-option-cost-error">
              {errors.costAdd}
            </span>
          )}
        </label>
        {message ? (
          <p className="form-error" role="alert">
            {message}
          </p>
        ) : null}
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
            {saving ? 'Menyimpan…' : 'Simpan opsi'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
