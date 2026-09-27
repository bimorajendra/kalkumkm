'use client';

import { actualMarginBp, CalcError, suggestPrice } from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { TriangleAlert, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  errorMessage,
  useRecipeResults,
  useRun,
} from '@/components/takaran/data-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RecipeRow } from '@/domain/types';
import { marginAlarmCopy } from './copy';

interface Affected {
  recipe: RecipeRow;
  marginBp: number;
  suggestedPrice: number;
}

/** Banner alarm margin. Muncul setelah harga bahan naik dan ada menu di bawah target. */
export function MarginAlarm() {
  const { snapshot, results } = useRecipeResults();
  const run = useRun();
  const alarm = snapshot.settings.marginAlarm;
  const roundingStep = snapshot.settings.roundingStep;
  const [listOpen, setListOpen] = useState(false);
  const [saveError, setSaveError] = useState('');

  const affected = useMemo<Affected[]>(() => {
    if (!alarm) return [];
    return alarm.recipeIds.flatMap((id) => {
      const recipe = snapshot.recipes.find((item) => item.id === id);
      const result = results.get(id);
      if (
        !recipe ||
        recipe.currentPrice === null ||
        !result ||
        result instanceof CalcError
      )
        return [];
      try {
        const marginBp = actualMarginBp(recipe.currentPrice, result.hpp, 0);
        if (marginBp >= recipe.targetMarginBp) return [];
        return [
          {
            recipe,
            marginBp,
            suggestedPrice: suggestPrice(
              result.hpp,
              recipe.targetMarginBp,
              0,
              roundingStep,
            ),
          },
        ];
      } catch {
        return [];
      }
    });
  }, [alarm, snapshot.recipes, results, roundingStep]);

  if (!alarm || alarm.dismissed || affected.length === 0) return null;

  async function apply(item: Affected) {
    setSaveError('');
    try {
      await run({
        type: 'alarm.applyPrice',
        recipeId: item.recipe.id,
        price: item.suggestedPrice,
      });
    } catch (error) {
      setSaveError(errorMessage(error, 'Harga belum tersimpan. Coba lagi.'));
    }
  }

  async function dismiss() {
    try {
      await run({ type: 'alarm.dismiss' });
    } catch {
      setSaveError('Pemberitahuan belum bisa ditutup. Coba lagi.');
    }
  }

  return (
    <section aria-label="Pemberitahuan margin" className="mb-4">
      <div className="flex items-start gap-3 rounded-xl bg-[var(--peach-100)] p-4 text-[#2b1d14]">
        <TriangleAlert
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-[#9e4308]"
          strokeWidth={1.75}
        />
        <p className="flex-1">
          {affected.length}{' '}
          {affected.length === 1
            ? marginAlarmCopy.singular
            : marginAlarmCopy.plural}{' '}
          <button
            type="button"
            className="min-h-11 font-semibold text-[#9e4308] underline underline-offset-4"
            onClick={() => setListOpen(true)}
          >
            Lihat menu
          </button>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={marginAlarmCopy.dismiss}
          className="-my-2 -mr-2 hover:bg-black/5"
          onClick={() => void dismiss()}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      {saveError && !listOpen ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {saveError}
        </p>
      ) : null}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-semibold">
              {marginAlarmCopy.listTitle}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Menu yang untungnya turun karena harga bahan naik.
            </DialogDescription>
          </DialogHeader>
          {saveError ? (
            <p role="alert" className="text-sm text-destructive">
              {saveError}
            </p>
          ) : null}
          <ul className="divide-y divide-border">
            {affected.map((item) => (
              <li key={item.recipe.id} className="grid gap-1 py-3">
                <Link
                  href={`/resep/${item.recipe.id}`}
                  className="font-semibold underline underline-offset-4"
                >
                  {item.recipe.name}
                </Link>
                <span className="text-sm text-muted-foreground">
                  Harga sekarang {formatRupiah(item.recipe.currentPrice ?? 0)} ·
                  margin {formatPercent(item.marginBp)} · harga saran{' '}
                  {formatRupiah(item.suggestedPrice)}
                </span>
                <Button
                  type="button"
                  className="mt-1 w-fit"
                  onClick={() => void apply(item)}
                >
                  {marginAlarmCopy.priceActionLabel(
                    formatRupiah(item.suggestedPrice),
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
