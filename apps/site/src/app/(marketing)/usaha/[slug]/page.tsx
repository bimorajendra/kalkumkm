import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  return (
    <article className="mk mx-auto grid w-full max-w-4xl gap-8 px-5 py-10 lg:py-16">
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
          .filter((other) => other.slug !== item.slug)
          .map((other) => (
            <Link
              key={other.slug}
              href={`/usaha/${other.slug}`}
              className="min-h-11 py-2 text-link underline underline-offset-4"
            >
              {other.title}
            </Link>
          ))}
      </nav>
    </article>
  );
}
