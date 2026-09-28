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
const PROFIT_COLOR = 'var(--caramel-500)';

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

/* Geometri proyeksi isometrik: tiap lapisan digambar sebagai balok pipih
   (sisi kiri, kanan, atas), sudut tajam, ditumpuk dari bawah (bahan) ke atas
   (untung), sesuai DESIGN.md §5 "sudut tajam di isometrik, membulat di UI". */
const CX = 65;
const HALF_WIDTH = 46;
const HALF_DEPTH = 23;
const STACK_HEIGHT = 150;
const BASE_Y = 170;
const VIEW_WIDTH = 132;
const VIEW_HEIGHT = 194;

function polygon(points: Array<[number, number]>): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function layerFaces(top: number, bottom: number) {
  const cx = CX;
  const a = HALF_WIDTH;
  const b = HALF_DEPTH;
  return {
    left: polygon([
      [cx - a, top],
      [cx, top + b],
      [cx, bottom + b],
      [cx - a, bottom],
    ]),
    right: polygon([
      [cx, top + b],
      [cx + a, top],
      [cx + a, bottom],
      [cx, bottom + b],
    ]),
    top: polygon([
      [cx, top - b],
      [cx + a, top],
      [cx, top + b],
      [cx - a, top],
    ]),
  };
}

/**
 * Komposisi per porsi: balok isometrik proporsional (tinggi tiap lapisan
 * sesuai nilai), ditumpuk dari bahan (bawah) ke untung (atas), dengan
 * legenda teks biasa di kanan (baris tinggi tetap, dibaca atas ke bawah
 * mengikuti urutan visual tumpukan).
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
    STACK_HEIGHT,
    8,
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

  let y = BASE_Y;
  const blocks = visibleLayers.map((layer, index) => {
    const height = heights[index] ?? 8;
    const bottom = y;
    const top = y - height;
    y = top;
    const color =
      layer.key === 'profit'
        ? PROFIT_COLOR
        : layerColors[index % layerColors.length];
    return { layer, color, faces: layerFaces(top, bottom) };
  });

  return (
    <div className="takaran-isometric-stack">
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="takaran-isometric-stack__art"
      >
        <ellipse
          className="takaran-isometric-stack__shadow"
          cx={CX}
          cy={BASE_Y + HALF_DEPTH + 5}
          rx={HALF_WIDTH + 6}
          ry={7}
        />
        {blocks.map(({ layer, color, faces }) => (
          <g key={layer.key}>
            <polygon
              className="takaran-isometric-stack__face-left"
              points={faces.left}
              fill={color}
            />
            <polygon
              className="takaran-isometric-stack__face-right"
              points={faces.right}
              fill={color}
            />
            <polygon
              className="takaran-isometric-stack__face-top"
              points={faces.top}
              fill={color}
            />
          </g>
        ))}
      </svg>
      <ul
        aria-label={`Komposisi per porsi: ${summary}. Total komponen ${formatRupiah(total)}.`}
        className="takaran-isometric-stack__legend"
      >
        {blocks
          .slice()
          .reverse()
          .map(({ layer, color }) => (
            <li key={layer.key}>
              <span
                aria-hidden="true"
                className="takaran-isometric-stack__dot"
                style={{ background: color }}
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
