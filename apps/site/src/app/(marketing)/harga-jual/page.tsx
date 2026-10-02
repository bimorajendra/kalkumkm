import type { Metadata } from 'next';
import { CalculatorGuide } from '@/features/public-calculators/calculator-guide';
import { PublicCalculator } from '@/features/public-calculators/public-calculator';
import { publicMetadata } from '@/features/seo/metadata';

export const metadata: Metadata = publicMetadata({
  title: 'Kalkulator Harga Jual dari HPP dan Margin',
  description:
    'Hitung harga jual makanan berdasarkan HPP, target margin, dan pembulatan harga.',
  path: '/harga-jual',
});

export default function Page() {
  return (
    <>
      <PublicCalculator mode="price" />
      <CalculatorGuide mode="price" />
    </>
  );
}
