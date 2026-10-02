import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { mkButtonClasses } from '@/components/marketing/button-classes';
import { ComparisonRows } from '@/components/marketing/comparison-rows';
import { CostBreakdown } from '@/components/marketing/cost-breakdown';
import { CtaPanel } from '@/components/marketing/cta-panel';
import { DemoCalculator } from '@/components/marketing/demo-calculator';
import { PriceStrip } from '@/components/marketing/price-strip';
import { TrustGrid } from '@/components/marketing/trust-grid';
import { JsonLd } from '@/components/seo/json-ld';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { publicMetadata } from '@/features/seo/metadata';
import { useCases } from '@/features/seo/use-cases';
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
          <figure className="relative m-0 min-h-[200px] overflow-hidden rounded-[var(--mk-radius-xl)] bg-[var(--mk-sand)] lg:min-h-[420px]">
            <Image
              alt="Tangan mengocok adonan di mangkuk kaca, dengan telur, keju, dan buku catatan resep di meja dapur."
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              src="/dapur-kue.png"
            />
          </figure>
        </div>
        <PriceStrip />
      </section>

      <section className="border-y border-[var(--mk-border)] bg-[var(--mk-surface)] px-5 py-14 lg:px-20 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-6">
          <div className="grid gap-4">
            <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.03em] lg:text-[40px] lg:leading-[1.15]">
              Contoh hitungan: modal satu potong brownies
            </h2>
            <p className="text-base leading-[1.6] text-[var(--mk-text-2)] lg:text-[17px]">
              Bahan, gas, dan kemasan dijumlahkan, lalu dibagi 16 potong per
              loyang.
            </p>
            <Link
              className="inline-flex min-h-11 items-center font-semibold text-[var(--mk-primary-ink)] underline underline-offset-4"
              href="/cara-hitung"
            >
              Lihat cara menghitungnya
            </Link>
          </div>
          <CostBreakdown />
        </div>
      </section>

      <section className="px-5 pb-14 lg:px-20 lg:pb-24">
        <div className="mx-auto max-w-5xl border-t border-[var(--mk-border)] pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl leading-tight font-bold tracking-[-0.03em] lg:text-3xl">
                Panduan HPP sesuai jenis usahamu
              </h2>
              <p className="mt-2 leading-7 text-[var(--mk-text-2)]">
                Pilih produk yang kamu jual untuk melihat cara menghitung
                HPP-nya.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center font-semibold text-[var(--mk-primary-ink)] underline underline-offset-4"
              href="/usaha"
            >
              Lihat semua jenis usaha
            </Link>
          </div>
          <nav
            aria-label="Panduan HPP berdasarkan jenis usaha"
            className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2"
          >
            {useCases.slice(0, 6).map(({ slug, title }) => (
              <Link
                className="flex min-h-11 items-center border-b border-[var(--mk-border)] py-2 font-semibold text-[var(--mk-primary-ink)] underline-offset-4 hover:underline"
                href={`/usaha/${slug}`}
                key={slug}
              >
                {title}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t border-[var(--mk-border)] pt-4">
            <p className="text-sm font-semibold">Dasar menghitung harga</p>
            <nav
              aria-label="Artikel dasar perhitungan"
              className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm"
            >
              <Link
                className="min-h-11 inline-flex items-center text-[var(--mk-primary-ink)] underline underline-offset-4"
                href="/artikel/cara-menghitung-hpp-makanan"
              >
                Cara menghitung HPP makanan per porsi
              </Link>
              <Link
                className="min-h-11 inline-flex items-center text-[var(--mk-primary-ink)] underline underline-offset-4"
                href="/artikel/beda-margin-dan-markup"
              >
                Beda margin dan markup
              </Link>
            </nav>
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
