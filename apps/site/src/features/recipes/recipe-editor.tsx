'use client';

import { unitFactor } from '@takaran/calc';
import { PRICING } from '@takaran/schema';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import {
  CommandError,
  errorMessage,
  useRun,
  useSnapshot,
} from '@/components/takaran/data-provider';
import { Field, fieldProps } from '@/components/takaran/field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IngredientRow, RecipeRow } from '@/domain/types';
import { PaywallDialog } from '@/features/billing/paywall-dialog';
import { recipeCopy } from './copy';
import { recipeInputFromForm } from './recipe-input';
import { type RecipeFormValues, recipeFormSchema } from './schema';

const blank: RecipeFormValues = {
  name: '',
  yieldPortions: '1',
  packagingPerPortion: '0',
  energyPerBatch: '0',
  laborMinutesPerBatch: '0',
  laborRatePerHour: '',
  isSubRecipe: false,
  subRecipeYieldQty: '1',
  subRecipeYieldUnit: 'g',
  items: [],
};

function valuesFor(recipe?: RecipeRow): RecipeFormValues {
  if (!recipe) return blank;
  return {
    name: recipe.name,
    yieldPortions: String(recipe.yieldPortions),
    packagingPerPortion: String(recipe.packagingPerPortion),
    energyPerBatch: String(recipe.energyPerBatch),
    laborMinutesPerBatch: String(recipe.laborMinutesPerBatch),
    laborRatePerHour:
      recipe.laborRatePerHour === null ? '' : String(recipe.laborRatePerHour),
    isSubRecipe: recipe.isSubRecipe,
    subRecipeYieldQty: String(recipe.subRecipeYield?.qty ?? 1),
    subRecipeYieldUnit: recipe.subRecipeYield?.unit ?? 'g',
    items: recipe.items.map(({ refType, refId, quantity, unit }) => ({
      refType,
      refId,
      quantity: String(quantity),
      unit,
    })),
  };
}

const commonUnits = ['g', 'kg', 'ml', 'l', 'butir', 'pcs'];

/** Satuan yang boleh dipakai satu baris: harus satu dimensi dengan bahannya. */
function unitsFor(
  item: RecipeFormValues['items'][number],
  ingredients: IngredientRow[],
  recipes: RecipeRow[],
): string[] {
  const ingredient =
    item.refType === 'ingredient'
      ? ingredients.find((row) => row.id === item.refId)
      : undefined;
  const sub =
    item.refType === 'recipe'
      ? recipes.find((row) => row.id === item.refId)
      : undefined;
  const unit = ingredient?.buyUnit ?? sub?.subRecipeYield?.unit;
  if (!unit) return [];
  const custom = ingredient?.customUnits ?? [];
  let dimension: string;
  try {
    dimension = unitFactor(unit, custom).base;
  } catch {
    return [unit];
  }
  return [
    ...new Set([...commonUnits, ...custom.map((row) => row.name)]),
  ].filter((candidate) => {
    try {
      return unitFactor(candidate, custom).base === dimension;
    } catch {
      return false;
    }
  });
}

