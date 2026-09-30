'use client';

import type { CalcContext } from '@takaran/calc';
import { calculateOrder, shoppingListForOrder } from '@takaran/calc/order';
import { formatRupiah } from '@takaran/ui/format';
import Big from 'big.js';
import { useMemo, useState } from 'react';
import { useRecipeResults } from '@/components/takaran/data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function OrderCalculator({ recipeId }: { recipeId: string }) {
  const { snapshot } = useRecipeResults();
  const [portions, setPortions] = useState('50');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('0');
  const [submitted, setSubmitted] = useState(true);
  const recipe = snapshot.recipes.find((row) => row.id === recipeId);
  const context = useMemo<CalcContext>(
    () => ({
      ingredients: new Map(snapshot.ingredients.map((row) => [row.id, row])),
      recipes: new Map(snapshot.recipes.map((row) => [row.id, row])),
      roundingStep: snapshot.settings.roundingStep,
    }),
    [snapshot],
  );
  const result = useMemo(() => {
    if (!recipe || !submitted) return null;
    try {
      const units = Number(portions);
      const salesPrice = Number(price || recipe.currentPrice || 0);
      const feeBp = new Big(commission || '0').times(100).round(0).toNumber();
      if (!Number.isSafeInteger(feeBp))
        throw new Error('Komisi harus berupa persentase yang valid.');
      const totals = calculateOrder(recipe, units, salesPrice, feeBp, context);
      const list = shoppingListForOrder(recipe, units, context);
      return { ok: true as const, totals, list };
    } catch (cause) {
      return {
        ok: false as const,
        error:
          cause instanceof Error
            ? cause.message
            : 'Periksa jumlah pesanan dan harga.',
      };
    }
  }, [recipe, portions, price, commission, context, submitted]);

  if (!recipe) return null;
  function calculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }
  return (
    <section
      className="grid gap-5 rounded-2xl border border-input/60 bg-card p-5 lg:p-7"
      aria-labelledby="order-calculator-title"
    >
      <header className="grid gap-2">
        <h2
          id="order-calculator-title"
          className="font-display text-2xl font-semibold"
        >
          Hitung pesanan dan belanja
        </h2>
        <p className="text-sm text-muted-foreground">
          Porsi dihitung sesuai jumlah yang dimasukkan. Daftar belanja
          membulatkan pembelian ke kemasan utuh.
        </p>
      </header>
      <form onSubmit={calculate} className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Jumlah porsi
          <Input
            required
            type="number"
            min="1"
            step="1"
            value={portions}
            onChange={(event) => {
              setPortions(event.target.value);
              setSubmitted(true);
            }}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Harga jual per porsi (Rp)
          <Input
            required
            type="number"
            min="0"
            step="1"
            placeholder={String(recipe.currentPrice ?? 0)}
            value={price}
            onChange={(event) => {
              setPrice(event.target.value);
              setSubmitted(true);
            }}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Komisi saluran (%)
          <Input
            required
            type="number"
            min="0"
            max="99.99"
            step="0.01"
            value={commission}
            onChange={(event) => {
              setCommission(event.target.value);
              setSubmitted(true);
            }}
          />
        </label>
        <Button type="submit" className="min-h-11 sm:col-span-3">
          Hitung pesanan
        </Button>
      </form>
      {result && !result.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {result.error}
        </p>
      ) : null}
      {result?.ok ? (
        <div aria-live="polite" className="grid gap-5">
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Modal produksi</dt>
              <dd className="font-semibold">
                {formatRupiah(result.totals.productionCost)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Omzet</dt>
              <dd className="font-semibold">
                {formatRupiah(result.totals.grossRevenue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Komisi</dt>
              <dd className="font-semibold">
                {formatRupiah(result.totals.commissionCost)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Laba setelah komisi
              </dt>
              <dd className="font-semibold">
                {formatRupiah(result.totals.profit)}
              </dd>
            </div>
          </dl>
          <div className="grid gap-3">
            <h3 className="font-semibold">Daftar belanja</h3>
            <ul className="grid gap-2">
              {result.list.map((item) => (
                <li
                  key={item.ingredientId}
                  className="flex flex-wrap justify-between gap-2 border-b border-input/50 py-2 text-sm"
                >
                  <span>
                    {item.name}: perlu {item.neededQuantity.toString()}{' '}
                    {item.baseUnit}
                  </span>
                  <span className="font-medium">
                    Beli {item.packageCount} kemasan, total{' '}
                    {item.purchaseQuantity.toString()} {item.purchaseUnit}:{' '}
                    {formatRupiah(item.estimatedPurchaseCost)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
