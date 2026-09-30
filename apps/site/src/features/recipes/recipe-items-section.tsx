'use client';

import type { RecipeResult } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui/format';
import { Field } from '@/components/takaran/field';
import { Button } from '@/components/ui/button';
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
import { recipeCopy } from './copy';
import { unitsFor } from './recipe-units';
import type { RecipeFormValues } from './schema';

type RecipeItem = RecipeFormValues['items'][number];

export function RecipeItemsSection({
  items,
  errors,
  ingredients,
  recipes,
  freeIngredients,
  subRecipes,
  inline,
  batchCost,
  onAddItem,
  onItemChange,
  onItemRemove,
}: {
  items: RecipeFormValues['items'];
  errors: Record<string, string>;
  ingredients: IngredientRow[];
  recipes: RecipeRow[];
  freeIngredients: IngredientRow[];
  subRecipes: RecipeRow[];
  inline: boolean;
  batchCost?: RecipeResult['batchCost'];
  onAddItem: (value: string) => void;
  onItemChange: (
    index: number,
    field: 'quantity' | 'unit',
    value: string,
  ) => void;
  onItemRemove: (index: number) => void;
}) {
  return (
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
          Pilih bahan yang sudah kamu simpan. Takaran awal mengikuti satuan beli
          dan masih bisa diubah.
        </p>
      ) : null}
      {errors.items ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.items}
        </p>
      ) : null}
      {items.length > 0 ? (
        <ul className="grid divide-y divide-line">
          {items.map((item, index) => (
            <RecipeItemRow
              key={`${item.refType}-${item.refId}`}
              item={item}
              index={index}
              errors={errors}
              ingredients={ingredients}
              recipes={recipes}
              onChange={onItemChange}
              onRemove={onItemRemove}
            />
          ))}
        </ul>
      ) : null}
      {ingredients.length > 0 || subRecipes.length > 0 ? (
        <Field
          id={inline ? 'recipe-add-item-inline' : 'recipe-add-item'}
          label="Tambah bahan atau sub-resep"
        >
          <Select key={items.length} value="" onValueChange={onAddItem}>
            <SelectTrigger
              id={inline ? 'recipe-add-item-inline' : 'recipe-add-item'}
              className="w-full"
            >
              <SelectValue placeholder="Pilih bahan atau sub-resep" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Bahan</SelectLabel>
                {freeIngredients.map((ingredient) => (
                  <SelectItem
                    key={ingredient.id}
                    value={`ingredient:${ingredient.id}`}
                  >
                    {ingredient.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              {subRecipes.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>Sub-resep</SelectLabel>
                  {subRecipes.map((subRecipe) => (
                    <SelectItem
                      key={subRecipe.id}
                      value={`recipe:${subRecipe.id}`}
                    >
                      {subRecipe.name}
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
      {inline && batchCost ? (
        <p className="border-t border-line pt-3 text-right text-sm">
          Total biaya adonan{' '}
          <strong className="ml-2 tabular-nums">
            {formatRupiah(batchCost)}
          </strong>
        </p>
      ) : null}
    </fieldset>
  );
}

function RecipeItemRow({
  item,
  index,
  errors,
  ingredients,
  recipes,
  onChange,
  onRemove,
}: {
  item: RecipeItem;
  index: number;
  errors: Record<string, string>;
  ingredients: IngredientRow[];
  recipes: RecipeRow[];
  onChange: (index: number, field: 'quantity' | 'unit', value: string) => void;
  onRemove: (index: number) => void;
}) {
  const ingredient =
    item.refType === 'ingredient'
      ? ingredients.find(({ id }) => id === item.refId)
      : undefined;
  const subRecipe =
    item.refType === 'recipe'
      ? recipes.find(({ id }) => id === item.refId)
      : undefined;
  const name = (ingredient ?? subRecipe)?.name;
  const error =
    errors[`items.${index}.quantity`] ?? errors[`items.${index}.refId`];

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto]">
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
              onChange(index, 'quantity', event.target.value)
            }
          />
          <Select
            value={item.unit}
            onValueChange={(value) => onChange(index, 'unit', value)}
          >
            <SelectTrigger
              aria-label={`Satuan ${name}`}
              className="w-full px-2"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitsFor(item, ingredients, recipes).map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
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
        onClick={() => onRemove(index)}
      >
        Hapus
      </Button>
      {error && name ? (
        <p role="alert" className="col-span-full text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}
