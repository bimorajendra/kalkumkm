import Link from 'next/link';
import { CheckList } from './check-list';

export function PlanCard({
  name,
  price,
  originalPrice,
  badge,
  description,
  features,
  ctaHref,
  ctaLabel,
  highlighted = false,
}: {
  name: string;
  price: string;
  originalPrice?: string;
  badge?: string;
  description: string;
  features: React.ReactNode[];
  ctaHref: string;
  ctaLabel: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-[var(--mk-radius-xl)] bg-[var(--mk-surface)] p-7 sm:p-9 ${
        highlighted
          ? 'border-[1.5px] border-[var(--mk-primary)] shadow-[var(--mk-shadow-highlight)]'
          : 'border border-[var(--mk-border)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{name}</h2>
        {badge ? (
          <span className="rounded-full bg-[var(--mk-primary-tint)] px-2.5 py-1 text-xs font-bold text-[var(--mk-primary-ink)]">
            {badge}
          </span>
        ) : null}
      </div>
      <span className="flex items-baseline gap-3">
        <span className="text-[44px] leading-none font-bold tracking-[-0.04em] sm:text-[52px]">
          {price}
        </span>
        {originalPrice ? (
          <s className="text-[17px] text-[var(--mk-text-3)]">{originalPrice}</s>
        ) : null}
      </span>
      <span className="min-h-11.5 text-[15px] leading-[1.55] text-[var(--mk-text-2)]">
        {description}
      </span>
      <Link
        className={`flex h-12.5 items-center justify-center gap-2 rounded-[var(--mk-radius-md)] text-[15px] font-semibold ${
          highlighted
            ? 'bg-[var(--mk-ink)] text-white hover:bg-[var(--mk-ink)]/90'
            : 'border border-[var(--mk-border-strong)] hover:border-[var(--mk-ink)]'
        }`}
        href={ctaHref}
      >
        {ctaLabel} {highlighted ? <span aria-hidden="true">→</span> : null}
      </Link>
      <div className="mt-2 border-t border-[var(--mk-divider)]" />
      <CheckList items={features} />
    </div>
  );
}
