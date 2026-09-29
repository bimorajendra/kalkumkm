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

  function startEditingPrice() {
    setPrice(String(ingredient.buyPrice));
    setEditing(true);
  }

  return (
    <li className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(132px,1fr)_minmax(130px,1fr)_minmax(95px,0.7fr)] sm:items-center sm:gap-4 sm:px-4">
      <div className="min-w-0">
        <button
          type="button"
          className="block min-h-11 text-left text-base font-medium underline-offset-4 hover:underline"
          onClick={() => onEdit(ingredient)}
        >
          {ingredient.name}
        </button>
        <span className="block text-sm text-muted-foreground">
          Isi kemasan {packageFormat.format(ingredient.packSize)}{' '}
          {ingredient.buyUnit}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-2 sm:block">
        <span className="text-sm text-muted-foreground sm:hidden">
          Harga beli
        </span>
        <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
          {editing ? (
            <>
              <label className="sr-only" htmlFor={`price-${ingredient.id}`}>
                {ingredient.name}, {ingredientCopy.priceLabel}
              </label>
              <div className="relative w-32">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  Rp
                </span>
                <Input
                  id={`price-${ingredient.id}`}
                  className="pl-9 text-right font-semibold tabular-nums"
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
              </div>
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
            <button
              type="button"
              className="flex min-h-11 w-full max-w-40 items-center justify-between rounded-[10px] border border-input bg-surface px-3 text-sm font-medium tabular-nums transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Ubah harga ${ingredient.name}`}
              onClick={startEditingPrice}
            >
              <span className="text-muted-foreground">Rp</span>
              <span>
                {formatRupiah(ingredient.buyPrice).replace(/^Rp\s*/, '')}
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:block">
        <span className="text-sm text-muted-foreground sm:hidden">
          Per satuan
        </span>
        <strong className="tabular-nums">
          {formatRupiah(unitPrice(ingredient))}/{unitNames[base] ?? base}
        </strong>
      </div>
      <div className="flex items-center justify-between gap-3 sm:block">
        <span className="text-sm text-muted-foreground sm:hidden">
          Dipakai di
        </span>
        {showUsage && used > 0 ? (
          <Link
            href="/dashboard/resep"
            className="text-sm font-medium text-link underline underline-offset-4"
          >
            {ingredientCopy.usedBy(used)}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">
            {used ? `${used} resep` : 'Belum dipakai'}
          </span>
        )}
      </div>
      {error ? (
        <p
          id={`price-error-${ingredient.id}`}
          role="alert"
          className="text-sm text-destructive sm:col-span-full"
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
    <section
      aria-label="Daftar bahan"
      className="overflow-hidden rounded-[20px] border border-line bg-surface"
    >
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(0,1.5fr)_minmax(132px,1fr)_minmax(130px,1fr)_minmax(95px,0.7fr)] gap-4 border-b border-line bg-surface-soft px-4 py-3 text-sm font-medium text-ink-muted sm:grid"
      >
        <span>Bahan</span>
        <span className="text-right">Harga beli</span>
        <span>Per satuan</span>
        <span>Dipakai di</span>
      </div>
      <ul
        aria-label="Baris bahan"
        className="divide-y divide-line px-4 sm:px-0"
      >
        {rows.map(({ ingredient, used }) => (
          <IngredientRowView
            key={ingredient.id}
            ingredient={ingredient}
            used={used}
            onEdit={onEdit}
          />
        ))}
      </ul>
    </section>
  );
}
