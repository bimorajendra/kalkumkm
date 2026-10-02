import Link from 'next/link';
import { MkLogo } from './logo';

const links = [
  { href: '/kalkulator-hpp', label: 'Kalkulator HPP' },
  { href: '/cara-hitung', label: 'Cara hitung' },
  { href: '/artikel', label: 'Artikel' },
  { href: '/fitur', label: 'Fitur' },
  { href: '/harga', label: 'Harga' },
];

export function SiteFooter() {
  return (
    <footer className="flex flex-shrink-0 flex-col gap-3 border-t border-[var(--mk-border)] bg-[var(--mk-surface)] px-5 py-7 text-sm lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:px-20 lg:py-7">
      <div className="self-start lg:justify-self-start">
        <MkLogo height={24} />
      </div>
      <nav
        aria-label="Kaki halaman"
        className="flex flex-wrap gap-x-7 gap-y-2 text-[var(--mk-text-2)] lg:justify-self-center"
      >
        {links.map((link) => (
          <Link
            href={link.href}
            key={link.href}
            className="inline-flex min-h-11 items-center"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/kebijakan-privasi"
          className="inline-flex min-h-11 items-center"
        >
          Kebijakan privasi
        </Link>
      </nav>
      <span className="text-[13px] text-[var(--mk-text-3)] lg:justify-self-end">
        © 2026 Takaran
      </span>
    </footer>
  );
}
