import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { publicMetadata } from '@/features/seo/metadata';
import { useCaseGroups, useCases } from '@/features/seo/use-cases';

export const metadata: Metadata = publicMetadata({
  title: 'Panduan HPP berdasarkan jenis usaha makanan',
  description:
    'Pilih panduan HPP sesuai produk yang kamu jual. Lihat cara menghitung modal dan contoh kalkulator untuk usahamu.',
  path: '/usaha',
});

export default function UsahaPage() {
  const origin = process.env.APP_URL || 'http://localhost:3000';
  return (
    <article className="mx-auto grid w-full max-w-4xl gap-8 px-5 py-10 lg:py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Takaran',
              item: new URL('/', origin).href,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Jenis usaha',
              item: new URL('/usaha', origin).href,
            },
          ],
        }}
      />
      <nav
        aria-label="Navigasi halaman"
        className="flex flex-wrap items-center gap-2 text-sm"
      >
        <Link
          className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
          href="/"
        >
          Beranda
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Jenis usaha</span>
      </nav>
      <header className="grid gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight lg:text-5xl">
          Panduan HPP sesuai jenis usahamu
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Pilih produk yang kamu jual untuk melihat bahan, hasil produksi, dan
          kemasan yang perlu masuk hitungan. Angka pada kalkulator adalah
          ilustrasi, bukan harga pasar.
        </p>
      </header>
      <div className="grid gap-9">
        {useCaseGroups.map((group) => {
          const entries = useCases.filter((item) => item.group === group);
          return entries.length ? (
            <section key={group} className="grid gap-2">
              <h2 className="font-display text-xl font-semibold">{group}</h2>
              <nav
                aria-label={`Panduan ${group}`}
                className="grid gap-x-8 sm:grid-cols-2"
              >
                {entries.map(({ slug, title, description }) => (
                  <Link
                    className="grid min-h-11 gap-1 border-b border-input/60 py-3 text-link underline-offset-4 hover:underline"
                    href={`/usaha/${slug}`}
                    key={slug}
                  >
                    <span className="font-semibold">{title}</span>
                    <span className="text-sm leading-6 text-muted-foreground">
                      {description}
                    </span>
                  </Link>
                ))}
              </nav>
            </section>
          ) : null;
        })}
      </div>
      <Link
        className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
        href="/kalkulator-hpp"
      >
        Hitung HPP makanan per porsi
      </Link>
    </article>
  );
}
