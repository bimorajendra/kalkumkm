import { actualMarginBp, type RecipeResult } from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui';
import { useState } from 'react';
import { pricingCopy } from '../copy';

interface CurrentPriceInputProps {
  hpp: RecipeResult['hpp'];
  targetMarginBp: number;
  currentPrice: number | null;
  onSave: (price: number) => Promise<void>;
}

export function CurrentPriceInput({
  currentPrice,
  hpp,
  onSave,
  targetMarginBp,
}: CurrentPriceInputProps) {
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

  return (
    <section className="current-price">
      <label htmlFor="current-price-input">
        Harga yang kamu pakai sekarang
      </label>
      <div className="current-price__control">
        <span>Rp</span>
        <input
          id="current-price-input"
          inputMode="numeric"
          onBlur={() => {
            if (price !== null) void save();
          }}
          onChange={(event) =>
            setRaw(event.currentTarget.value.replace(/\D/g, ''))
          }
          type="text"
          value={raw}
        />
      </div>
      {margin !== null ? (
        <p
          aria-live="polite"
          className={
            margin < 0
              ? 'price-status is-loss'
              : margin < targetMarginBp
                ? 'price-status is-below'
                : 'price-status is-above'
          }
        >
          Margin aktual {formatPercent(margin)}.{' '}
          {margin < 0
            ? `Rugi ${formatRupiah(hpp.minus(price ?? 0))} per potong.`
            : margin < targetMarginBp
              ? `Di bawah target ${formatPercent(targetMarginBp)}.`
              : 'Di atas target.'}
        </p>
      ) : price === 0 && hpp.gt(0) ? (
        <p aria-live="polite" className="price-status is-loss">
          Rugi {formatRupiah(hpp.toNumber())} per potong.
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
