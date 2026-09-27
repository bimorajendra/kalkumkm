'use client';

import { useRouter } from 'next/navigation';
import { useSnapshot } from '@/components/takaran/data-provider';
import { Page, PageTitle } from '@/components/takaran/page';
import { PaywallDialog } from '@/features/billing/paywall-dialog';
import { QuoteBuilder } from './quote-builder';

/** Penawaran adalah fitur Pro. Batasnya juga dijaga di server. */
export function PenawaranScreen() {
  const { plan } = useSnapshot();
  const router = useRouter();
  if (plan !== 'pro')
    return (
      <Page className="grid gap-3">
        <PageTitle>Penawaran pesanan custom</PageTitle>
        <p>Fitur ini tersedia dengan Takaran Pro.</p>
        <PaywallDialog
          open
          trigger="quote"
          onClose={() => router.push('/hitung')}
        />
      </Page>
    );
  return <QuoteBuilder />;
}
