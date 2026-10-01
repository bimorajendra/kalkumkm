import { headers } from 'next/headers';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getSessionUser } from '@/server/session';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const user = await getSessionUser().catch(() => null);
  const start = user ? '/dashboard' : '/masuk';
  const ctaLabel = user ? 'Buka kalkulator' : 'Coba gratis';
  return (
    <div className="mk flex min-h-dvh flex-col">
      <GoogleAnalytics nonce={nonce} />
      <SiteHeader ctaHref={start} ctaLabel={ctaLabel} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
