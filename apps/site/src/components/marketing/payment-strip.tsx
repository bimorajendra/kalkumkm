const methods = ['QRIS', 'Virtual account', 'E-wallet'];

export function PaymentStrip() {
  return (
    <div className="mx-auto flex w-full max-w-[1063px] flex-col items-start gap-4 rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)] bg-[var(--mk-surface)] px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mr-2 text-[15px] font-semibold">Cara bayar</span>
        {methods.map((method) => (
          <span
            className="rounded-[var(--mk-radius-sm)] border border-[var(--mk-border)] bg-[var(--mk-bg)] px-3 py-1.5 text-[13px] font-semibold"
            key={method}
          >
            {method}
          </span>
        ))}
      </div>
      <span className="flex items-center gap-2 text-sm text-[var(--mk-text-2)]">
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
        >
          <rect
            height="7"
            rx="1.5"
            stroke="var(--mk-text-2)"
            strokeWidth="1.4"
            width="10"
            x="3"
            y="7"
          />
          <path
            d="M5 7V5a3 3 0 0 1 6 0v2"
            stroke="var(--mk-text-2)"
            strokeWidth="1.4"
          />
        </svg>
        Diproses Mayar. Pro aktif otomatis setelah bayar.
      </span>
    </div>
  );
}
