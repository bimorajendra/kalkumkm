'use client';

import { profitPerPortion, type RecipeResult } from '@takaran/calc';
import { type IsometricLayer, IsometricStack, ResultCard } from '@takaran/ui';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { pricingCopy } from './copy';

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
  channelName = 'Langsung',
  commissionBp = 0,
  canSavePrice = true,
  recipeId,
}: {
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
  channelName?: string;
  commissionBp?: number;
  canSavePrice?: boolean;
  recipeId?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const belowTarget = marginBp < targetMarginBp;
  const profit = profitPerPortion(price, hpp, commissionBp);
  const duration = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(laborMinutes / 60);
  const secondary = hpp.lte(0) ? null : hourlyProfit;

  const actions = (
    <>
      {canSavePrice ? (
        <Button
          type="button"
          className="bg-[#2b1d14] text-white hover:bg-[#2b1d14]/90"
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
        >
          {saved ? pricingCopy.saved : 'Simpan harga ini'}
        </Button>
      ) : null}
      {recipeId ? (
        <Button
          asChild
          variant="outline"
          className="rounded-lg border-transparent bg-white text-[#2b1d14] hover:bg-white/90 hover:text-[#2b1d14]"
        >
          <Link href={`/bagikan?recipe=${encodeURIComponent(recipeId)}`}>
            Buat gambar daftar harga
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
    </>
  );

  return (
    <>
      <ResultCard
        actions={canSavePrice || recipeId ? actions : undefined}
        label={`harga jual per potong di ${channelName}`}
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
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!compact && hpp.lte(0) ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {pricingCopy.emptyCost}
        </p>
      ) : null}
      {!compact && secondary !== null && laborRatePerHour === null ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Ini upah yang sebenarnya kamu terima per jam.
        </p>
      ) : null}
      {!compact && laborMinutes === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Isi waktu kerja untuk melihat untung per jam.
        </p>
      ) : null}
    </>
  );
}
