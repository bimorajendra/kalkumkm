import Link from 'next/link';
import { articles } from '@/features/articles/content';
import { publicMetadata } from '@/features/seo/metadata';

export const metadata = publicMetadata({
  title: 'Artikel HPP dan harga jual makanan',
  description:
    'Panduan praktis menghitung HPP, memahami margin dan markup, serta menentukan harga jual untuk usaha makanan rumahan.',
  path: '/artikel',
});

export default function ArtikelPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-10 lg:py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-[var(--mk-primary-ink)]">
          Panduan Takaran
        </p>
        <h1 className="mt-3 text-4xl leading-tight font-bold tracking-[-0.035em] sm:text-5xl">
          Hitung biaya dan harga jual dengan lebih jelas.
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--mk-text-2)]">
          Langkah dan contoh sederhana untuk membantu usaha makanan rumahan
          memahami modal per porsi.
        </p>
      </header>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <article
            className="flex flex-col rounded-[var(--mk-radius-lg)] border border-[var(--mk-border)] bg-[var(--mk-surface)] p-5"
            key={article.slug}
          >
            <p className="text-sm font-semibold text-[var(--mk-primary-ink)]">
              {article.category}
            </p>
            <h2 className="mt-3 text-xl leading-snug font-bold">
              <Link
                className="underline-offset-4 hover:underline focus-visible:underline"
                href={`/artikel/${article.slug}`}
              >
                {article.title}
              </Link>
            </h2>
            <p className="mt-3 flex-1 leading-7 text-[var(--mk-text-2)]">
              {article.excerpt}
            </p>
            <Link
              className="mt-5 min-h-11 self-start font-semibold text-[var(--mk-primary-ink)] underline underline-offset-4"
              href={`/artikel/${article.slug}`}
            >
              Baca panduan
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
