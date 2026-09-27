'use client';

import { actualMarginBp, type RecipeResult } from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { pricingCopy } from './copy';

export function CurrentPriceInput({
  currentPrice,
  hpp,
  onSave,
  targetMarginBp,
}: {
  hpp: RecipeResult['hpp'];
  targetMarginBp: number;
  currentPrice: number | null;
  onSave: (price: number) => Promise<void>;
}) {
  const [raw, setRaw] = useState(
    currentPrice === null ? '' : String(currentPrice),
  );
  const [error, setError] = useState('');
  const price =
    /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : null;
  const margin =
    price !== null && price > 0 ? actualMarginBp(price, hpp, 0) : null;

  async function save() {
    if (price === null) {
      setError('Masukkan harga dalam rupiah bulat.');
      return;
    }
    try {
      await onSave(price);
      setError('');
    } catch {
      setError(pricingCopy.saveFailed);
    }
  }

  const status =
    margin !== null
      ? {
          loss: margin < 0,
          below: margin < targetMarginBp,
          text: `Margin aktual ${formatPercent(margin)}. ${
            margin < 0
              ? `Rugi ${formatRupiah(hpp.minus(price ?? 0))} per potong.`
              : margin < targetMarginBp
                ? `Di bawah target ${formatPercent(targetMarginBp)}.`
                : 'Di atas target.'
          }`,
        }
      : price === 0 && hpp.gt(0)
        ? {
            loss: true,
            below: true,
            text: `Rugi ${formatRupiah(hpp.toNumber())} per potong.`,
          }
        : null;

  return (
    <section className="grid gap-2">
      <label htmlFor="current-price-input" className="text-sm font-medium">
        Harga yang kamu pakai sekarang
      </label>
      <div className="flex items-center gap-2">
        <span aria-hidden="true">Rp</span>
        <Input
          id="current-price-input"
          type="text"
          inputMode="numeric"
          className="max-w-48"
          value={raw}
          onBlur={() => {
            if (price !== null) void save();
          }}
          onChange={(event) =>
            setRaw(event.currentTarget.value.replace(/\D/g, ''))
          }
        />
      </div>
      {status ? (
        <p
          aria-live="polite"
          className={`text-sm font-medium ${
            status.loss || status.below ? 'text-destructive' : 'text-success'
          }`}
        >
          {status.text}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
