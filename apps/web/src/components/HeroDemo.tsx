import {
  Chip,
  formatPercent,
  formatRupiah,
  IsometricStack,
  ResultCard,
  SegmentedSlider,
} from '@takaran/ui';
import { useState } from 'react';
import { calculateBrownies } from '../lib/brownies';

const marginStops = [10, 20, 30, 40, 50, 60, 70].map((percent) => ({
  value: percent * 100,
  label: `${percent}%`,
}));

export default function HeroDemo() {
  const [marginBp, setMarginBp] = useState(4000);
  const [eggPrice, setEggPrice] = useState(2000);
  const result = calculateBrownies(eggPrice, marginBp);

  return (
    <div className="hero-demo">
      <div className="hero-demo__control">
        <label className="hero-demo__egg-label" htmlFor="egg-price">
          Harga telur per butir
          <span>{formatRupiah(eggPrice)}</span>
        </label>
        <input
          id="egg-price"
          aria-label="Harga telur per butir"
          inputMode="numeric"
          min={500}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber;
            if (Number.isSafeInteger(value) && value >= 500 && value <= 20000)
              setEggPrice(value);
          }}
          step={100}
          type="number"
          value={eggPrice}
        />
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
        tab={<Chip>Contoh hitungan</Chip>}
        value={result.price}
        visual={
          <IsometricStack layers={result.layers} profit={result.profit} />
        }
      />
    </div>
  );
}
