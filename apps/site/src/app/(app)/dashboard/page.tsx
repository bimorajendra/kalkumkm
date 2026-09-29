import type { Metadata } from 'next';
import { DashboardOverview } from '@/components/takaran/dashboard-overview';
import { requireUser } from '@/server/session';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Asia/Jakarta',
    })
      .formatToParts(now)
      .find((part) => part.type === 'hour')?.value ?? '12',
  );
  const greeting =
    hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 18 ? 'sore' : 'malam';
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(now);
  return (
    <DashboardOverview
      userName={user.name}
      greeting={greeting}
      dateLabel={dateLabel}
    />
  );
}
