import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MkLogo } from '@/components/marketing/logo';
import { Button } from '@/components/ui/button';
import { getAuth } from '@/server/auth';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = { title: 'Masuk atau daftar' };
export const dynamic = 'force-dynamic';

async function signInWithGoogle() {
  'use server';
  const auth = await getAuth();
  const result = await auth.api.signInSocial({
    body: {
      provider: 'google',
      callbackURL: '/dashboard',
      errorCallbackURL: '/masuk?galat=1',
    },
    headers: await headers(),
  });
  if (!result.url) redirect('/masuk?galat=1');
  redirect(result.url);
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.7-.4-4H24v7.6h11a9.4 9.4 0 0 1-4.1 6.2v5h6.7c3.9-3.6 6-8.8 6-14.8Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5c-1.9 1.3-4.2 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.8 28a12 12 0 0 1 0-7.9v-5.2H5.9a20 20 0 0 0 0 18.3l6.9-5.2Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.6 1 7.7 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.9 14.9l6.9 5.2c1.6-4.7 6-8.2 11.2-8.2Z"
      />
    </svg>
  );
}

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  if (await getSessionUser()) redirect('/dashboard');
  const { galat } = await searchParams;

  return (
    <main className="min-h-dvh px-4 py-8 sm:px-6 lg:grid lg:place-items-center lg:px-8">
      {/* Kolom tunggal menjaga tombol Google jadi fokus di HP; layar lebar memberi ruang untuk penjelasan. */}
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <section className="grid gap-8 lg:py-12">
          <Link href="/" aria-label="Takaran, beranda" className="w-fit">
            <MkLogo height={40} />
          </Link>
          <div className="grid max-w-xl gap-4">
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              Hitung untung usahamu dengan lebih tenang.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Simpan harga bahan dan resep dalam satu akun. Buka lagi kapan pun
              kamu perlu mengecek harga jual.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="login-title"
          className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="mb-7 grid gap-2">
            <h2
              id="login-title"
              className="font-display text-3xl font-semibold leading-tight"
            >
              Masuk atau buat akun
            </h2>
            <p className="text-muted-foreground">
              Akun baru dibuat otomatis saat pertama kali masuk dengan Google.
            </p>
          </div>
          {galat ? (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
            >
              Masuk belum berhasil. Coba lagi sebentar lagi.
            </p>
          ) : null}
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              size="lg"
              variant="outline"
              className="h-12 w-full justify-center gap-3 border-input bg-white text-foreground hover:bg-secondary"
            >
              <GoogleMark />
              Lanjut dengan Google
            </Button>
          </form>
          <p className="mt-5 text-sm text-muted-foreground">
            Kami memakai nama dan email dari akun Google untuk membuat akunmu.
            Lihat{' '}
            <Link
              href="/kebijakan-privasi"
              className="text-link underline underline-offset-4"
            >
              kebijakan privasi
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
