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
  const baseY = 176;
  const left = 10;
  const width = 150;
  const depth = 18;
  let consumed = 0;

  return (
    <svg
      aria-label={`Komposisi per porsi: ${summary}. Total komponen ${formatRupiah(total)}.`}
      className="takaran-isometric-stack"
      role="img"
      viewBox="0 0 420 220"
    >
      {visibleLayers.map((layer, index) => {
        const height = heights[index] ?? 6;
        const top = baseY - consumed - height;
        consumed += height;
        const center = left + width / 2;
        const right = left + width;
        const color =
          layer.key === 'profit'
            ? 'var(--caramel-500)'
            : layerColors[index % layerColors.length];
        const textY = top + height / 2 + depth / 2;
        return (
          <g key={layer.key}>
            <polygon
              fill={color}
              points={`${left},${top} ${center},${top - depth / 2} ${right},${top} ${center},${top + depth / 2}`}
            />
            <polygon
              fill="color-mix(in srgb, var(--ink) 12%, transparent)"
              points={`${left},${top} ${center},${top + depth / 2} ${center},${top + depth / 2 + height} ${left},${top + height}`}
            />
            <polygon
              fill="color-mix(in srgb, var(--ink) 22%, transparent)"
              points={`${right},${top} ${center},${top + depth / 2} ${center},${top + depth / 2 + height} ${right},${top + height}`}
            />
            <text className="takaran-isometric-stack__label" x="190" y={textY}>
              {layer.label}
            </text>
            <text
              className="takaran-isometric-stack__value"
              x="190"
              y={textY + 15}
            >
              {formatRupiah(layer.value)}
            </text>
          </g>
        );
      })}
      {profitValue.lt(0) ? (
        <g className="takaran-isometric-stack__loss">
          <line x1={left} x2={left + width} y1={baseY + 12} y2={baseY + 12} />
          <text x={left + width + 16} y={baseY + 16}>
            Rugi {formatRupiah(profitValue.abs())} per porsi
          </text>
        </g>
      ) : null}
    </svg>
  );
}
