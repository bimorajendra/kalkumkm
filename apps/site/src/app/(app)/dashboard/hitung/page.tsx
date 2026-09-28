import type { Metadata } from 'next';
import { HitungScreen } from '@/features/pricing/hitung-screen';

export const metadata: Metadata = { title: 'Kalkulator' };

export default function HitungPage() {
  return <HitungScreen />;
}
