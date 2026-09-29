'use client';

import {
  CalcError,
  type RecipeResult,
  recalcAll,
  unitFactor,
} from '@takaran/calc';
import { PRICING } from '@takaran/schema';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
const recipeSteps = [
  {
    title: 'Detail resep',
    description: 'Beri nama resep dan isi hasil per adonan.',
  },
  {
    title: 'Bahan',
    description: 'Tambahkan bahan yang dipakai dan takarannya.',
  },
  {
    title: 'Biaya tambahan',
    description:
      'Isi kemasan dan energi. Tenaga kerja bisa ditambahkan bila diperlukan.',
  },
];

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
  inline = false,
  hpp,
  batchCost,
  onOpenChange,
  onSaved,
  onDeleted,
  onDuplicate,
}: {
  open: boolean;
  recipe?: RecipeRow;
  inline?: boolean;
  hpp?: RecipeResult['hpp'];
  batchCost?: RecipeResult['batchCost'];
  onOpenChange: (open: boolean) => void;
  onSaved?: (recipeId: string) => void;
  onDeleted?: () => void;
  onDuplicate?: () => void;
}) {
  const run = useRun();
  const { ingredients, recipes, plan, settings } = useSnapshot();
  const [values, setValues] = useState(() => valuesFor(recipe));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [laborOpen, setLaborOpen] = useState(false);
  const [subRecipeOpen, setSubRecipeOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPaywallLink, setShowPaywallLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paywall, setPaywall] = useState<'sub_recipe' | 'recipe' | null>(null);

  useEffect(() => {
    if (open) {
      setValues(valuesFor(recipe));
      setErrors({});
      setStep(0);
      setLaborOpen(
        Boolean(
          recipe &&
            (recipe.laborMinutesPerBatch > 0 ||
              recipe.laborRatePerHour !== null),
        ),
      );
      setSubRecipeOpen(Boolean(recipe?.isSubRecipe));
      setMessage('');
      setSaveSuccess(false);
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

  async function saveRecipe() {
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
    setSaveSuccess(false);
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
      if (inline) {
        setMessage('Perubahan resep tersimpan.');
        setSaveSuccess(true);
      } else onOpenChange(false);
    } catch (error) {
      setSaveSuccess(false);
      if (error instanceof CommandError) {
        if (error.code === 'PRO_REQUIRED') setPaywall('sub_recipe');
        setShowPaywallLink(error.code === 'FREE_LIMIT');
      }
      setMessage(errorMessage(error, recipeCopy.saveError));
    } finally {
      setSaving(false);
    }
  }

  function continueStep() {
    if (step >= recipeSteps.length - 1 || saving) return;
    const fields = step === 0 ? ['name', 'yieldPortions'] : ['items'];
    const parsed = recipeFormSchema.safeParse(values);
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (fields.includes(String(issue.path[0])))
          nextErrors[issue.path.join('.')] = issue.message;
      }
    }
    setErrors((current) => {
      const next = { ...current };
      for (const field of fields) {
        for (const key of Object.keys(next))
          if (key === field || key.startsWith(`${field}.`)) delete next[key];
      }
      return { ...next, ...nextErrors };
    });
    if (Object.keys(nextErrors).length === 0) setStep((current) => current + 1);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  async function remove() {
    if (!recipe || !window.confirm(`Hapus resep “${recipe.name}”?`)) return;
    try {
      await run({ type: 'recipe.delete', id: recipe.id });
      onDeleted?.();
      if (!inline) onOpenChange(false);
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
  const preview = useMemo(() => {
    if (!inline || !recipe) return undefined;
    const parsed = recipeFormSchema.safeParse(values);
    if (!parsed.success) return undefined;
    const nextRecipe = {
      ...recipe,
      ...recipeInputFromForm(
        parsed.data,
        { targetMarginBp: settings.defaultMarginBp },
        recipe,
      ),
    };
    const nextRecipes = new Map(recipes.map((item) => [item.id, item]));
    nextRecipes.set(recipe.id, nextRecipe);
    const nextResults = recalcAll({
      ingredients: new Map(ingredients.map((item) => [item.id, item])),
      recipes: nextRecipes,
      roundingStep: settings.roundingStep,
    });
    const result = nextResults.get(recipe.id);
    return result instanceof CalcError ? undefined : result;
  }, [inline, ingredients, recipe, recipes, settings, values]);
  const currentHpp = preview?.hpp ?? hpp;
  const currentBatchCost = preview?.batchCost ?? batchCost;

  const form = (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      {!inline ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              Langkah {step + 1} dari {recipeSteps.length}:{' '}
              {recipeSteps[step]?.title}
            </p>
            <span className="text-sm text-muted-foreground">
              {Math.round(((step + 1) / recipeSteps.length) * 100)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Progres pembuatan resep"
            aria-valuemin={1}
            aria-valuemax={recipeSteps.length}
            aria-valuenow={step + 1}
            className="h-1.5 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${((step + 1) / recipeSteps.length) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {inline ? (
        <header className="grid gap-3 sm:flex sm:items-center sm:justify-between">
          <div className="grid gap-1.5">
            <label className="sr-only" htmlFor="recipe-name-inline">
              Nama resep
            </label>
            <Input
              {...fieldProps('recipe-name-inline', errors.name)}
              className="h-auto border-0 bg-transparent px-0 font-display text-3xl font-semibold shadow-none focus-visible:ring-0 sm:text-4xl"
              maxLength={60}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
            {errors.name ? (
              <p
                id="recipe-name-inline-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {onDuplicate ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={onDuplicate}
              >
                Duplikat
              </Button>
            ) : null}
            <Button asChild variant="outline" className="rounded-xl">
              <Link
                href={`/dashboard/hitung?resep=${encodeURIComponent(recipe?.id ?? '')}`}
              >
                Hitung harga
              </Link>
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving}
              onClick={() => void saveRecipe()}
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </header>
      ) : null}

      {!inline && step === 0 ? (
        <section aria-labelledby="recipe-details-title" className="grid gap-4">
          <div>
            <h2 id="recipe-details-title" className="font-semibold">
              Detail resep
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mulai dari nama dan jumlah hasil satu adonan.
            </p>
          </div>
          <Field id="recipe-name" label="Nama resep" error={errors.name}>
            <Input
              {...fieldProps('recipe-name', errors.name)}
              maxLength={60}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </Field>
          <Field
            id="recipe-yield"
            label="Hasil per adonan (porsi)"
            error={errors.yieldPortions}
          >
            <Input
              {...fieldProps('recipe-yield', errors.yieldPortions)}
              inputMode="numeric"
              value={values.yieldPortions}
              onChange={(event) => update('yieldPortions', event.target.value)}
            />
          </Field>
        </section>
      ) : null}

      <div
        className={
          inline
            ? 'grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.9fr)]'
            : 'grid gap-5'
        }
      >
        <div className="grid content-start gap-5">
          {inline || step === 1 ? (
            <fieldset
              className={
                inline
                  ? 'grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-6'
                  : 'grid gap-3'
              }
            >
              <legend className="mb-1 text-lg font-semibold">
                {inline ? 'Bahan per adonan' : 'Bahan dan takaran'}
              </legend>
              {!inline ? (
                <p className="text-sm text-muted-foreground">
                  Pilih bahan yang sudah kamu simpan. Takaran awal mengikuti
                  satuan beli dan masih bisa diubah.
                </p>
              ) : null}
              {errors.items ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.items}
                </p>
              ) : null}
              {values.items.length > 0 ? (
                <ul className="grid divide-y divide-line">
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
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto]"
                      >
                        <span className="min-w-0 font-medium">
                          {name ?? 'Bahan ini sudah dihapus'}
                        </span>
                        {name ? (
                          <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_minmax(5.5rem,auto)] gap-2 sm:col-span-2 sm:col-start-2 sm:row-start-1">
                            <Input
                              aria-label={`Takaran ${name}`}
                              aria-invalid={error ? true : undefined}
                              inputMode="decimal"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  'quantity',
                                  event.target.value,
                                )
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
                          </div>
                        ) : (
                          <span className="col-span-2 text-sm text-destructive sm:col-start-2 sm:row-start-1">
                            Hapus baris ini atau pilih bahan lain.
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="col-start-2 row-start-1 sm:col-start-4"
                          onClick={() =>
                            setValues((current) => ({
                              ...current,
                              items: current.items.filter(
                                (_, i) => i !== index,
                              ),
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
                <Field
                  id={inline ? 'recipe-add-item-inline' : 'recipe-add-item'}
                  label="Tambah bahan atau sub-resep"
                >
                  <Select
                    key={values.items.length}
                    value=""
                    onValueChange={addItem}
                  >
                    <SelectTrigger
                      id={inline ? 'recipe-add-item-inline' : 'recipe-add-item'}
                      className="w-full"
                    >
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
                            <SelectItem
                              key={item.id}
                              value={`recipe:${item.id}`}
                            >
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
              {inline && currentBatchCost ? (
                <p className="border-t border-line pt-3 text-right text-sm">
                  Total biaya adonan{' '}
                  <strong className="ml-2 tabular-nums">
                    {formatRupiah(currentBatchCost)}
                  </strong>
                </p>
              ) : null}
            </fieldset>
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          {inline || step === 2 ? (
            <section
              aria-labelledby="recipe-costs-title"
              className={
                inline
                  ? 'grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-6'
                  : 'grid gap-4'
              }
            >
              <div>
                <h2 id="recipe-costs-title" className="text-lg font-semibold">
                  {inline ? 'Biaya lain' : 'Biaya per adonan'}
                </h2>
                {!inline ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kosongkan biaya yang belum ingin dihitung. Nilai awalnya
                    nol.
                  </p>
                ) : null}
              </div>
              {inline ? (
                <Field
                  id="recipe-yield-inline"
                  label="Hasil per adonan (porsi)"
                  error={errors.yieldPortions}
                >
                  <Input
                    {...fieldProps('recipe-yield-inline', errors.yieldPortions)}
                    inputMode="numeric"
                    value={values.yieldPortions}
                    onChange={(event) =>
                      update('yieldPortions', event.target.value)
                    }
                  />
                </Field>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Field
                  id="recipe-packaging"
                  label="Kemasan per porsi (Rp)"
                  error={errors.packagingPerPortion}
                >
                  <Input
                    {...fieldProps(
                      'recipe-packaging',
                      errors.packagingPerPortion,
                    )}
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
              <details
                open={laborOpen}
                onToggle={(event) => setLaborOpen(event.currentTarget.open)}
                className="rounded-lg border bg-card p-4"
              >
                <summary className="min-h-11 cursor-pointer content-center font-medium">
                  Tambahkan biaya tenaga kerja (opsional)
                </summary>
                <div className="grid gap-3 pt-3">
                  <p className="text-sm text-muted-foreground">
                    Kalau diisi, biaya tenaga masuk ke HPP. Kalau tidak, hasil
                    untung per jam menunjukkan upah yang kamu terima.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="recipe-labor-rate"
                      label="Upah per jam (Rp)"
                      error={errors.laborRatePerHour}
                    >
                      <Input
                        {...fieldProps(
                          'recipe-labor-rate',
                          errors.laborRatePerHour,
                        )}
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
                </div>
              </details>
              <details
                open={subRecipeOpen}
                onToggle={(event) => setSubRecipeOpen(event.currentTarget.open)}
                className="rounded-lg border bg-card p-4"
              >
                <summary className="min-h-11 cursor-pointer content-center font-medium">
                  Jadikan sub-resep (fitur Pro)
                </summary>
                <div className="grid gap-3 pt-3">
                  <p className="text-sm text-muted-foreground">
                    Gunakan resep ini sebagai bahan, misalnya untuk isian atau
                    adonan dasar.
                  </p>
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
                          <SelectTrigger
                            id="sub-recipe-unit"
                            className="w-full"
                          >
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
                </div>
              </details>
              {inline ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-4">
                  <span className="font-medium">Modal per porsi</span>
                  <strong className="font-display text-2xl font-bold tabular-nums">
                    {currentHpp ? formatRupiah(currentHpp) : 'Menghitung…'}
                  </strong>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      {message ? (
        <p
          role={saveSuccess ? 'status' : 'alert'}
          className={
            saveSuccess
              ? 'text-sm text-muted-foreground'
              : 'text-sm text-destructive'
          }
        >
          {message}
          {showPaywallLink ? (
            <>
              {' '}
              <Link
                href="/dashboard/beli"
                className="underline underline-offset-4"
              >
                Takaran Pro, {formatRupiah(PRICING.pro.idr)} sekali bayar
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      {inline ? (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            onClick={remove}
          >
            Hapus resep
          </Button>
        </div>
      ) : (
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
          <div className="flex flex-wrap justify-end gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
              >
                Kembali
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            {step < recipeSteps.length - 1 ? (
              <Button type="button" onClick={continueStep}>
                Lanjutkan
              </Button>
            ) : (
              <Button
                type="button"
                disabled={saving}
                onClick={() => void saveRecipe()}
              >
                {saving ? 'Menyimpan…' : 'Simpan resep'}
              </Button>
            )}
          </div>
        </DialogFooter>
      )}
    </form>
  );

  if (inline)
    return (
      <section className="grid gap-5">
        {form}
        <PaywallDialog
          open={paywall !== null}
          trigger={paywall ?? 'sub_recipe'}
          onClose={() => setPaywall(null)}
        />
      </section>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto bg-[linear-gradient(145deg,#fff_0%,#fff_68%,#fff4eb_100%)] sm:max-w-xl"
        onInteractOutside={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest('[data-slot="select-content"]')
          )
            event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-semibold">
            {recipe ? 'Ubah resep' : 'Buat resep'}
          </DialogTitle>
          <DialogDescription>
            {recipeSteps[step]?.description} Nilai tetap tersimpan saat kamu
            kembali ke langkah sebelumnya.
          </DialogDescription>
        </DialogHeader>
        {form}
        <PaywallDialog
          open={paywall !== null}
          trigger={paywall ?? 'sub_recipe'}
          onClose={() => setPaywall(null)}
        />
      </DialogContent>
    </Dialog>
  );
}
