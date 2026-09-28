import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/takaran/app-shell';
import { DataProvider } from '@/components/takaran/data-provider';
import { getAuth } from '@/server/auth';
import { getDb } from '@/server/db';
import { requireUser } from '@/server/session';
import { getSnapshot } from '@/server/store';

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

async function signOut() {
  'use server';
  const auth = await getAuth();
  await auth.api.signOut({ headers: await headers() });
  redirect('/');
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const snapshot = await getSnapshot(await getDb(), user.id);
  return (
    <DataProvider initial={snapshot}>
      <AppShell user={user} signOutAction={signOut}>
        {children}
      </AppShell>
    </DataProvider>
  );
}
