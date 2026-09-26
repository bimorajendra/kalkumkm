import { profitPerPortion, type RecipeResult } from '@takaran/calc';
import { type IsometricLayer, IsometricStack, ResultCard } from '@takaran/ui';
import { useState } from 'react';
import { pricingCopy } from '../copy';

interface CalculatorResultProps {
  price: number;
  hpp: RecipeResult['hpp'];
  marginBp: number;
  markupBp: number;
  targetMarginBp: number;
  hourlyProfit: RecipeResult['hpp'] | null;
  laborMinutes: number;
  laborRatePerHour: number | null;
  layers: IsometricLayer[];
  onSavePrice: () => Promise<void>;
  compact?: boolean;
  onDetails?: () => void;
}

export function CalculatorResult({
  compact,
  hpp,
  hourlyProfit,
  laborMinutes,
  laborRatePerHour,
  layers,
  marginBp,
  markupBp,
  onDetails,
  onSavePrice,
  price,
  targetMarginBp,
}: CalculatorResultProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const belowTarget = marginBp < targetMarginBp;
  const profit = profitPerPortion(price, hpp, 0);
  const duration = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(laborMinutes / 60);
  const secondary = hpp.lte(0) ? null : hourlyProfit;
  const actions = (
    <button
      className="button button-primary"
      onClick={async () => {
        try {
          await onSavePrice();
          setSaved(true);
          setError('');
          window.setTimeout(() => setSaved(false), 2400);
        } catch {
          setError(pricingCopy.saveFailed);
        }
      }}
      type="button"
    >
      {saved ? pricingCopy.saved : 'Simpan harga ini'}
    </button>
  );
  const card = (
    <ResultCard
      actions={actions}
      label="harga jual per potong"
      marginBp={marginBp}
      markupBp={markupBp}
      onDetails={onDetails}
      secondaryLabel={`untungmu setelah ${duration} jam kerja`}
      secondaryValue={secondary}
      tab={
        <span>
          {belowTarget
            ? `Di bawah target ${new Intl.NumberFormat('id-ID').format(targetMarginBp / 100)}%`
            : 'Harga saran'}
        </span>
      }
      value={price}
      visual={<IsometricStack layers={layers} profit={profit} />}
      compact={compact}
    />
  );
  return (
    <>
      {card}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {!compact && hpp.lte(0) ? (
        <p className="price-status">{pricingCopy.emptyCost}</p>
      ) : null}
      {!compact && secondary !== null && laborRatePerHour === null ? (
        <p className="muted-note">
          Ini upah yang sebenarnya kamu terima per jam.
        </p>
      ) : null}
      {!compact && laborMinutes === 0 ? (
        <p className="muted-note">
          Isi waktu kerja untuk melihat untung per jam.
        </p>
      ) : null}
    </>
  );
}
