import type { Metadata } from 'next';
import { PenawaranScreen } from '@/features/quote/penawaran-screen';

export const metadata: Metadata = { title: 'Penawaran' };

export default function PenawaranPage() {
  return <PenawaranScreen />;
}
