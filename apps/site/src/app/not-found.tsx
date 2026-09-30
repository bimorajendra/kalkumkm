import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70dvh] w-[min(680px,calc(100%-32px))] content-center gap-4 py-16">
      <p className="text-sm font-semibold text-link">404</p>
      <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
        Halaman ini tidak ditemukan.
      </h1>
      <p className="max-w-xl leading-7 text-muted-foreground">
        Alamatnya mungkin sudah berubah atau tidak tersedia. Kembali ke beranda
        untuk melanjutkan.
      </p>
      <Link
        className="inline-flex min-h-11 w-fit items-center font-semibold text-link underline underline-offset-4"
        href="/"
      >
        Kembali ke beranda
      </Link>
    </main>
  );
}
