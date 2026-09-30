'use client';

import { type RecipeResult, suggestPrice } from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { IngredientRow } from '@/domain/types';
import { errorMessage, useRun } from './data-provider';

type AttentionRecipe = {
  id: string;
  name: string;
  hpp: RecipeResult['hpp'] | null;
  marginBp: number | null;
  targetMarginBp: number;
  error: boolean;
};

export function AttentionPanel({
  items,
  roundingStep,
  risingIngredient,
  hasIngredients,
}: {
  items: AttentionRecipe[];
  roundingStep: number;
  risingIngredient?: IngredientRow;
  hasIngredients: boolean;
}) {
  const run = useRun();
  const [applyError, setApplyError] = useState('');

  return (
    <aside
      aria-labelledby="attention-title"
      className="grid content-start gap-4 rounded-[20px] bg-surface p-4 sm:p-5"
    >
      <div>
        <h2 id="attention-title" className="text-xl font-semibold">
          Perlu kamu cek
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hanya resep yang datanya menunjukkan perlu perhatian.
        </p>
      </div>
      {items.length ? (
        <ul className="grid gap-3">
          {items.slice(0, 4).map((item) => {
            const suggested = suggestedPrice(item, roundingStep);
            return (
              <li
                key={item.id}
                className="grid gap-2 rounded-2xl bg-surface p-4"
              >
                <div className="flex gap-3">
                  <TriangleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-caramel-700"
                    strokeWidth={1.75}
                  />
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.error || item.marginBp === null
                        ? 'HPP belum bisa dihitung. Periksa bahan dan takaran.'
                        : `Margin ${formatPercent(item.marginBp)} berada di bawah target ${formatPercent(item.targetMarginBp)}.`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-8">
                  {suggested !== null ? (
                    <Button
                      type="button"
                      onClick={async () => {
                        setApplyError('');
                        try {
                          await run({
                            type: 'alarm.applyPrice',
                            recipeId: item.id,
                            price: suggested,
                          });
                        } catch (cause) {
                          setApplyError(
                            errorMessage(
                              cause,
                              'Harga belum tersimpan. Coba lagi.',
                            ),
                          );
                        }
                      }}
                    >
                      Pakai harga saran {formatRupiah(suggested)}
                    </Button>
                  ) : null}
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/resep/${item.id}`}>
                      Periksa resep
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl bg-surface p-4 text-muted-foreground">
          Belum ada resep yang perlu diperiksa.
        </p>
      )}
      {applyError ? (
        <p role="alert" className="text-sm text-destructive">
          {applyError}
        </p>
      ) : null}
      {risingIngredient ? (
        <div className="flex gap-3 rounded-2xl bg-surface p-4">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-caramel-700"
            strokeWidth={1.75}
          />
          <div className="grid gap-1">
            <h3 className="font-semibold">
              Harga {risingIngredient.name} naik
            </h3>
            <p className="text-sm text-muted-foreground">
              Sekarang {formatRupiah(risingIngredient.buyPrice)} per{' '}
              {risingIngredient.buyUnit}.
            </p>
            <Link
              href="/dashboard/bahan"
              className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline"
            >
              Lihat bahan
            </Link>
          </div>
        </div>
      ) : null}
      {!hasIngredients ? (
        <div className="grid gap-2 rounded-2xl bg-surface p-4">
          <h3 className="font-semibold">Belum ada bahan</h3>
          <p className="text-sm text-muted-foreground">
            Tambahkan bahan dari struk belanja agar HPP bisa dihitung.
          </p>
          <Link
            href="/dashboard/bahan"
            className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline"
          >
            Tambah bahan
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

function suggestedPrice(
  item: AttentionRecipe,
  roundingStep: number,
): number | null {
  if (item.error || item.hpp === null) return null;
  try {
    return suggestPrice(item.hpp, item.targetMarginBp, 0, roundingStep);
  } catch {
    return null;
  }
}
