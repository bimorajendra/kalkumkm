'use client';

import { unitPrice } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import {
  errorMessage,
  useRun,
  useSnapshot,
} from '@/components/takaran/data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usageCount } from '@/domain/ingredients';
import type { IngredientRow } from '@/domain/types';
import { ingredientCopy } from './copy';

const packageFormat = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 3,
});
const unitNames: Record<string, string> = { g: 'gram', ml: 'ml', pcs: 'pcs' };
const fixedBase: Record<string, string> = {
  kg: 'g',
  g: 'g',
  l: 'ml',
  ml: 'ml',
  butir: 'pcs',
  pcs: 'pcs',
};

function IngredientRowView({
  ingredient,
  used,
  onEdit,
}: {
  ingredient: IngredientRow;
  used: number;
  onEdit: (ingredient: IngredientRow) => void;
}) {
  const run = useRun();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(ingredient.buyPrice));
  const [error, setError] = useState('');
  const [showUsage, setShowUsage] = useState(false);
  const saving = useRef(false);

  const base =
    ingredient.customUnits.find(({ name }) => name === ingredient.buyUnit)
      ?.base ??
    fixedBase[ingredient.buyUnit] ??
    'g';

  async function savePrice() {
    if (saving.current || !editing) return;
    const value = Number(price);
    if (!/^\d+$/.test(price) || value < 1 || value > 100_000_000) {
      setError('Masukkan harga Rp 1 sampai Rp 100.000.000.');
      return;
    }
    saving.current = true;
    try {
      const changed = value !== ingredient.buyPrice;
      if (changed)
        await run({
          type: 'ingredient.price',
          id: ingredient.id,
          buyPrice: value,
        });
      setEditing(false);
      setError('');
      if (changed) setShowUsage(true);
    } catch (cause) {
      setError(errorMessage(cause, 'Harga belum tersimpan. Coba lagi.'));
    } finally {
      saving.current = false;
    }
  }

  function cancelPrice() {
    setPrice(String(ingredient.buyPrice));
    setError('');
    setEditing(false);
  }

  return (
    <li className="flex min-h-14 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <button
          type="button"
          className="block min-h-11 text-left text-base font-medium underline-offset-4 hover:underline"
          onClick={() => onEdit(ingredient)}
        >
          {ingredient.name}
        </button>
        <span className="block text-sm text-muted-foreground">
          {packageFormat.format(ingredient.packSize)} {ingredient.buyUnit} ·{' '}
          {formatRupiah(unitPrice(ingredient))}/{unitNames[base] ?? base}
        </span>
        {showUsage && used > 0 ? (
          <Link
            href="/resep"
            className="text-sm text-link underline underline-offset-4"
          >
            {ingredientCopy.usedBy(used)}
          </Link>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <label className="sr-only" htmlFor={`price-${ingredient.id}`}>
              {ingredient.name}, {ingredientCopy.priceLabel}
            </label>
            <Input
              id={`price-${ingredient.id}`}
              className="w-32"
              inputMode="numeric"
              autoFocus
              value={price}
              aria-invalid={error ? true : undefined}
              aria-describedby={
                error ? `price-error-${ingredient.id}` : undefined
              }
              onChange={(event) => {
                setPrice(event.target.value);
                setError('');
              }}
              onBlur={() => {
                if (!saving.current) void savePrice();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void savePrice();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelPrice();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void savePrice()}
            >
              {ingredientCopy.savePrice}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onMouseDown={(event) => event.preventDefault()}
              onClick={cancelPrice}
            >
              {ingredientCopy.cancel}
            </Button>
          </>
        ) : (
          <>
            <span className="text-base font-semibold tabular-nums">
              {formatRupiah(ingredient.buyPrice)}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setPrice(String(ingredient.buyPrice));
                setEditing(true);
              }}
            >
              {ingredientCopy.editPrice}
            </Button>
          </>
        )}
      </div>
      {error ? (
        <p
          id={`price-error-${ingredient.id}`}
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function IngredientList({
  query,
  onEdit,
}: {
  query: string;
  onEdit: (ingredient: IngredientRow) => void;
}) {
  const { ingredients, recipes } = useSnapshot();
  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('id-ID');
    return ingredients
      .filter(
        (row) =>
          !needle || row.name.toLocaleLowerCase('id-ID').includes(needle),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'id'))
      .map((ingredient) => ({
        ingredient,
        used: usageCount(recipes, ingredient.id),
      }));
  }, [ingredients, recipes, query]);

  if (rows.length === 0)
    return (
      <p className="py-6 text-muted-foreground">
        {query ? 'Bahan tidak ditemukan.' : 'Belum ada bahan.'}
      </p>
    );
  return (
    <ul aria-label="Daftar bahan" className="divide-y divide-border">
      {rows.map(({ ingredient, used }) => (
        <IngredientRowView
          key={ingredient.id}
          ingredient={ingredient}
          used={used}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
