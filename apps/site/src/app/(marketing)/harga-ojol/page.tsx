import type { Metadata } from 'next';
import { CalculatorGuide } from '@/features/public-calculators/calculator-guide';
import { PublicCalculator } from '@/features/public-calculators/public-calculator';
import { publicMetadata } from '@/features/seo/metadata';

export const metadata: Metadata = publicMetadata({
  title: 'Kalkulator Harga Jual Makanan di Ojol',
  description:
    'Sesuaikan harga jual makanan dengan HPP, target margin, dan komisi platform.',
  path: '/harga-ojol',
});

export default function Page() {
  return (
    <>
      <PublicCalculator mode="ojol" />
      <CalculatorGuide mode="ojol" />
    </>
  );
}
