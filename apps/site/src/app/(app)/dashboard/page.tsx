import type { Metadata } from 'next';
import { DashboardOverview } from '@/components/takaran/dashboard-overview';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return <DashboardOverview />;
}
