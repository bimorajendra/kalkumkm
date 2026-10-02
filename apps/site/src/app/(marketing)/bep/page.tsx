import type { Metadata } from 'next';
import { CalculatorGuide } from '@/features/public-calculators/calculator-guide';
import { PublicCalculator } from '@/features/public-calculators/public-calculator';
import { publicMetadata } from '@/features/seo/metadata';

export const metadata: Metadata = publicMetadata({
  title: 'Kalkulator Break Even Point Usaha Makanan',
  description:
    'Cari jumlah minimum unit yang perlu dijual untuk menutup biaya tetap usaha makanan.',
  path: '/bep',
});

export default function Page() {
  return (
    <>
      <PublicCalculator mode="bep" />
      <CalculatorGuide mode="bep" />
    </>
  );
}
