import { formatPercent } from '@takaran/ui/format';
import type { MonthlyMarginPoint } from '@/domain/margin-history';

const WIDTH = 560;
const HEIGHT = 180;
const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function monthLabel(month: string): string {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  return new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(
    new Date(Date.UTC(year, monthNumber - 1, 1)),
  );
}

/** Grafik garis margin bulanan. Hanya dipanggil kalau titik data >= 2. */
export function MarginTrendChart({ points }: { points: MonthlyMarginPoint[] }) {
  const values = points.map((point) => point.marginBp);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 500);
  const lowerBound = min - range * 0.2;
  const upperBound = max + range * 0.2;
  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const x = (index: number) =>
    points.length > 1
      ? PAD_X + (index / (points.length - 1)) * plotWidth
      : PAD_X + plotWidth / 2;
  const y = (marginBp: number) =>
    PAD_TOP +
    plotHeight -
    ((marginBp - lowerBound) / (upperBound - lowerBound)) * plotHeight;
  const linePath = points
    .map(
      (point, index) =>
        `${index ? 'L' : 'M'} ${x(index).toFixed(1)} ${y(point.marginBp).toFixed(1)}`,
    )
    .join(' ');
  const last = points[points.length - 1];
  const summary = points
    .map(
      (point) => `${monthLabel(point.month)} ${formatPercent(point.marginBp)}`,
    )
    .join(', ');

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Grafik garis rata-rata margin per bulan: ${summary}.`}
      className="h-auto w-full"
    >
      <line
        x1={PAD_X}
        x2={WIDTH - PAD_X}
        y1={HEIGHT - PAD_BOTTOM}
        y2={HEIGHT - PAD_BOTTOM}
        stroke="var(--line)"
        strokeWidth={1}
      />
      <path
        d={linePath}
        fill="none"
        stroke="var(--caramel-600)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((point, index) => (
        <circle
          key={point.month}
          cx={x(index)}
          cy={y(point.marginBp)}
          r={index === points.length - 1 ? 5 : 3}
          fill={
            index === points.length - 1
              ? 'var(--caramel-600)'
              : 'var(--surface)'
          }
          stroke="var(--caramel-600)"
          strokeWidth={2}
        />
      ))}
      {points.map((point, index) => (
        <text
          key={point.month}
          x={x(index)}
          y={HEIGHT - 8}
          textAnchor="middle"
          fontSize={11}
          fill="var(--ink-muted)"
        >
          {monthLabel(point.month)}
        </text>
      ))}
      {last ? (
        <text
          x={x(points.length - 1)}
          y={y(last.marginBp) - 10}
          textAnchor="end"
          fontSize={13}
          fontWeight={700}
          fill="var(--ink)"
        >
          {formatPercent(last.marginBp)}
        </text>
      ) : null}
    </svg>
  );
}
