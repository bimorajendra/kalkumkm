export function StepCard({
  step,
  title,
  text,
  children,
}: {
  step: number;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mk-lift flex flex-col gap-2.5 rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)] bg-[var(--mk-surface)] p-6 lg:p-7">
      <span className="w-fit rounded-full bg-[var(--mk-primary-tint)] px-2.5 py-1 text-xs font-bold text-[var(--mk-primary-ink)]">
        Langkah {step}
      </span>
      <h2 className="mt-2 text-[21px] font-bold tracking-[-0.02em]">{title}</h2>
      <p className="text-[15px] leading-[1.55] text-[var(--mk-text-3)]">
        {text}
      </p>
      <div className="mt-4 rounded-[var(--mk-radius-md)] border border-[var(--mk-divider)] bg-[var(--mk-surface-muted)] p-4">
        {children}
      </div>
    </div>
  );
}
