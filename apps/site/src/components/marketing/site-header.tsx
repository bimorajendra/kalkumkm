'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { mkButtonClasses } from './button-classes';
import { MkLogo } from './logo';

const navItems = [
  { href: '/cara-hitung', label: 'Cara hitung' },
  { href: '/artikel', label: 'Artikel' },
  { href: '/fitur', label: 'Fitur' },
  { href: '/harga', label: 'Harga' },
];

export function SiteHeader({
  ctaHref,
  ctaLabel,
}: {
  ctaHref: string;
  ctaLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[var(--mk-border)] bg-[var(--mk-surface)] px-5 lg:grid lg:h-[76px] lg:grid-cols-[1fr_auto_1fr] lg:px-20">
      <Link
        aria-label="Takaran, beranda"
        className="lg:justify-self-start"
        href="/"
      >
        <MkLogo height={28} />
      </Link>
      <nav
        aria-label="Halaman"
        className="hidden items-center gap-9 text-[15px] font-medium text-[var(--mk-text-2)] lg:flex"
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'text-[var(--mk-ink)] font-semibold shadow-[inset_0_-2px_0_var(--mk-primary)]'
                  : 'hover:text-[var(--mk-ink)]'
              }
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden lg:justify-self-end lg:block">
        <Link className={mkButtonClasses('primary', 'sm')} href={ctaHref}>
          {ctaLabel}
        </Link>
      </div>

      <div className="flex items-center gap-1 lg:hidden">
        <Link className={mkButtonClasses('primary', 'sm')} href={ctaHref}>
          {ctaLabel}
        </Link>
        <Sheet onOpenChange={setOpen} open={open}>
          <SheetTrigger asChild>
            <button
              aria-label="Buka menu"
              className="flex size-11 items-center justify-center"
              type="button"
            >
              <Menu aria-hidden="true" size={20} />
            </button>
          </SheetTrigger>
          <SheetContent
            className="w-[86vw] gap-0 bg-[var(--mk-surface)] p-0 text-[var(--mk-ink)] sm:max-w-[340px]"
            showCloseButton={false}
            side="right"
          >
            <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
            <div className="flex h-16 items-center justify-between border-b border-[var(--mk-border)] px-5">
              <Link aria-label="Takaran, beranda" href="/">
                <MkLogo height={28} />
              </Link>
              <SheetClose asChild>
                <button
                  aria-label="Tutup menu"
                  className="flex size-11 items-center justify-center rounded-full hover:bg-[var(--mk-surface-muted)]"
                  type="button"
                >
                  <X aria-hidden="true" size={20} />
                </button>
              </SheetClose>
            </div>
            <nav aria-label="Halaman" className="flex flex-col px-2 py-2">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-13 items-center rounded-[var(--mk-radius-sm)] px-3 text-base font-medium transition-colors ${
                        active
                          ? 'bg-[var(--mk-primary-tint)] font-semibold text-[var(--mk-primary-ink)]'
                          : 'hover:bg-[var(--mk-surface-muted)]'
                      }`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-[var(--mk-border)] p-5">
              <SheetClose asChild>
                <Link
                  className={`${mkButtonClasses('primary', 'lg')} w-full`}
                  href={ctaHref}
                >
                  {ctaLabel}
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
