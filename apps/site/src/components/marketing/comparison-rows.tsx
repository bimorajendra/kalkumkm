import Link from 'next/link';

const rows = [
  {
    href: '/cara-hitung',
    without: 'Harga ikut penjual lain',
    with: 'Harga dihitung dari modalmu sendiri',
  },
  {
    href: '/fitur#naik',
    without: 'Bahan naik, harga jual tetap sama',
    with: 'Menu yang untungnya turun langsung ditandai',
  },
  {
    href: '/fitur#custom',
    without: 'Harga kue custom ditebak',
    with: 'Harga custom dihitung dari tiap tambahan',
  },
];

function XIconSmall() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 shrink-0"
      fill="none"
      height="18"
      viewBox="0 0 20 20"
      width="18"
    >
      <circle cx="10" cy="10" fill="var(--mk-sand)" r="9" />
      <path
        d="m7 7 6 6M13 7l-6 6"
        stroke="var(--mk-text-4)"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CheckIconSmall() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 shrink-0"
      fill="none"
      height="18"
      viewBox="0 0 20 20"
      width="18"
    >
      <circle cx="10" cy="10" fill="var(--mk-success-tint)" r="9" />
      <path
        d="m6 10.2 2.6 2.6L14 7.5"
        stroke="var(--mk-success)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ComparisonRows() {
  return (
    <div className="overflow-hidden rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)]">
      <div className="grid grid-cols-[1fr_1fr_40px] gap-6 bg-[var(--mk-surface-muted)] px-6 py-3.5 text-[13px] font-semibold text-[var(--mk-text-2)]">
        <span>Tanpa hitungan</span>
        <span>Dengan Takaran</span>
        <span />
      </div>
      {rows.map((row, index) => (
        <Link
          className={`group grid grid-cols-[1fr_1fr_40px] items-center gap-6 px-6 py-6 transition-colors hover:bg-[var(--mk-surface-muted)] ${index > 0 ? 'border-t border-[var(--mk-divider)]' : ''}`}
          href={row.href}
          key={row.href}
        >
          <span className="flex gap-2.5 text-base text-[var(--mk-text-2)]">
            <XIconSmall />
            {row.without}
          </span>
          <span className="flex gap-2.5 text-base font-semibold">
            <CheckIconSmall />
            {row.with}
          </span>
          <span
            aria-hidden="true"
            className="text-right text-lg text-[var(--mk-text-3)] group-hover:text-[var(--mk-primary-ink)]"
          >
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
