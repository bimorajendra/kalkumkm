import type { BaseUnit, Ingredient } from '@takaran/calc';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { IngredientRow } from '../../../db/schema';
import { findCommonIngredient } from '../common-ingredients';
import { ingredientCopy } from '../copy';
import {
  createIngredient,
  deleteIngredient,
  IngredientRepositoryError,
  updateIngredient,
} from '../repository';
import {
  type IngredientFormValues,
  ingredientFormSchema,
  ingredientInputFromForm,
} from '../schema';
import { CommonIngredientPicker } from './common-ingredient-picker';
import { UnitPicker } from './unit-picker';

interface IngredientFormProps {
  open: boolean;
  ingredient?: IngredientRow;
  onOpenChange: (open: boolean) => void;
  onSaved: (ingredient: Ingredient) => void;
}

const defaults: IngredientFormValues = {
  name: '',
  buyPrice: '',
  packSize: '1',
  buyUnit: 'g',
  customName: '',
  customQty: '1',
  customBase: 'g',
};

function valuesFor(ingredient?: IngredientRow): IngredientFormValues {
  if (!ingredient) return defaults;
  const custom = ingredient.customUnits.find(
    ({ name }) => name === ingredient.buyUnit,
  );
  return {
    name: ingredient.name,
    buyPrice: String(ingredient.buyPrice),
    packSize: String(ingredient.packSize),
    buyUnit: custom
      ? ingredient.buyUnit === 'bungkus'
        ? 'bungkus'
        : 'custom'
      : ingredient.buyUnit,
    customName: ingredient.buyUnit === 'bungkus' ? '' : ingredient.buyUnit,
    customQty: String(custom?.qty ?? 1),
    customBase: custom?.base ?? 'g',
  };
}

export function IngredientForm({
  open,
  ingredient,
  onOpenChange,
  onSaved,
}: IngredientFormProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<IngredientFormValues>(() =>
    valuesFor(ingredient),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues(valuesFor(ingredient));
  }, [ingredient, open]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  function change(field: keyof IngredientFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = ingredientFormSchema.safeParse(values);
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
    setFormError('');
    try {
      const input = ingredientInputFromForm(parsed.data);
      const saved = ingredient
        ? await updateIngredient(ingredient.id, input)
        : await createIngredient(input);
      onSaved(saved);
      onOpenChange(false);
    } catch (error) {
      if (
        error instanceof IngredientRepositoryError &&
        error.code === 'DUPLICATE_NAME'
      ) {
        setErrors((current) => ({
          ...current,
          name: ingredientCopy.duplicate,
        }));
      } else if (
        error instanceof IngredientRepositoryError &&
        error.code === 'DIMENSION_IN_USE'
      ) {
        setFormError(ingredientCopy.dimensionChange);
      } else {
        setFormError(ingredientCopy.saveError);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!ingredient) return;
    if (!window.confirm('Hapus bahan ini?')) return;
    try {
      await deleteIngredient(ingredient.id);
      onOpenChange(false);
    } catch (error) {
      setFormError(
        error instanceof IngredientRepositoryError
          ? error.message
          : ingredientCopy.saveError,
      );
    }
  }

  return (
    <dialog
      aria-labelledby="ingredient-form-title"
      className="ingredient-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      ref={dialog}
    >
      <form className="ingredient-form" onSubmit={save} noValidate>
        <div className="ingredient-form-heading">
          <h2 id="ingredient-form-title">
            {ingredient ? 'Ubah bahan' : 'Tambah bahan'}
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
        <label className="ingredient-label" htmlFor="ingredient-name">
          Nama bahan
          <input
            id="ingredient-name"
            autoComplete="off"
            autoFocus={!ingredient}
            list="common-ingredient-suggestions"
            maxLength={60}
            value={values.name}
            onChange={(event) => {
              const name = event.target.value;
              change('name', name);
              const suggestion = findCommonIngredient(name);
              if (suggestion) change('buyUnit', suggestion.buyUnit);
            }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'ingredient-name-error' : undefined}
          />
          {errors.name && (
            <span className="field-error" id="ingredient-name-error">
              {errors.name}
            </span>
          )}
          {!ingredient ? (
            <CommonIngredientPicker id="common-ingredient-suggestions" />
          ) : null}
        </label>
        <label className="ingredient-label" htmlFor="ingredient-price">
          {ingredientCopy.priceLabel}
          <input
            id="ingredient-price"
            inputMode="numeric"
            autoComplete="off"
            value={values.buyPrice}
            onChange={(event) => change('buyPrice', event.target.value)}
            aria-invalid={Boolean(errors.buyPrice)}
            aria-describedby={
              errors.buyPrice ? 'ingredient-price-error' : undefined
            }
          />
          {errors.buyPrice && (
            <span className="field-error" id="ingredient-price-error">
              {errors.buyPrice}
            </span>
          )}
        </label>
        <label className="ingredient-label" htmlFor="ingredient-pack">
          {ingredientCopy.packLabel}
          <input
            id="ingredient-pack"
            inputMode="decimal"
            autoComplete="off"
            value={values.packSize}
            onChange={(event) => change('packSize', event.target.value)}
            aria-invalid={Boolean(errors.packSize)}
            aria-describedby={
              errors.packSize ? 'ingredient-pack-error' : undefined
            }
          />
          {errors.packSize && (
            <span className="field-error" id="ingredient-pack-error">
              {errors.packSize}
            </span>
          )}
        </label>
        <UnitPicker
          buyUnit={values.buyUnit}
          customName={values.customName}
          customQty={values.customQty}
          customBase={values.customBase as BaseUnit}
          errors={errors}
          onChange={change}
        />
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="ingredient-form-actions">
          {ingredient && (
            <button
              className="text-button delete-button"
              type="button"
              onClick={remove}
            >
              {ingredientCopy.delete}
            </button>
          )}
          <button
            className="button"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {ingredientCopy.cancel}
          </button>
          <button
            className="button button-primary"
            disabled={saving}
            type="submit"
          >
            {saving ? 'Menyimpan…' : ingredientCopy.save}
          </button>
        </div>
      </form>
    </dialog>
  );
}