export function RecipeEditor({
  open,
  recipe,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  recipe?: RecipeRow;
  onOpenChange: (open: boolean) => void;
  onSaved?: (recipeId: string) => void;
  onDeleted?: () => void;
}) {
  const run = useRun();
  const { ingredients, recipes, plan, settings } = useSnapshot();
  const [values, setValues] = useState(() => valuesFor(recipe));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [showPaywallLink, setShowPaywallLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paywall, setPaywall] = useState<'sub_recipe' | 'recipe' | null>(null);

  useEffect(() => {
    if (open) {
      setValues(valuesFor(recipe));
      setErrors({});
      setMessage('');
      setShowPaywallLink(false);
    }
  }, [open, recipe]);

  function update<K extends keyof RecipeFormValues>(
    field: K,
    value: RecipeFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  function updateItem(
    index: number,
    field: 'quantity' | 'unit',
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setErrors((current) => ({ ...current, [`items.${index}.${field}`]: '' }));
  }

  function addItem(value: string) {
    const [refType, ...rest] = value.split(':');
    const id = rest.join(':');
    if (refType !== 'ingredient' && refType !== 'recipe') return;
    if (
      values.items.some((item) => item.refType === refType && item.refId === id)
    )
      return;
    const ingredient = ingredients.find((item) => item.id === id);
    const sub = recipes.find((item) => item.id === id);
    if (
      (refType === 'ingredient' && !ingredient) ||
      (refType === 'recipe' && !sub?.subRecipeYield)
    )
      return;
    setValues((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          refType,
          refId: id,
          quantity: '1',
          unit: ingredient?.buyUnit ?? sub?.subRecipeYield?.unit ?? 'g',
        },
      ],
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = recipeFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[issue.path.join('.')] = issue.message;
      setErrors(next);
      return;
    }
    setSaving(true);
    setMessage('');
    setShowPaywallLink(false);
    try {
      const input = recipeInputFromForm(
        parsed.data,
        { targetMarginBp: settings.defaultMarginBp },
        recipe,
      );
      const before = new Set(recipes.map((row) => row.id));
      const next = await run(
        recipe
          ? { type: 'recipe.update', id: recipe.id, input }
          : { type: 'recipe.create', input },
      );
      onSaved?.(
        recipe?.id ?? next.recipes.find((row) => !before.has(row.id))?.id ?? '',
      );
      onOpenChange(false);
    } catch (error) {
      if (error instanceof CommandError) {
        if (error.code === 'PRO_REQUIRED') setPaywall('sub_recipe');
        setShowPaywallLink(error.code === 'FREE_LIMIT');
      }
      setMessage(errorMessage(error, recipeCopy.saveError));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!recipe || !window.confirm(`Hapus resep “${recipe.name}”?`)) return;
    try {
      await run({ type: 'recipe.delete', id: recipe.id });
      onDeleted?.();
      onOpenChange(false);
    } catch (error) {
      setMessage(errorMessage(error, recipeCopy.deleteError));
    }
  }

  const subRecipes = recipes.filter(
    (item) =>
      item.isSubRecipe &&
      item.id !== recipe?.id &&
      !values.items.some(
        (entry) => entry.refType === 'recipe' && entry.refId === item.id,
      ),
  );
  const freeIngredients = ingredients.filter(
    (item) =>
      !values.items.some(
        (entry) => entry.refType === 'ingredient' && entry.refId === item.id,
      ),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">
            {recipe ? 'Ubah resep' : 'Buat resep'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Isi nama resep, bahan dan takarannya, lalu biaya per adonan.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={save} noValidate>
          <Field id="recipe-name" label="Nama resep" error={errors.name}>
            <Input
              {...fieldProps('recipe-name', errors.name)}
              maxLength={60}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </Field>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm font-medium">
              Bahan dan takaran
            </legend>
            {values.items.length > 0 ? (
              <ul className="grid gap-3">
                {values.items.map((item, index) => {
                  const ingredient =
                    item.refType === 'ingredient'
                      ? ingredients.find(({ id }) => id === item.refId)
                      : undefined;
                  const sub =
                    item.refType === 'recipe'
                      ? recipes.find(({ id }) => id === item.refId)
                      : undefined;
                  const name = (ingredient ?? sub)?.name;
                  const error =
                    errors[`items.${index}.quantity`] ??
                    errors[`items.${index}.refId`];
                  return (
                    <li
                      key={`${item.refType}-${item.refId}`}
                      className="grid grid-cols-[1fr_5.5rem_5.5rem_auto] items-center gap-2"
                    >
                      <span className="min-w-0 font-medium">
                        {name ?? 'Bahan ini sudah dihapus'}
                      </span>
                      {name ? (
                        <>
                          <Input
                            aria-label={`Takaran ${name}`}
                            aria-invalid={error ? true : undefined}
                            inputMode="decimal"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(index, 'quantity', event.target.value)
                            }
                          />
                          <Select
                            value={item.unit}
                            onValueChange={(value) =>
                              updateItem(index, 'unit', value)
                            }
                          >
                            <SelectTrigger
                              aria-label={`Satuan ${name}`}
                              className="w-full px-2"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {unitsFor(item, ingredients, recipes).map(
                                (option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <span className="col-span-2 text-sm text-destructive">
                          Hapus baris ini atau pilih bahan lain.
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setValues((current) => ({
                            ...current,
                            items: current.items.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        Hapus
                      </Button>
                      {error && name ? (
                        <p
                          role="alert"
                          className="col-span-full text-sm text-destructive"
                        >
                          {error}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {ingredients.length > 0 || subRecipes.length > 0 ? (
              <Field id="recipe-add-item" label="Tambah bahan atau sub-resep">
                <Select
                  key={values.items.length}
                  value=""
                  onValueChange={addItem}
                >
                  <SelectTrigger id="recipe-add-item" className="w-full">
                    <SelectValue placeholder="Pilih bahan atau sub-resep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Bahan</SelectLabel>
                      {freeIngredients.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={`ingredient:${item.id}`}
                        >
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {subRecipes.length > 0 ? (
                      <SelectGroup>
                        <SelectLabel>Sub-resep</SelectLabel>
                        {subRecipes.map((item) => (
                          <SelectItem key={item.id} value={`recipe:${item.id}`}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : null}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <p className="text-sm text-muted-foreground">
                {recipeCopy.noIngredients}
              </p>
            )}
          </fieldset>

          <fieldset className="grid gap-3 rounded-lg bg-secondary p-4">
            <legend className="px-1 text-sm font-medium">Sub-resep</legend>
            <label className="flex min-h-11 items-center gap-3">
              <Checkbox
                checked={values.isSubRecipe}
                onCheckedChange={(checked) => {
                  if (checked === true && plan !== 'pro')
                    setPaywall('sub_recipe');
                  else update('isSubRecipe', checked === true);
                }}
              />
              Pakai sebagai bahan di resep lain
            </label>
            {values.isSubRecipe ? (
              <div className="grid grid-cols-2 gap-3">
                <Field id="sub-recipe-yield" label="Hasil sub-resep">
                  <Input
                    id="sub-recipe-yield"
                    inputMode="decimal"
                    value={values.subRecipeYieldQty}
                    onChange={(event) =>
                      update('subRecipeYieldQty', event.target.value)
                    }
                  />
                </Field>
                <Field id="sub-recipe-unit" label="Satuan hasil">
                  <Select
                    value={values.subRecipeYieldUnit}
                    onValueChange={(value) =>
                      update('subRecipeYieldUnit', value)
                    }
                  >
                    <SelectTrigger id="sub-recipe-unit" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {commonUnits.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ) : null}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              id="recipe-yield"
              label="Hasil per adonan (porsi)"
              error={errors.yieldPortions}
            >
              <Input
                {...fieldProps('recipe-yield', errors.yieldPortions)}
                inputMode="numeric"
                value={values.yieldPortions}
                onChange={(event) =>
                  update('yieldPortions', event.target.value)
                }
              />
            </Field>
            <Field
              id="recipe-packaging"
              label="Kemasan per porsi (Rp)"
              error={errors.packagingPerPortion}
            >
              <Input
                {...fieldProps('recipe-packaging', errors.packagingPerPortion)}
                inputMode="numeric"
                value={values.packagingPerPortion}
                onChange={(event) =>
                  update('packagingPerPortion', event.target.value)
                }
              />
            </Field>
            <Field
              id="recipe-energy"
              label="Energi per adonan (Rp)"
              error={errors.energyPerBatch}
            >
              <Input
                {...fieldProps('recipe-energy', errors.energyPerBatch)}
                inputMode="numeric"
                value={values.energyPerBatch}
                onChange={(event) =>
                  update('energyPerBatch', event.target.value)
                }
              />
            </Field>
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm font-medium">
              Tenaga, kalau mau dihitung
            </legend>
            <p className="text-sm text-muted-foreground">
              Kalau dikosongkan, hasil untung per jam nanti menunjukkan upah
              yang kamu terima.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="recipe-labor-rate"
                label="Upah per jam (Rp)"
                error={errors.laborRatePerHour}
              >
                <Input
                  {...fieldProps('recipe-labor-rate', errors.laborRatePerHour)}
                  inputMode="numeric"
                  value={values.laborRatePerHour}
                  onChange={(event) =>
                    update('laborRatePerHour', event.target.value)
                  }
                />
              </Field>
              <Field
                id="recipe-labor-minutes"
                label="Waktu kerja per adonan (menit)"
                error={errors.laborMinutesPerBatch}
              >
                <Input
                  {...fieldProps(
                    'recipe-labor-minutes',
                    errors.laborMinutesPerBatch,
                  )}
                  inputMode="numeric"
                  value={values.laborMinutesPerBatch}
                  onChange={(event) =>
                    update('laborMinutesPerBatch', event.target.value)
                  }
                />
              </Field>
            </div>
          </fieldset>

          {message ? (
            <p role="alert" className="text-sm text-destructive">
              {message}
              {showPaywallLink ? (
                <>
                  {' '}
                  <Link href="/beli" className="underline underline-offset-4">
                    Takaran Pro, {formatRupiah(PRICING.pro.idr)} sekali bayar
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-between">
            {recipe ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={remove}
              >
                Hapus resep
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
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan resep'}
              </Button>
            </div>
          </DialogFooter>
        </form>
        <PaywallDialog
          open={paywall !== null}
          trigger={paywall ?? 'sub_recipe'}
          onClose={() => setPaywall(null)}
        />
      </DialogContent>
    </Dialog>
  );
}
