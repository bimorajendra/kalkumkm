import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/json-ld';
import { articles, getArticle } from '@/features/articles/content';

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/artikel/${article.slug}` },
    openGraph: {
      type: 'article',
      url: `/artikel/${slug}`,
      siteName: 'Takaran',
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      section: article.category,
      locale: 'id_ID',
      images: article.image
        ? [
            {
              url: article.image.src,
              width: article.image.width,
              height: article.image.height,
              alt: article.image.alt,
            },
          ]
        : [{ url: '/icon.png', alt: 'Takaran' }],
    },
    twitter: {
      card: 'summary',
      title: article.title,
      description: article.description,
      images: [article.image?.src ?? '/icon.png'],
    },
  };
}

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const origin = process.env.APP_URL || 'http://localhost:3000';
  const articleUrl = new URL(`/artikel/${article.slug}`, origin).href;
  const relatedArticles = article.related
    .map((relatedSlug) => getArticle(relatedSlug))
    .filter((relatedArticle) => relatedArticle !== undefined);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: 'id-ID',
    articleSection: article.category,
    mainEntityOfPage: articleUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Takaran',
      url: origin,
      logo: new URL('/logo.png', origin).href,
    },
    ...(article.author
      ? {
          author: {
            '@type': 'Person',
            name: article.author.name,
            ...(article.author.url ? { url: article.author.url } : {}),
          },
        }
      : {}),
    ...(article.image
      ? { image: new URL(article.image.src, origin).href }
      : {}),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: origin },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Artikel',
        item: new URL('/artikel', origin).href,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbSchema} />
      <article className="mx-auto w-full max-w-3xl px-5 py-10 lg:py-16">
        <nav
          aria-label="Breadcrumb"
          className="text-sm text-[var(--mk-text-2)]"
        >
          <ol className="flex flex-wrap gap-x-2 gap-y-1">
            <li>
              <Link className="underline underline-offset-4" href="/">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="underline underline-offset-4" href="/artikel">
                Artikel
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{article.title}</li>
          </ol>
        </nav>
        <header className="mt-8 border-b border-[var(--mk-border)] pb-7">
          <p className="text-sm font-semibold text-[var(--mk-primary-ink)]">
            {article.category}
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.035em] sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--mk-text-2)]">
            {article.introduction}
          </p>
          {article.author ? (
            <p className="mt-4 text-sm text-[var(--mk-text-3)]">
              Ditulis oleh{' '}
              {article.author.url ? (
                <a
                  className="underline underline-offset-4"
                  href={article.author.url}
                >
                  {article.author.name}
                </a>
              ) : (
                article.author.name
              )}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-[var(--mk-text-3)]">
            Terbit{' '}
            <time dateTime={article.publishedAt}>
              {new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'long',
                timeZone: 'UTC',
              }).format(new Date(article.publishedAt))}
            </time>
            . Diperbarui{' '}
            <time dateTime={article.updatedAt}>
              {new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'long',
                timeZone: 'UTC',
              }).format(new Date(article.updatedAt))}
            </time>
            .
          </p>
        </header>
        {article.image ? (
          <figure className="mt-8">
            <Image
              alt={article.image.alt}
              className="h-auto w-full rounded-[var(--mk-radius-lg)]"
              height={article.image.height}
              src={article.image.src}
              sizes="(max-width: 768px) 100vw, 768px"
              width={article.image.width}
            />
          </figure>
        ) : null}
        <div className="mt-8 space-y-8 text-base leading-8 text-[var(--mk-text-2)]">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-2xl leading-tight font-bold text-[var(--mk-ink)]">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p className="mb-4 last:mb-0" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          {article.example ? (
            <aside className="rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)] bg-[var(--mk-surface)] p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[var(--mk-ink)]">
                {article.example.title}
              </h2>
              <ul className="mt-3 space-y-1">
                {article.example.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mt-4 font-bold text-[var(--mk-ink)]">
                {article.example.result}
              </p>
              <p className="mt-1 text-sm">{article.example.note}</p>
            </aside>
          ) : null}
          {article.references?.length ? (
            <section
              aria-labelledby="referensi-title"
              className="border-t border-[var(--mk-border)] pt-6"
            >
              <h2
                className="mb-3 text-xl font-bold text-[var(--mk-ink)]"
                id="referensi-title"
              >
                Bacaan terkait
              </h2>
              <ul className="list-disc space-y-2 pl-6">
                {article.references.map((reference) => (
                  <li key={reference.href}>
                    <a
                      className="underline underline-offset-4"
                      href={reference.href}
                      rel="external noopener noreferrer"
                    >
                      {reference.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <section className="mt-10 rounded-[var(--mk-radius-lg)] bg-[var(--mk-surface)] p-5 sm:p-6">
          <h2 className="text-xl font-bold">Coba hitung dengan angkamu</h2>
          <p className="mt-2 leading-7 text-[var(--mk-text-2)]">
            Kalkulator ini bisa dipakai tanpa akun. Masuk bila ingin menyimpan
            harga bahan dan resep.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
            <Link
              className="inline-flex min-h-11 items-center font-semibold text-[var(--mk-primary-ink)] underline underline-offset-4"
              href={article.calculator.href}
            >
              {article.calculator.label}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center font-semibold text-[var(--mk-primary-ink)] underline underline-offset-4"
              href="/masuk"
            >
              Masuk untuk menyimpan resep
            </Link>
          </div>
        </section>
        {relatedArticles.length ? (
          <nav
            aria-label="Artikel terkait"
            className="mt-10 border-t border-[var(--mk-border)] pt-7"
          >
            <h2 className="text-xl font-bold">Artikel terkait</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {relatedArticles.map((related) => (
                <li key={related.slug}>
                  <Link
                    className="font-semibold text-[var(--mk-primary-ink)] underline underline-offset-4"
                    href={`/artikel/${related.slug}`}
                  >
                    {related.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </article>
    </>
  );
}
