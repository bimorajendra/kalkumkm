import type { Metadata } from 'next';
import { PublicCalculator } from '@/features/public-calculators/public-calculator';
import { publicMetadata } from '@/features/seo/metadata';

export const metadata: Metadata = publicMetadata({
  title: 'Kalkulator Margin Keuntungan Makanan',
  description:
    'Hitung margin dan untung per porsi setelah biaya HPP dan komisi saluran jual.',
  path: '/margin',
});

export default function Page() {
  return <PublicCalculator mode="margin" />;
}
