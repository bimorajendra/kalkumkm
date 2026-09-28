import Link from 'next/link';
import { mkButtonClasses } from './button-classes';

export function CtaPanel({
  title,
  text,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  text?: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-6 rounded-[var(--mk-radius-2xl)] bg-[var(--mk-ink)] p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-13">
      <div className="grid gap-2.5">
        <h2 className="text-[26px] leading-[1.2] font-bold tracking-[-0.03em] text-white lg:text-[38px] lg:leading-[1.15]">
          {title}
        </h2>
        {text ? (
          <p className="text-[15px] text-[var(--mk-on-dark-muted)] lg:text-[17px]">
            {text}
          </p>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:shrink-0">
        {secondaryHref && secondaryLabel ? (
          <Link
            className={mkButtonClasses('onDark', 'xl')}
            href={secondaryHref}
          >
            {secondaryLabel}
          </Link>
        ) : null}
        <Link className={mkButtonClasses('onDarkPrimary', 'xl')} href={ctaHref}>
          {ctaLabel} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
