const rows = [
  {
    name: 'Bolu pandan',
    detail: 'per potong · Rp 4.000',
    before: '42,0%',
    after: '34,5%',
    suggested: 'Rp 4.500',
    note: 'jadi 41,8%',
    flagged: true,
  },
  {
    name: 'Lapis legit',
    detail: 'per loyang · Rp 350.000',
    before: '40,8%',
    after: '35,7%',
    suggested: 'Rp 375.500',
    note: 'jadi 40,0%',
    flagged: true,
  },
  {
    name: 'Brownies panggang',
    detail: 'per potong · Rp 5.000',
    before: '41,5%',
    after: '38,5%',
    suggested: 'Rp 5.500',
    note: 'jadi 44,1%',
    flagged: true,
  },
  {
    name: 'Nastar',
    detail: 'per toples · Rp 95.000',
    before: '46,0%',
    after: '44,1%',
    flagged: false,
  },
];

/** Tangkapan gaya "contoh tampilan aplikasi": data menu di sini contoh,
 * bukan resep pengguna nyata, dan tombol "Pakai" bukan kontrol sungguhan
 * (marketing tidak punya data resep untuk diubah). */
export function MarginAlertTable() {
  return (
    <figure
      aria-label="Contoh tampilan aplikasi, bukan data resep sungguhan"
      className="m-0 overflow-hidden rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)] shadow-[var(--mk-shadow-float)]"
    >
      <div className="flex items-center justify-between px-6 py-4.5 text-sm">
        <span>
          Harga <strong>telur</strong> diperbarui · Rp 2.000 → Rp 2.600
        </span>
        <span className="text-[var(--mk-text-3)]">Baru saja</span>
      </div>
      <div className="flex items-center gap-2.5 bg-[var(--mk-primary-tint)] px-6 py-3 text-sm font-semibold text-[var(--mk-primary-ink)]">
        <svg
          aria-hidden="true"
          fill="none"
          height="18"
          viewBox="0 0 20 20"
          width="18"
        >
          <path
            d="M10 2.5 1.8 17h16.4L10 2.5Z"
            stroke="var(--mk-primary-ink)"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path
            d="M10 8v4M10 14.5v.3"
            stroke="var(--mk-primary-ink)"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
        </svg>
        3 menu untungnya di bawah target 40%
      </div>
      <div
        aria-label="Geser ke samping bila terpotong"
        className="overflow-x-auto"
        role="region"
        tabIndex={0}
      >
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_84px] gap-4 bg-[var(--mk-surface-muted)] px-6 py-3 text-xs font-semibold text-[var(--mk-text-3)]">
            <span>Menu</span>
            <span>Untung</span>
            <span>Saran harga</span>
            <span />
          </div>
          {rows.map((row, index) => (
            <div
              className={`grid grid-cols-[1.5fr_1fr_1fr_84px] items-center gap-4 px-6 py-4 ${
                index < rows.length - 1
                  ? 'border-b border-[var(--mk-divider)]'
                  : ''
              } ${!row.flagged ? 'bg-[#F6FBF8]' : ''}`}
              key={row.name}
            >
              <div className="grid gap-0.5">
                <span className="text-[15px] font-semibold">{row.name}</span>
                <span className="text-[13px] text-[var(--mk-text-3)]">
                  {row.detail}
                </span>
              </div>
              {row.flagged ? (
                <>
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[13px] text-[var(--mk-text-3)] line-through">
                      {row.before}
                    </span>
                    <span className="text-base font-bold text-[var(--mk-danger-ink)]">
                      {row.after}
                    </span>
                  </span>
                  <div className="grid gap-0.5">
                    <span className="text-[15px] font-semibold">
                      {row.suggested}
                    </span>
                    <span className="text-xs text-[var(--mk-success-ink)]">
                      {row.note}
                    </span>
                  </div>
                  <button
                    aria-label={`Pakai ${row.suggested} untuk ${row.name}`}
                    className="h-11 rounded-[var(--mk-radius-sm)] border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] px-4 text-sm font-semibold"
                    disabled
                    type="button"
                  >
                    Pakai
                  </button>
                </>
              ) : (
                <>
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[13px] text-[var(--mk-text-3)] line-through">
                      {row.before}
                    </span>
                    <span className="text-base font-bold text-[var(--mk-success-ink)]">
                      {row.after}
                    </span>
                  </span>
                  <span className="w-fit rounded-full bg-[var(--mk-success-tint)] px-2.5 py-1 text-xs font-semibold text-[var(--mk-success-ink)]">
                    Masih aman
                  </span>
                  <span />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
