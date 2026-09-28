/** Wordmark + ikon takar, dipakai di header dan footer situs marketing. */
export function MkLogo({ iconSize = 32 }: { iconSize?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-[9px] bg-[var(--mk-primary)]"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          aria-hidden="true"
          fill="none"
          height={iconSize * 0.56}
          viewBox="0 0 14 18"
          width={iconSize * 0.44}
        >
          <path
            d="M12 1v16"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M4 3h8M7.5 7h4.5M2 11h10M7.5 15h4.5"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-[-0.03em]">takaran</span>
    </span>
  );
}
