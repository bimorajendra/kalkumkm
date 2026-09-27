'use client';

import { Calculator, CookingPot, Ellipsis, LogOut, Wheat } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSnapshot } from './data-provider';
import { ThemeToggle } from './theme-toggle';

const tabs = [
  { href: '/hitung', label: 'Hitung', icon: Calculator },
  { href: '/bahan', label: 'Bahan', icon: Wheat },
  { href: '/resep', label: 'Resep', icon: CookingPot },
  { href: '/lainnya', label: 'Lainnya', icon: Ellipsis },
];
const desktopLinks = [
  { href: '/hitung', label: 'Kalkulator' },
  { href: '/bahan', label: 'Bahan' },
  { href: '/resep', label: 'Resep' },
  { href: '/penawaran', label: 'Penawaran' },
  { href: '/bagikan', label: 'Daftar harga' },
];

export function AppShell({
  user,
  signOutAction,
  children,
}: {
  user: { name: string; email: string };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { plan } = useSnapshot();
  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh">
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Lewati ke isi halaman
      </a>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3">
          <Link
            href="/hitung"
            className="font-display text-2xl tracking-tight"
            aria-label="Takaran, ke Hitung"
          >
            Takaran
          </Link>
          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 rounded-full bg-card p-1 shadow-floating lg:flex"
          >
            {desktopLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active(link.href) ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center rounded-full px-4 text-base',
                  active(link.href)
                    ? 'bg-secondary font-semibold'
                    : 'hover:bg-secondary/60',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {plan === 'pro' ? (
              <Badge
                variant="secondary"
                className="rounded-lg bg-[var(--peach-100)] text-[var(--caramel-700)]"
              >
                Pro
              </Badge>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/beli">Lihat Pro</Link>
              </Button>
            )}
            <span className="hidden lg:inline-flex">
              <ThemeToggle />
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  {user.name.split(' ')[0] || 'Akun'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel className="font-normal">
                  <span className="block font-semibold">{user.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="h-11 text-base">
                  <Link href="/lainnya">Pengaturan</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="h-11 text-base">
                  <Link href="/beli">Takaran Pro</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem asChild className="h-11 text-base">
                    <button type="submit" className="w-full">
                      <LogOut aria-hidden="true" /> Keluar
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div id="isi" tabIndex={-1} className="outline-none">
        {children}
      </div>
      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t bg-card lg:hidden"
      >
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? 'page' : undefined}
            className={cn(
              'flex min-h-12 flex-col items-center justify-center gap-0.5 text-sm',
              active(href)
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
