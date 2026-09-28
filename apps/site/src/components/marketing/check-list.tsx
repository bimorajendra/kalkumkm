function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
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

export function CheckList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="grid gap-3.5 text-[15px]">
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: daftar statis, urutan tidak berubah
        <li className="flex gap-3" key={index}>
          <CheckIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
