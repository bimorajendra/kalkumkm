const formulas = [
  {
    label: 'Modal per potong',
    text: '(bahan + gas) ÷ jumlah potong + kemasan',
  },
  {
    label: 'Harga jual',
    text: 'modal ÷ (1 − target untung), dibulatkan ke atas',
  },
  {
    label: 'Untung per jam',
    text: 'untung per potong × jumlah potong ÷ jam kerja',
  },
];

export function FormulaList() {
  return (
    <div className="grid gap-3">
      {formulas.map((formula) => (
        <div
          className="grid grid-cols-1 gap-2 rounded-[var(--mk-radius-md)] border border-[var(--mk-border)] bg-[var(--mk-surface)] px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-5"
          key={formula.label}
        >
          <span className="text-[15px] font-bold">{formula.label}</span>
          <span className="text-[15px] text-[var(--mk-text-2)]">
            {formula.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-[var(--mk-radius-md)] bg-[var(--mk-primary-tint)] px-6 py-4.5">
      <svg
        aria-hidden="true"
        className="mt-0.5 shrink-0"
        fill="none"
        height="20"
        viewBox="0 0 20 20"
        width="20"
      >
        <circle
          cx="10"
          cy="10"
          r="8.5"
          stroke="var(--mk-primary-ink)"
          strokeWidth="1.5"
        />
        <path
          d="M10 9v5M10 6.2v.3"
          stroke="var(--mk-primary-ink)"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
      <span className="text-[15px] leading-[1.6] text-[var(--mk-primary-ink)]">
        {children}
      </span>
    </div>
  );
}
