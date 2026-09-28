import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { calculateBrownies } from '@/lib/brownies';

const SEGMENT_COLORS: Record<string, string> = {
  ingredients: 'var(--mk-primary)',
  packaging: 'var(--mk-chart-2)',
  energy: 'var(--mk-chart-3)',
};

/** Rincian HPP contoh brownies pada margin acuan PRD (40%), dihitung dari
 * mesin hitung yang sama dengan aplikasi — bukan angka yang ditulis ulang. */
export function CostBreakdown() {
  const result = calculateBrownies(2000, 4000);
  const hpp = result.hpp.toNumber();
  const segments = result.layers.map((layer) => ({
    key: layer.key,
    label: layer.label,
    value: layer.value,
    percent:
      ((typeof layer.value === 'number'
        ? layer.value
        : layer.value.toNumber()) /
        hpp) *
      100,
  }));

  return (
    <div className="flex flex-col gap-5 rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)] p-7">
      <div
        aria-label={`Isi modal per potong: ${segments.map((s) => `${s.label} ${s.percent.toFixed(0)} persen`).join(', ')}`}
        className="flex h-3 gap-0.5"
        role="img"
      >
        {segments.map((segment, index) => (
          <div
            key={segment.key}
            style={{
              width: `${segment.percent}%`,
              background: SEGMENT_COLORS[segment.key],
              borderRadius:
                index === 0
                  ? '999px 2px 2px 999px'
                  : index === segments.length - 1
                    ? '2px 999px 999px 2px'
                    : '2px',
            }}
          />
        ))}
      </div>

      <dl className="grid text-[15px]">
        {segments.map((segment, index) => (
          <div
            className={`grid grid-cols-[1fr_auto_48px] items-center gap-3 py-3 ${index < segments.length - 1 ? 'border-b border-[var(--mk-divider)]' : ''}`}
            key={segment.key}
          >
            <dt className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: SEGMENT_COLORS[segment.key] }}
              />
              {segment.label}
            </dt>
            <dd className="font-semibold">{formatRupiah(segment.value)}</dd>
            <dd className="text-right text-[13px] text-[var(--mk-text-3)]">
              {segment.percent.toFixed(0)}%
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="grid gap-1 rounded-[var(--mk-radius-md)] bg-[var(--mk-surface-muted)] px-4 py-3.5">
          <span className="text-[13px] text-[var(--mk-text-3)]">
            Harga jual
          </span>
          <span className="text-xl font-bold tracking-[-0.02em]">
            {formatRupiah(result.price)}
          </span>
        </div>
        <div className="grid gap-1 rounded-[var(--mk-radius-md)] bg-[var(--mk-success-tint)] px-4 py-3.5">
          <span className="text-[13px] text-[var(--mk-success-ink)]">
            Untung
          </span>
          <span className="text-xl font-bold tracking-[-0.02em] text-[var(--mk-success-ink)]">
            {formatPercent(result.marginBp)}
          </span>
        </div>
        <div className="grid gap-1 rounded-[var(--mk-radius-md)] bg-[var(--mk-success-tint)] px-4 py-3.5">
          <span className="text-[13px] text-[var(--mk-success-ink)]">
            Untung per jam
          </span>
          <span className="text-xl font-bold tracking-[-0.02em] text-[var(--mk-success-ink)]">
            {formatRupiah(result.profitPerHour ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
