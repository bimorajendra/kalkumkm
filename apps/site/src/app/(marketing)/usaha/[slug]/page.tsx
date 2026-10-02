import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { PublicCalculator } from '@/features/public-calculators/public-calculator';
import { publicMetadata } from '@/features/seo/metadata';
import { getUseCase, useCases } from '@/features/seo/use-cases';

export function generateStaticParams() {
  return useCases.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getUseCase(slug);
  if (!item) return {};
  return publicMetadata({
    title: item.title,
    description: item.description,
    path: `/usaha/${item.slug}`,
  });
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getUseCase(slug);
  if (!item) notFound();
  const origin = process.env.APP_URL || 'http://localhost:3000';
  return (
    <article className="mk mx-auto grid w-full max-w-4xl gap-8 px-5 py-10 lg:py-16">
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
            {
              '@type': 'ListItem',
              position: 3,
              name: item.title,
              item: new URL(`/usaha/${item.slug}`, origin).href,
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
        <Link
          className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
          href="/usaha"
        >
          Jenis usaha
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{item.title}</span>
      </nav>
      <header className="grid gap-4">
        <p className="text-sm font-semibold text-[var(--mk-primary-ink)]">
          Panduan HPP per jenis usaha
        </p>
        <h1 className="text-3xl leading-tight font-bold tracking-tight lg:text-5xl">
          {item.title}
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-[var(--mk-text-2)]">
          {item.intro}
        </p>
      </header>
      <div className="grid gap-7">
        {item.headings.map(([heading, paragraph], index) => (
          <section key={heading} className="grid gap-3">
            <h2 className="text-2xl font-semibold">
              {index + 1}. {heading}
            </h2>
            <p className="leading-relaxed text-[var(--mk-text-2)]">
              {paragraph}
            </p>
          </section>
        ))}
      </div>
      <PublicCalculator mode="hpp" example={item.example} embedded />
      <section className="grid justify-items-start gap-3 rounded-2xl border border-input/60 bg-card p-5 lg:p-7">
        <h2 className="text-2xl font-semibold">Coba hitung HPP usahamu</h2>
        <p className="text-[var(--mk-text-2)]">
          Masukkan biaya dan hasil produksi untuk mendapat perkiraan HPP per
          porsi.
        </p>
        <Button asChild>
          <Link href="/kalkulator-hpp">Buka kalkulator HPP</Link>
        </Button>
      </section>
      <nav
        aria-label="Panduan usaha lain"
        className="grid gap-2 border-t border-input/50 pt-5 sm:grid-cols-2"
      >
        {useCases
          .filter(
            (other) => other.group === item.group && other.slug !== item.slug,
          )
          .slice(0, 6)
          .map((other) => (
            <Link
              key={other.slug}
              href={`/usaha/${other.slug}`}
              className="min-h-11 py-2 text-link underline underline-offset-4"
            >
              {other.title}
            </Link>
          ))}
        <Link
          href="/usaha"
          className="min-h-11 py-2 text-link underline underline-offset-4"
        >
          Lihat semua panduan usaha
        </Link>
      </nav>
    </article>
  );
}
