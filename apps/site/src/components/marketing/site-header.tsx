'use client';

import { Menu } from 'lucide-react';
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
        <MkLogo iconSize={28} />
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
            className="bg-[var(--mk-surface)] text-[var(--mk-ink)]"
            side="right"
          >
            <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
            <nav
              aria-label="Halaman"
              className="grid gap-1 p-4 text-base font-medium"
            >
              {navItems.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    className="flex min-h-11 items-center rounded-[var(--mk-radius-sm)] px-3 hover:bg-[var(--mk-surface-muted)]"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
