import type { Metadata } from 'next';
import { BeliScreen } from '@/features/billing/beli-screen';

export const metadata: Metadata = { title: 'Takaran Pro' };

export default function BeliPage() {
  return <BeliScreen />;
}
