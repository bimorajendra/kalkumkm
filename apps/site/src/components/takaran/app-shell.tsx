'use client';

import { actualMarginBp, CalcError, suggestPrice } from '@takaran/calc';
import { FREE_LIMITS } from '@takaran/schema';
import {
  Calculator,
  ChevronDown,
  CookingPot,
  Ellipsis,
  Home,
  LogOut,
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Search,
  Settings2,
  Share2,
  Wheat,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
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
import { useRecipeResults } from './data-provider';

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeTone?: 'muted' | 'danger';
  pill?: string;
};

const mainLinks: NavLink[] = [
  { href: '/dashboard', label: 'Ringkasan', icon: Home },
];
const salesLinks: NavLink[] = [
  {
    href: '/dashboard/penawaran',
    label: 'Penawaran',
    icon: ReceiptText,
    pill: 'Pro',
  },
  { href: '/dashboard/bagikan', label: 'Daftar harga', icon: Share2 },
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
  const router = useRouter();
  const { snapshot, results } = useRecipeResults();
  const { plan, recipes, ingredients, settings } = snapshot;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const belowTargetCount = recipes.reduce((count, recipe) => {
    const result = results.get(recipe.id);
    if (!result || result instanceof CalcError) return count;
    try {
      const price =
        recipe.currentPrice ??
        suggestPrice(
          result.hpp,
          recipe.targetMarginBp,
          0,
          settings.roundingStep,
        );
      const margin = actualMarginBp(price, result.hpp, 0);
      return margin < recipe.targetMarginBp ? count + 1 : count;
    } catch {
      return count;
    }
  }, 0);
  const userInitial =
    user.name.trim().charAt(0).toLocaleUpperCase('id-ID') || 'A';
  const businessLinks: NavLink[] = [
    { href: '/dashboard/hitung', label: 'Hitung HPP', icon: Calculator },
    {
      href: '/dashboard/bahan',
      label: 'Bahan',
      icon: Wheat,
      badge: String(ingredients.length),
    },
    {
      href: '/dashboard/resep',
      label: 'Resep',
      icon: CookingPot,
      badge: belowTargetCount > 0 ? String(belowTargetCount) : undefined,
      badgeTone: 'danger',
    },
  ];
  const mobileTabs = mainLinks.concat(businessLinks);
  const active = (href: string) =>
    pathname === href ||
    (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const needle = search.trim().toLocaleLowerCase('id-ID');
    if (!needle) return;
    const recipe = recipes.find((item) =>
      item.name.toLocaleLowerCase('id-ID').includes(needle),
    );
    if (recipe) {
      router.push(`/dashboard/resep/${recipe.id}`);
      return;
    }
    if (
      ingredients.some((item) =>
        item.name.toLocaleLowerCase('id-ID').includes(needle),
      )
    )
      router.push('/dashboard/bahan');
  }

  return (
    <div
      className={cn(
        'min-h-dvh bg-background lg:grid',
        sidebarCollapsed
          ? 'lg:grid-cols-[80px_minmax(0,1fr)]'
          : 'lg:grid-cols-[80px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)]',
      )}
    >
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Lewati ke isi halaman
      </a>

      <aside
        className={cn(
          'sticky top-0 hidden h-dvh flex-col border-r bg-card py-5 lg:flex',
          sidebarCollapsed ? 'items-center px-2' : 'px-3 xl:px-4',
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            'mb-5 inline-flex min-h-11 items-center',
            sidebarCollapsed ? 'px-1' : 'px-2',
          )}
          aria-label="Takaran, ke Ringkasan"
        >
          <MkLogo height={sidebarCollapsed ? 18 : 28} />
        </Link>
        <nav
          aria-label="Navigasi dashboard"
          className={cn(
            'min-h-0 flex-1 overflow-y-auto pb-4',
            sidebarCollapsed ? 'w-full' : 'w-full',
          )}
        >
          <div className="grid gap-6">
            <SidebarGroup
              links={mainLinks}
              active={active}
              collapsed={sidebarCollapsed}
            />
            <SidebarGroup
              title="Dapur"
              links={businessLinks}
              active={active}
              collapsed={sidebarCollapsed}
            />
            <SidebarGroup
              title="Jualan"
              links={salesLinks}
              active={active}
              collapsed={sidebarCollapsed}
            />
          </div>
        </nav>
        <Link
          href="/dashboard/beli"
          title={plan === 'pro' ? 'Takaran Pro aktif' : 'Lihat Takaran Pro'}
          aria-label={
            plan === 'pro' ? 'Takaran Pro aktif' : 'Lihat Takaran Pro'
          }
          className={cn(
            'flex min-h-11 items-center rounded-xl bg-secondary text-sm font-semibold',
            sidebarCollapsed ? 'justify-center px-2' : 'grid gap-1 p-4',
          )}
        >
          <span
            aria-hidden="true"
            className="text-lg text-caramel-700 xl:hidden"
          >
            {plan === 'pro' ? '✓' : '✦'}
          </span>
          <span className={sidebarCollapsed ? 'hidden' : 'hidden xl:grid'}>
            <span className="flex items-baseline justify-between gap-2">
              <span>{plan === 'pro' ? 'Takaran Pro' : 'Paket Gratis'}</span>
              {plan === 'pro' ? null : (
                <span className="text-xs font-normal text-muted-foreground">
                  {recipes.length} dari {FREE_LIMITS.recipes} resep
                </span>
              )}
            </span>
            {plan === 'pro' ? null : (
              // biome-ignore lint/a11y/useSemanticElements: <meter> tidak bisa diberi gaya isi tipis warna karamel tanpa hack pseudo-elemen lintas browser
              <span
                role="meter"
                aria-label="Kuota resep terpakai"
                aria-valuemin={0}
                aria-valuemax={FREE_LIMITS.recipes}
                aria-valuenow={Math.min(recipes.length, FREE_LIMITS.recipes)}
                className="block h-2 overflow-hidden rounded-full bg-surface"
              >
                <span
                  className="block h-2 rounded-full bg-caramel-600"
                  style={{
                    width: `${Math.min(100, (recipes.length / FREE_LIMITS.recipes) * 100)}%`,
                  }}
                />
              </span>
            )}
            <span
              className={
                plan === 'pro'
                  ? 'font-normal text-muted-foreground'
                  : 'text-link'
              }
            >
              {plan === 'pro' ? 'Semua fitur terbuka' : 'Lihat Pro'}
            </span>
          </span>
        </Link>
        <Link
          href="/dashboard/lainnya"
          aria-current={active('/dashboard/lainnya') ? 'page' : undefined}
          aria-label="Pengaturan"
          title="Pengaturan"
          className={cn(
            'mt-auto flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
            sidebarCollapsed
              ? 'justify-center'
              : 'justify-center xl:justify-start',
            active('/dashboard/lainnya') &&
              'bg-secondary font-semibold text-foreground',
          )}
        >
          <Settings2 aria-hidden="true" className="size-5" strokeWidth={1.75} />
          <span className={sidebarCollapsed ? 'hidden' : 'hidden xl:inline'}>
            Pengaturan
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={sidebarCollapsed ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
          title={sidebarCollapsed ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
          className="absolute right-2 top-5 hidden size-11 xl:inline-flex"
          onClick={() => setSidebarCollapsed((current) => !current)}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen aria-hidden="true" />
          ) : (
            <PanelLeftClose aria-hidden="true" />
          )}
        </Button>
      </aside>

      <div id="isi" tabIndex={-1} className="min-w-0 outline-none">
        <header className="sticky top-0 z-30 border-b border-line bg-background/95 px-4 py-2 backdrop-blur lg:px-8">
          <div className="mx-auto flex min-h-11 max-w-[1120px] items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center lg:hidden"
              aria-label="Takaran, ke Ringkasan"
            >
              <MkLogo height={24} />
            </Link>
            <search className="hidden w-full max-w-96 lg:block">
              <form onSubmit={onSearchSubmit} className="relative">
                <label htmlFor="dashboard-search" className="sr-only">
                  Cari resep atau bahan
                </label>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="dashboard-search"
                  type="search"
                  placeholder="Cari resep atau bahan"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 rounded-full pl-10"
                />
              </form>
            </search>
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
                  <Button
                    variant="outline"
                    className="min-h-11 rounded-full border-line bg-surface py-1 pl-1 pr-3"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-8 place-items-center rounded-full bg-peach-100 font-display font-bold text-caramel-700"
                    >
                      {userInitial}
                    </span>
                    <span>{user.name.split(' ')[0] || 'Akun'}</span>
                    <ChevronDown aria-hidden="true" className="size-4" />
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
        {mobileTabs.map(({ href, label, icon: Icon, badge, badgeTone }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? 'page' : undefined}
            aria-label={badge ? `${label}, ${badge}` : undefined}
            className={cn(
              'flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs',
              active(href)
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground',
            )}
          >
            <span className="relative">
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
              {badge && badgeTone === 'danger' ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-0.5 size-2 rounded-full border border-card bg-destructive"
                />
              ) : null}
            </span>
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
              Lainnya
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] overflow-y-auto rounded-t-2xl px-4 pb-8"
          >
            <SheetHeader className="px-0 pr-10">
              <SheetTitle>Lainnya</SheetTitle>
              <SheetDescription>
                Buka alat usaha, pengaturan akun, atau paket Pro.
              </SheetDescription>
            </SheetHeader>
            <MobileMenuGroup
              title="Jualan"
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
  collapsed,
}: {
  title?: string;
  links: NavLink[];
  active: (href: string) => boolean;
  collapsed: boolean;
}) {
  return (
    <div className="grid gap-1">
      {title ? (
        <h2
          className={cn(
            'px-3 pb-1 text-sm font-medium text-muted-foreground',
            collapsed ? 'hidden' : 'hidden xl:block',
          )}
        >
          {title}
        </h2>
      ) : null}
      {links.map(({ href, label, icon: Icon, badge, badgeTone, pill }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(href) ? 'page' : undefined}
          aria-label={badge ? `${label}, ${badge}` : label}
          title={label}
          className={cn(
            'relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
            collapsed ? 'justify-center' : 'justify-center xl:justify-start',
            active(href)
              ? 'bg-secondary font-semibold text-foreground'
              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
          )}
        >
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
          {badge && badgeTone === 'danger' ? (
            <span
              aria-hidden="true"
              className={cn(
                'absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-card bg-destructive',
                collapsed ? 'block' : 'block xl:hidden',
              )}
            />
          ) : null}
          <span
            className={cn('flex-1', collapsed ? 'hidden' : 'hidden xl:inline')}
          >
            {label}
          </span>
          {badge ? (
            <span
              className={cn(
                'flex items-center gap-1.5 text-xs',
                badgeTone === 'danger'
                  ? 'font-semibold text-destructive'
                  : 'text-muted-foreground',
                collapsed ? 'hidden' : 'hidden xl:inline-flex',
              )}
            >
              {badgeTone === 'danger' ? (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-destructive"
                />
              ) : null}
              {badge}
            </span>
          ) : null}
          {pill ? (
            <span
              className={cn(
                'rounded-[10px] bg-peach-100 px-2 py-0.5 text-xs font-semibold text-caramel-700',
                collapsed ? 'hidden' : 'hidden xl:inline',
              )}
            >
              {pill}
            </span>
          ) : null}
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
