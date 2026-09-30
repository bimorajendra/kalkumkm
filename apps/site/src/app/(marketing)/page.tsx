import type { Metadata } from 'next';
import Link from 'next/link';
import { mkButtonClasses } from '@/components/marketing/button-classes';
import { ComparisonRows } from '@/components/marketing/comparison-rows';
import { CtaPanel } from '@/components/marketing/cta-panel';
import { DemoCalculator } from '@/components/marketing/demo-calculator';
import { PriceStrip } from '@/components/marketing/price-strip';
import { TrustGrid } from '@/components/marketing/trust-grid';
import { JsonLd } from '@/components/seo/json-ld';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { publicMetadata } from '@/features/seo/metadata';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = {
  ...publicMetadata({
    title: 'Takaran, kalkulator HPP usaha makanan rumahan',
    description:
      'Masukkan harga bahan dari struk belanja. Takaran menghitung modal per potong dan harga jual yang tetap untung.',
    path: '/',
  }),
  title: { absolute: 'Takaran, kalkulator HPP usaha makanan rumahan' },
};

export default async function BerandaPage({
  searchParams,
}: {
  searchParams: Promise<{ akun?: string }>;
}) {
  const user = await getSessionUser().catch(() => null);
  const start = user ? '/dashboard' : '/masuk';
  const { akun } = await searchParams;
  const origin = process.env.APP_URL || 'http://localhost:3000';

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Takaran',
          url: origin,
          inLanguage: 'id-ID',
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Takaran',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: origin,
          description:
            'Kalkulator HPP untuk mencatat harga bahan, menyusun resep, dan menghitung harga jual usaha makanan rumahan.',
          inLanguage: 'id-ID',
        }}
      />
      {akun === 'dihapus' ? (
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 lg:px-20">
          <Alert>
            <AlertDescription>
              Akunmu dan semua datanya sudah dihapus.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <section className="grid grid-cols-1 items-center gap-10 px-5 pt-10 pb-14 lg:grid-cols-2 lg:gap-6 lg:px-20 lg:pt-18 lg:pb-24">
        <div className="mk-up flex flex-col">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--mk-primary-ink)] lg:text-sm">
            <span className="size-1.5 rounded-full bg-[var(--mk-primary)]" />
            Kalkulator HPP untuk usaha makanan rumahan
          </span>
          <h1 className="mt-4 text-[40px] leading-[1.12] font-bold tracking-[-0.035em] lg:mt-5 lg:text-[62px] lg:leading-[1.08]">
            Jualan laris, untungnya juga harus{' '}
            <span className="text-[var(--mk-primary-ink)]">jelas.</span>
          </h1>
          <p className="mt-4.5 max-w-[520px] text-base leading-[1.6] text-[var(--mk-text-2)] lg:mt-6 lg:text-[19px]">
            Masukkan harga bahan dari struk belanja. Takaran menghitung modal
            per potong dan harga jual yang tetap untung.
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 lg:mt-9">
            <Link className={mkButtonClasses('primary', 'xl')} href={start}>
              Coba gratis <span aria-hidden="true">→</span>
            </Link>
            <Link
              className={mkButtonClasses('secondary', 'xl')}
              href="/cara-hitung"
            >
              Lihat cara hitung
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-4.5 gap-y-2.5 text-sm font-medium text-[var(--mk-text-2)] lg:mt-8">
            <li className="flex items-center gap-1.5">
              <CheckDot /> Gratis untuk 3 resep
            </li>
            <li className="flex items-center gap-1.5">
              <CheckDot /> Tanpa langganan
            </li>
            <li className="flex items-center gap-1.5">
              <CheckDot /> Nyaman di HP
            </li>
          </ul>
        </div>
        <div className="mk-up">
          <DemoCalculator />
        </div>
      </section>

      <section className="border-y border-[var(--mk-border)] bg-[var(--mk-surface)] px-5 py-14 lg:px-20 lg:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-6">
          <div className="grid gap-4">
            <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
              Kenapa perlu dihitung
            </span>
            <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.03em] lg:text-[40px] lg:leading-[1.15]">
              Hal yang biasanya baru terasa di akhir bulan.
            </h2>
            <p className="text-base leading-[1.6] text-[var(--mk-text-2)] lg:text-[17px]">
              Omzet terlihat ramai, tapi untungnya sering tidak jelas.
            </p>
          </div>
          <ComparisonRows />
        </div>
      </section>

      <section className="flex flex-col gap-8 px-5 py-14 lg:px-20 lg:py-24">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-8">
          <div className="grid content-start gap-8">
            <div className="grid gap-4">
              <span className="text-sm font-semibold text-[var(--mk-primary-ink)]">
                Bisa dipercaya
              </span>
              <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.03em] lg:text-[40px] lg:leading-[1.15]">
                Setiap angka bisa kamu cek sendiri.
              </h2>
            </div>
            <TrustGrid />
          </div>
          <figure
            className="m-0 flex min-h-[200px] items-end rounded-[var(--mk-radius-xl)] bg-[var(--mk-sand)] bg-[repeating-linear-gradient(135deg,#ECE6DE_0_1px,transparent_1px_12px)] p-3 lg:min-h-[420px]"
            style={{ boxSizing: 'border-box' }}
          >
            <figcaption className="rounded-[var(--mk-radius-sm)] bg-[var(--mk-surface)] px-2.5 py-2 text-xs leading-[1.5] text-[var(--mk-text-2)] lg:px-3.5 lg:py-2.5 lg:text-[13px]">
              [Foto] Penjual kue di dapur rumahnya, menimbang bahan.
            </figcaption>
          </figure>
        </div>
        <PriceStrip />
      </section>

      <section className="px-5 pb-14 lg:px-20 lg:pb-24">
        <div className="mx-auto max-w-5xl border-t border-[var(--mk-border)] pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl leading-tight font-bold tracking-[-0.03em] lg:text-3xl">
                Panduan menghitung HPP dan harga jual
              </h2>
              <p className="mt-2 leading-7 text-[var(--mk-text-2)]">
                Baca contoh langkah demi langkah sebelum mencatat resep.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center font-semibold text-[var(--mk-primary-ink)] underline underline-offset-4"
              href="/artikel"
            >
              Semua artikel
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  'Cara menghitung HPP makanan per porsi',
                  '/artikel/cara-menghitung-hpp-makanan',
                ],
                [
                  'Beda margin dan markup saat menentukan harga',
                  '/artikel/beda-margin-dan-markup',
                ],
              ] as const
            ).map(([title, href]) => (
              <Link
                className="rounded-[var(--mk-radius-md)] border border-[var(--mk-border)] bg-[var(--mk-surface)] p-4 font-semibold underline-offset-4 hover:underline"
                href={href}
                key={href}
              >
                {title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-14 lg:px-20 lg:pb-24">
        <CtaPanel
          ctaHref={start}
          ctaLabel="Coba gratis"
          text="Gratis, sekitar 5 menit, cukup dengan akun Google."
          title="Coba hitung satu resep dulu."
        />
      </section>
    </>
  );
}

function CheckDot() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 20 20"
      width="16"
    >
      <circle cx="10" cy="10" fill="var(--mk-success-tint)" r="9" />
      <path
        d="m6 10.2 2.6 2.6L14 7.5"
        stroke="var(--mk-success)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
