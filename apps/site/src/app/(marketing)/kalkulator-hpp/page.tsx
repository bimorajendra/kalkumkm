import type { Metadata } from 'next';
import { CalculatorGuide } from '@/features/public-calculators/calculator-guide';
import { PublicCalculator } from '@/features/public-calculators/public-calculator';
import { publicMetadata } from '@/features/seo/metadata';

export const metadata: Metadata = publicMetadata({
  title: 'Kalkulator HPP Makanan per Porsi',
  description:
    'Hitung HPP makanan dari biaya bahan, produksi, jumlah hasil, dan kemasan per porsi.',
  path: '/kalkulator-hpp',
});

export default function Page() {
  return (
    <>
      <PublicCalculator mode="hpp" />
      <CalculatorGuide mode="hpp" />
    </>
  );
}
