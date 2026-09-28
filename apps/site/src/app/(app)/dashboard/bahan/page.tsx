import type { Metadata } from 'next';
import { BahanScreen } from '@/features/ingredients/bahan-screen';

export const metadata: Metadata = { title: 'Bahan' };

export default function Page() {
  return <BahanScreen />;
}
