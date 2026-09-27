import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PriceListBuilder } from '@/features/share/price-list-builder';

export const metadata: Metadata = { title: 'Daftar harga' };

export default function BagikanPage() {
  return (
    <Suspense>
      <PriceListBuilder />
    </Suspense>
  );
}
