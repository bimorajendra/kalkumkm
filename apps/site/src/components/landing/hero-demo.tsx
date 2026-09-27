'use client';

import { IsometricStack, ResultCard, SegmentedSlider } from '@takaran/ui';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { calculateBrownies } from '@/lib/brownies';

const marginStops = [10, 20, 30, 40, 50, 60, 70].map((percent) => ({
  value: percent * 100,
  label: `${percent}%`,
}));

/** Demo kalkulator di hero. Memakai mesin hitung yang sama dengan aplikasi. */
export function HeroDemo() {
  const [marginBp, setMarginBp] = useState(4000);
  const [eggPrice, setEggPrice] = useState(2000);
  const result = calculateBrownies(eggPrice, marginBp);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-xl bg-secondary p-5">
        <div className="grid gap-1.5">
          <label
            htmlFor="egg-price"
            className="flex justify-between text-sm font-medium"
          >
            Harga telur per butir
            <span>{formatRupiah(eggPrice)}</span>
          </label>
          <Input
            id="egg-price"
            inputMode="numeric"
            min={500}
            step={100}
            type="number"
            value={eggPrice}
            onChange={(event) => {
              const value = event.currentTarget.valueAsNumber;
              if (Number.isSafeInteger(value) && value >= 500 && value <= 20000)
                setEggPrice(value);
            }}
          />
        </div>
        <SegmentedSlider
          formatValueText={(value) => `${formatPercent(value)} target untung`}
          label="Target untung"
          onChange={setMarginBp}
          stops={marginStops}
          value={marginBp}
        />
      </div>
      <ResultCard
        label="Harga jual per potong"
        marginBp={result.marginBp}
        markupBp={result.markupBp}
        secondaryLabel="Untung per jam"
        secondaryValue={result.profitPerHour}
        tab={
          <Badge className="rounded-lg bg-[var(--peach-100)] text-[#9e4308]">
            Contoh hitungan
          </Badge>
        }
        value={result.price}
        visual={
          <IsometricStack layers={result.layers} profit={result.profit} />
        }
      />
    </div>
  );
}
