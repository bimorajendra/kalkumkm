'use client';

import {
  Calculator,
  CookingPot,
  Ellipsis,
  Home,
  LogOut,
  type LucideIcon,
  ReceiptText,
  Settings2,
  Share2,
  Wheat,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MkLogo } from '@/components/marketing/logo';
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSnapshot } from './data-provider';

const mainLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Ringkasan', icon: Home },
];
const businessLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard/hitung', label: 'Hitung HPP', icon: Calculator },
  { href: '/dashboard/bahan', label: 'Bahan', icon: Wheat },
  { href: '/dashboard/resep', label: 'Resep', icon: CookingPot },
];
const salesLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard/penawaran', label: 'Penawaran', icon: ReceiptText },
  { href: '/dashboard/bagikan', label: 'Daftar harga', icon: Share2 },
];
const mobileTabs = mainLinks.concat(businessLinks);

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
    pathname === href ||
    (href !== '/dashboard' && pathname.startsWith(`${href}/`));
  const currentPage = [...mainLinks, ...businessLinks, ...salesLinks].find(
    ({ href }) => active(href),
  );
  const currentPageLabel =
    currentPage?.label ??
    (pathname.startsWith('/dashboard/lainnya')
      ? 'Pengaturan'
      : pathname.startsWith('/dashboard/beli')
        ? 'Takaran Pro'
        : pathname.startsWith('/dashboard/admin')
          ? 'Admin'
          : 'Dashboard');

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Lewati ke isi halaman
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card px-4 py-5 lg:flex">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex min-h-11 items-center px-2"
          aria-label="Takaran, ke Ringkasan"
        >
          <MkLogo height={28} />
        </Link>
        <nav
          aria-label="Navigasi dashboard"
          className="min-h-0 flex-1 overflow-y-auto pb-4"
        >
          <div className="grid gap-6">
            <SidebarGroup links={mainLinks} active={active} />
            <SidebarGroup title="Usaha" links={businessLinks} active={active} />
            <SidebarGroup
              title="Penjualan"
              links={salesLinks}
              active={active}
            />
            <SidebarGroup
              title="Akun"
              links={[
                {
                  href: '/dashboard/lainnya',
                  label: 'Pengaturan',
                  icon: Settings2,
                },
              ]}
              active={active}
            />
          </div>
        </nav>
        {plan === 'pro' ? (
          <div className="mt-auto rounded-xl border bg-background p-4">
            <Badge variant="secondary" className="mb-2">
              Takaran Pro
            </Badge>
            <p className="text-sm text-muted-foreground">
              Semua fitur Pro aktif di akunmu.
            </p>
          </div>
        ) : (
          <div className="mt-auto grid gap-2 rounded-xl bg-secondary p-4">
            <p className="font-semibold">Butuh resep tanpa batas?</p>
            <p className="text-sm text-muted-foreground">
              Lihat fitur dan harga Takaran Pro.
            </p>
            <Button asChild size="sm" className="mt-1 w-full">
              <Link href="/dashboard/beli">Lihat Takaran Pro</Link>
            </Button>
          </div>
        )}
      </aside>

      <div id="isi" tabIndex={-1} className="min-w-0 outline-none">
        <header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="mx-auto flex min-h-11 max-w-[1120px] items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center lg:hidden"
              aria-label="Takaran, ke Ringkasan"
            >
              <MkLogo height={24} />
            </Link>
            <p className="hidden text-sm font-medium text-muted-foreground lg:block">
              {currentPageLabel}
            </p>
            <div className="ml-auto flex items-center gap-2">
              {plan === 'pro' ? (
                <Badge
                  variant="secondary"
                  className="rounded-lg bg-[var(--peach-100)] text-[var(--caramel-700)] sm:hidden"
                >
                  Pro
                </Badge>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full sm:hidden"
                >
                  <Link href="/dashboard/beli">Lihat Pro</Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-h-11 rounded-full">
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
                    <Link href="/dashboard/lainnya">Pengaturan</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-11 text-base">
                    <Link href="/dashboard/beli">Takaran Pro</Link>
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
        {children}
      </div>

      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t bg-card lg:hidden"
      >
        {mobileTabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? 'page' : undefined}
            className={cn(
              'flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs',
              active(href)
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
            {label === 'Hitung HPP' ? 'Hitung' : label}
          </Link>
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex h-full min-h-12 flex-col gap-0.5 rounded-none px-1 text-xs text-muted-foreground"
            >
              <Ellipsis aria-hidden="true" className="size-5" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] overflow-y-auto rounded-t-2xl px-4 pb-8"
          >
            <SheetHeader className="px-0 pr-10">
              <SheetTitle>Menu Takaran</SheetTitle>
              <SheetDescription>
                Buka alat usaha, pengaturan akun, atau paket Pro.
              </SheetDescription>
            </SheetHeader>
            <MobileMenuGroup
              title="Dashboard"
              links={mainLinks}
              active={active}
            />
            <MobileMenuGroup
              title="Usaha"
              links={businessLinks}
              active={active}
            />
            <MobileMenuGroup
              title="Penjualan"
              links={salesLinks}
              active={active}
            />
            <MobileMenuGroup
              title="Akun"
              links={[
                {
                  href: '/dashboard/lainnya',
                  label: 'Pengaturan',
                  icon: Settings2,
                },
                {
                  href: '/dashboard/beli',
                  label: 'Takaran Pro',
                  icon: ReceiptText,
                },
              ]}
              active={active}
            />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

function SidebarGroup({
  title,
  links,
  active,
}: {
  title?: string;
  links: { href: string; label: string; icon: LucideIcon }[];
  active: (href: string) => boolean;
}) {
  return (
    <div className="grid gap-1">
      {title ? (
        <h2 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      ) : null}
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(href) ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
            active(href)
              ? 'bg-secondary font-semibold text-foreground'
              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
          )}
        >
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
          {label}
        </Link>
      ))}
    </div>
  );
}

function MobileMenuGroup({
  title,
  links,
  active,
}: {
  title: string;
  links: { href: string; label: string; icon: LucideIcon }[];
  active: (href: string) => boolean;
}) {
  return (
    <section className="grid gap-1 pb-4" aria-label={title}>
      <h2 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {links.map(({ href, label, icon: Icon }) => (
        <SheetClose key={href} asChild>
          <Link
            href={href}
            aria-current={active(href) ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm',
              active(href)
                ? 'bg-secondary font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
            {label}
          </Link>
        </SheetClose>
      ))}
    </section>
  );
}
