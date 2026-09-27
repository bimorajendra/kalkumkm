'use client';

import type { BaseUnit } from '@takaran/calc';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IngredientRow } from '@/domain/types';
import { commonIngredients, findCommonIngredient } from './common-ingredients';
import { ingredientCopy } from './copy';
import {
  type IngredientFormValues,
  ingredientFormSchema,
  ingredientInputFromForm,
} from './schema';

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

const units = ['kg', 'g', 'l', 'ml', 'butir', 'pcs', 'bungkus'];

export function IngredientForm({
  open,
  ingredient,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  ingredient?: IngredientRow;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const run = useRun();
  const [values, setValues] = useState(() => valuesFor(ingredient));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(valuesFor(ingredient));
      setErrors({});
      setFormError('');
    }
  }, [ingredient, open]);

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
      await run(
        ingredient
          ? { type: 'ingredient.update', id: ingredient.id, input }
          : { type: 'ingredient.create', input },
      );
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'DUPLICATE')
        setErrors((current) => ({
          ...current,
          name: ingredientCopy.duplicate,
        }));
      else setFormError(errorMessage(error, ingredientCopy.saveError));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!ingredient || !window.confirm('Hapus bahan ini?')) return;
    try {
      await run({ type: 'ingredient.delete', id: ingredient.id });
      onOpenChange(false);
    } catch (error) {
      setFormError(errorMessage(error, ingredientCopy.saveError));
    }
  }

  const custom = values.buyUnit === 'bungkus' || values.buyUnit === 'custom';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-semibold">
            {ingredient ? 'Ubah bahan' : 'Tambah bahan'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Isi nama, harga beli, dan isi kemasan bahan.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={save} noValidate>
          <Field id="ingredient-name" label="Nama bahan" error={errors.name}>
            <Input
              {...fieldProps('ingredient-name', errors.name)}
              autoComplete="off"
              list="common-ingredient-suggestions"
              maxLength={60}
              value={values.name}
              onChange={(event) => {
                const name = event.target.value;
                change('name', name);
                const suggestion = findCommonIngredient(name);
                if (suggestion) change('buyUnit', suggestion.buyUnit);
              }}
            />
            {!ingredient ? (
              <datalist id="common-ingredient-suggestions">
                {commonIngredients.map((item) => (
                  <option key={item.name} value={item.name} />
                ))}
              </datalist>
            ) : null}
          </Field>
          <Field
            id="ingredient-price"
            label={ingredientCopy.priceLabel}
            error={errors.buyPrice}
          >
            <Input
              {...fieldProps('ingredient-price', errors.buyPrice)}
              inputMode="numeric"
              autoComplete="off"
              value={values.buyPrice}
              onChange={(event) => change('buyPrice', event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="ingredient-pack"
              label={ingredientCopy.packLabel}
              error={errors.packSize}
            >
              <Input
                {...fieldProps('ingredient-pack', errors.packSize)}
                inputMode="decimal"
                autoComplete="off"
                value={values.packSize}
                onChange={(event) => change('packSize', event.target.value)}
              />
            </Field>
            <Field
              id="ingredient-unit"
              label={ingredientCopy.unitLabel}
              error={errors.buyUnit}
            >
              <Select
                value={values.buyUnit}
                onValueChange={(value) => change('buyUnit', value)}
              >
                <SelectTrigger id="ingredient-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    {ingredientCopy.customUnit}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          {custom ? (
            <div className="grid gap-4 rounded-lg bg-secondary p-4">
              {values.buyUnit === 'custom' ? (
                <Field
                  id="ingredient-custom-name"
                  label="Nama satuan"
                  error={errors.customName}
                >
                  <Input
                    {...fieldProps('ingredient-custom-name', errors.customName)}
                    autoComplete="off"
                    maxLength={24}
                    value={values.customName}
                    onChange={(event) =>
                      change('customName', event.target.value)
                    }
                  />
                </Field>
              ) : null}
              <Field
                id="ingredient-custom-qty"
                label="Isi dalam satuan dasar"
                error={errors.customQty}
              >
                <Input
                  {...fieldProps('ingredient-custom-qty', errors.customQty)}
                  inputMode="decimal"
                  value={values.customQty}
                  onChange={(event) => change('customQty', event.target.value)}
                />
              </Field>
              <Field id="ingredient-custom-base" label="Satuan dasar">
                <Select
                  value={values.customBase as BaseUnit}
                  onValueChange={(value) => change('customBase', value)}
                >
                  <SelectTrigger id="ingredient-custom-base" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">gram (g)</SelectItem>
                    <SelectItem value="ml">mililiter (ml)</SelectItem>
                    <SelectItem value="pcs">butir atau pcs</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : null}
          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-between">
            {ingredient ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={remove}
              >
                {ingredientCopy.delete}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {ingredientCopy.cancel}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan…' : ingredientCopy.save}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
