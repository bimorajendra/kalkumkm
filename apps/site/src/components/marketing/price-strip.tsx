import Link from 'next/link';

export function PriceStrip() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)] bg-[var(--mk-surface)] p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-7">
      <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
        <span className="text-base">
          <strong>Gratis</strong>{' '}
          <span className="text-[var(--mk-text-2)]">untuk 3 resep</span>
        </span>
        <span
          aria-hidden="true"
          className="hidden h-5 w-px self-center bg-[var(--mk-border)] sm:block"
        />
        <span className="text-base">
          <strong>Pro segera hadir</strong>{' '}
          <span className="text-[var(--mk-text-2)]">
            pembelian belum dibuka
          </span>
        </span>
      </div>
      <Link
        className="text-[15px] font-semibold text-[var(--mk-primary-ink)]"
        href="/harga"
      >
        Lihat harga →
      </Link>
    </div>
  );
}
