import type { Metadata } from 'next';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { requireUser } from '@/server/session';

export const metadata: Metadata = { title: 'Pengaturan' };

export default async function LainnyaPage() {
  const user = await requireUser();
  return <SettingsScreen user={user} />;
}
