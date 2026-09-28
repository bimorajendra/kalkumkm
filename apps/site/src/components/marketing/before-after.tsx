import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { calculateBrownies } from '@/lib/brownies';

/** Contoh "kemarin vs hari ini" saat harga telur naik 30%, dihitung dari
 * mesin hitung yang sama dengan aplikasi (harga jual tetap Rp 5.000). */
export function BeforeAfter() {
  const before = calculateBrownies(2000, 4000, 5000);
  const after = calculateBrownies(2600, 4000, 5000);
  const hppBefore = before.hpp.toNumber();
  const hppAfter = after.hpp.toNumber();
  const perPortionLoss = hppAfter - hppBefore;
  const perMonthLoss = perPortionLoss * 16 * 40;

  return (
    <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_48px_1fr_auto]">
      <div className="rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)] bg-[var(--mk-surface)] p-6 lg:p-7">
        <h3 className="mb-2 text-sm font-semibold text-[var(--mk-text-3)]">
          Kemarin
        </h3>
        <dl className="grid">
          <Row label="Telur, per butir" value="Rp 2.000" />
          <Row label="Modal per potong" value={formatRupiah(hppBefore)} />
          <Row
            border={false}
            label="Untung di harga Rp 5.000"
            value={
              <span className="font-bold text-[var(--mk-success-ink)]">
                {formatPercent(before.marginBp)}
              </span>
            }
          />
        </dl>
      </div>

      <span
        aria-hidden="true"
        className="mx-auto flex size-11 items-center justify-center rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] text-lg text-[var(--mk-primary-ink)] lg:size-12"
      >
        →
      </span>

      <div className="rounded-[var(--mk-radius-lg)] border-[1.5px] border-[var(--mk-primary)] bg-[var(--mk-surface)] p-6 shadow-[var(--mk-shadow-highlight)] lg:p-7">
        <h3 className="mb-2 text-sm font-semibold text-[var(--mk-primary-ink)]">
          Hari ini
        </h3>
        <dl className="grid">
          <Row
            label="Telur, per butir"
            value={
              <>
                Rp 2.600{' '}
                <span className="text-[13px] text-[var(--mk-primary-hover)]">
                  +30%
                </span>
              </>
            }
          />
          <Row
            label="Modal per potong"
            value={
              <>
                {formatRupiah(hppAfter)}{' '}
                <span className="text-[13px] text-[var(--mk-primary-hover)]">
                  +{formatRupiah(perPortionLoss)}
                </span>
              </>
            }
          />
          <Row
            border={false}
            label="Untung di harga Rp 5.000"
            value={
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--mk-danger-tint)] px-2 py-0.5 text-xs font-semibold text-[var(--mk-danger-ink)]">
                  di bawah target
                </span>
                <span className="font-bold text-[var(--mk-danger-ink)]">
                  {formatPercent(after.marginBp)}
                </span>
              </span>
            }
          />
        </dl>
      </div>

      <div className="grid gap-2 pl-0 lg:pl-3">
        <span className="text-[32px] leading-none font-bold tracking-[-0.04em] text-[var(--mk-danger-ink)] lg:text-[44px]">
          −{formatRupiah(perMonthLoss)}
        </span>
        <span className="max-w-[220px] text-[15px] leading-[1.55] text-[var(--mk-text-2)]">
          per bulan, kalau kamu membuat 40 loyang. Dari selisih{' '}
          {formatRupiah(perPortionLoss)} per potong.
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  border = true,
}: {
  label: string;
  value: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between py-3.5 ${border ? 'border-b border-[var(--mk-divider)]' : ''}`}
    >
      <dt className="text-[15px] text-[var(--mk-text-2)]">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
