/// <reference path="./big-js.d.ts" />
import Big from 'big.js';
import { formatRupiah } from './format';

export interface IsometricLayer {
  key: string;
  label: string;
  value: number | Big;
}

const layerColors = [
  'var(--tan-100)',
  'var(--tan-200)',
  'var(--tan-300)',
  'var(--tan-400)',
];

function asBig(value: number | Big): Big {
  return value instanceof Big ? value : new Big(String(value));
}

export function calculateLayerHeights(
  values: Array<number | Big>,
  totalHeight = 144,
  minimumHeight = 6,
): number[] {
  if (
    values.length === 0 ||
    !Number.isFinite(totalHeight) ||
    !Number.isFinite(minimumHeight) ||
    totalHeight < values.length * minimumHeight ||
    minimumHeight <= 0
  ) {
    throw new RangeError('Tinggi tumpukan tidak sesuai dengan jumlah lapisan.');
  }
  const amounts = values.map(asBig);
  if (amounts.some((amount) => amount.lt(0))) {
    throw new RangeError('Nilai lapisan biaya tidak boleh negatif.');
  }
  const total = amounts.reduce((sum, amount) => sum.plus(amount), new Big(0));
  const remainingHeight = totalHeight - values.length * minimumHeight;
  return amounts.map((amount) => {
    const share = total.gt(0)
      ? amount.div(total).times(remainingHeight).toNumber()
      : remainingHeight / values.length;
    return minimumHeight + share;
  });
}

export interface IsometricStackProps {
  layers: IsometricLayer[];
  profit: number | Big;
}

/**
 * Komposisi per porsi: batang proporsional (tinggi tiap segmen sesuai nilai)
 * di kiri, legenda teks biasa (baris tinggi tetap) di kanan. Legenda dipisah
 * dari geometri batang karena nilai antar lapisan (misalnya energi vs bahan)
 * sering jauh berbeda; menaruh teks di dalam segmen setipis itu membuatnya
 * bertumpuk.
 */
export function IsometricStack({ layers, profit }: IsometricStackProps) {
  const profitValue = asBig(profit);
  const visibleLayers: IsometricLayer[] = [
    ...layers,
    ...(profitValue.gte(0)
      ? [{ key: 'profit', label: 'Untung', value: profitValue }]
      : []),
  ];
  const heights = calculateLayerHeights(
    visibleLayers.map((layer) => layer.value),
  );
  const total = visibleLayers.reduce(
    (sum, layer) => sum.plus(asBig(layer.value)),
    new Big(0),
  );
  const summary = [
    ...layers.map((layer) => `${layer.label} ${formatRupiah(layer.value)}`),
    profitValue.lt(0)
      ? `Rugi ${formatRupiah(profitValue.abs())} per porsi`
      : `Untung ${formatRupiah(profitValue)}`,
  ].join(', ');

  return (
    <div className="takaran-isometric-stack">
      <div aria-hidden="true" className="takaran-isometric-stack__art">
        {visibleLayers.map((layer, index) => (
          <div
            className="takaran-isometric-stack__segment"
            key={layer.key}
            style={{
              background:
                layer.key === 'profit'
                  ? 'var(--caramel-500)'
                  : layerColors[index % layerColors.length],
              height: heights[index] ?? 6,
            }}
          />
        ))}
      </div>
      <ul
        aria-label={`Komposisi per porsi: ${summary}. Total komponen ${formatRupiah(total)}.`}
        className="takaran-isometric-stack__legend"
      >
        {visibleLayers.map((layer, index) => (
          <li key={layer.key}>
            <span
              aria-hidden="true"
              className="takaran-isometric-stack__dot"
              style={{
                background:
                  layer.key === 'profit'
                    ? 'var(--caramel-500)'
                    : layerColors[index % layerColors.length],
              }}
            />
            <span className="takaran-isometric-stack__label">
              {layer.label}
            </span>
            <span className="takaran-isometric-stack__value">
              {formatRupiah(layer.value)}
            </span>
          </li>
        ))}
        {profitValue.lt(0) ? (
          <li className="takaran-isometric-stack__loss">
            <span className="takaran-isometric-stack__label">Rugi</span>
            <span className="takaran-isometric-stack__value">
              {formatRupiah(profitValue.abs())} per porsi
            </span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
