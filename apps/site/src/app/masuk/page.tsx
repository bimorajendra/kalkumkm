import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuth } from '@/server/auth';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = { title: 'Masuk' };

async function signInWithGoogle() {
  'use server';
  const auth = await getAuth();
  const result = await auth.api.signInSocial({
    body: {
      provider: 'google',
      callbackURL: '/hitung',
      errorCallbackURL: '/masuk?galat=1',
    },
    headers: await headers(),
  });
  if (!result.url) redirect('/masuk?galat=1');
  redirect(result.url);
}

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  if (await getSessionUser()) redirect('/hitung');
  const { galat } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 font-display text-3xl tracking-tight">
        Takaran
      </Link>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>
            <h1 className="font-display text-4xl font-normal leading-tight">
              Masuk ke Takaran
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p>
            Resep dan harga bahanmu tersimpan di akunmu, jadi bisa dibuka dari
            HP mana pun. Hanya kamu yang bisa melihatnya.
          </p>
          {galat ? (
            <Alert variant="destructive">
              <AlertDescription>
                Masuk belum berhasil. Coba lagi sebentar lagi.
              </AlertDescription>
            </Alert>
          ) : null}
          <form action={signInWithGoogle}>
            <Button type="submit" size="lg" className="w-full">
              Masuk dengan Google
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Kami hanya memakai nama dan email dari akun Google untuk membuat
            akunmu. Lihat{' '}
            <Link
              href="/kebijakan-privasi"
              className="text-link underline underline-offset-4"
            >
              kebijakan privasi
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
