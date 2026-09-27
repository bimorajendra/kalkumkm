import { PRICING } from '@takaran/schema';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroDemo } from '@/components/landing/hero-demo';
import { WaitlistForm } from '@/components/landing/waitlist-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calculateBrownies } from '@/lib/brownies';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = {
  title: { absolute: 'Takaran · Hitung untung usahamu' },
  description:
    'Hitung HPP, harga jual, dan untung per jam untuk usaha kue dan makanan rumahan.',
};

const before = calculateBrownies(2000, 4000, 5000);
const after = calculateBrownies(2600, 4000, 5000);

const nav = [
  { href: '#cara-hitung', label: 'Cara hitung' },
  { href: '#harga-naik', label: 'Harga bahan naik' },
  { href: '#pesanan-custom', label: 'Pesanan custom' },
  { href: '#harga', label: 'Harga' },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ akun?: string }>;
}) {
  const user = await getSessionUser().catch(() => null);
  const { akun } = await searchParams;
  const start = user ? '/hitung' : '/masuk';
  return (
    <>
      <header className="sticky top-0 z-30 px-4 py-3">
        <div className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full bg-card p-1 pl-5 shadow-floating">
          <a
            href="#awal"
            className="mr-2 font-display text-2xl tracking-tight"
            aria-label="Takaran, ke awal halaman"
          >
            Takaran
          </a>
          <nav
            aria-label="Navigasi utama"
            className="hidden items-center md:flex"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex h-11 items-center rounded-full px-3 hover:bg-secondary"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <Button asChild className="ml-1">
            <Link href={start}>
              {user ? 'Buka kalkulator' : 'Coba hitung resepmu'}
            </Link>
          </Button>
        </div>
      </header>

      <main id="awal">
        {akun === 'dihapus' ? (
          <div className="mx-auto max-w-3xl px-4">
            <Alert>
              <AlertDescription>
                Akunmu dan semua datanya sudah dihapus.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <section
          aria-labelledby="hero-title"
          id="cara-hitung"
          className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20"
        >
          <div className="grid content-start gap-5">
            <p className="text-muted-foreground">Buat usaha rumahan</p>
            <h1
              id="hero-title"
              className="text-[44px] leading-[46px] lg:text-[64px] lg:leading-[64px]"
            >
              Laris, tapi uangnya nggak kelihatan?
            </h1>
            <p className="max-w-prose text-lg">
              Masukkan harga bahan dari struk belanja, lalu lihat HPP (modal per
              potong), harga jual, dan untung per loyang.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <a href="#demo">Hitung HPP brownies-mu</a>
              </Button>
              <a
                href="#harga"
                className="min-h-11 py-2 text-link underline underline-offset-4"
              >
                Lihat harga Pro
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Contoh resep brownies. Hitungannya jalan langsung di halaman ini.
            </p>
          </div>
          <div id="demo">
            <HeroDemo />
          </div>
        </section>

        <section
          aria-labelledby="rise-title"
          id="harga-naik"
          className="bg-card py-[72px]"
        >
          <div className="mx-auto grid max-w-[1120px] gap-4 px-4 lg:px-8">
            <p className="text-muted-foreground">Contoh hitungan</p>
            <h2
              id="rise-title"
              className="text-[34px] leading-[38px] lg:text-[44px] lg:leading-[48px]"
            >
              Telur naik Rp 600. Brownies-mu masih untung?
            </h2>
            <p>
              Harga jual tetap Rp 5.000 per potong. Lihat perubahan HPP dan
              margin dari resep contoh.
            </p>
            <div className="min-w-0">
              <Table>
                <TableCaption className="sr-only">
                  Perubahan biaya saat harga telur naik dari Rp 2.000 ke Rp
                  2.600 per butir.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Kondisi</TableHead>
                    <TableHead scope="col">Harga telur</TableHead>
                    <TableHead scope="col">HPP per potong</TableHead>
                    <TableHead scope="col">Margin di harga Rp 5.000</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableHead scope="row">Sebelum</TableHead>
                    <TableCell>Rp 2.000</TableCell>
                    <TableCell>{formatRupiah(before.hpp)}</TableCell>
                    <TableCell>{formatPercent(before.marginBp)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead scope="row">Sesudah</TableHead>
                    <TableCell>Rp 2.600</TableCell>
                    <TableCell>{formatRupiah(after.hpp)}</TableCell>
                    <TableCell
                      className={
                        after.marginBp < 4000
                          ? 'font-semibold text-destructive'
                          : ''
                      }
                    >
                      {formatPercent(after.marginBp)}
                      {after.marginBp < 4000 ? ' · di bawah target 40%' : ''}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="hour-title"
          className="mx-auto grid max-w-3xl justify-items-center gap-3 px-4 py-[112px] text-center"
        >
          <p className="text-muted-foreground">Brownies · 1,5 jam per loyang</p>
          <h2
            id="hour-title"
            className="text-[34px] leading-[38px] lg:text-[44px] lg:leading-[48px]"
          >
            Untungmu per jam
          </h2>
          <p className="font-display text-[52px] leading-[54px] lg:text-[72px] lg:leading-[72px]">
            {before.profitPerHour
              ? formatRupiah(before.profitPerHour)
              : 'Belum dihitung'}{' '}
            <span className="text-2xl">/ jam</span>
          </p>
          <p className="max-w-prose">
            Sesudah biaya bahan, energi, dan kemasan, resep contoh ini
            menyisakan untung sekitar segitu untuk setiap jam kerja.
          </p>
        </section>

        <section
          aria-labelledby="custom-title"
          id="pesanan-custom"
          className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-16 lg:px-8"
        >
          <div className="grid gap-3 lg:order-2">
            <p className="text-muted-foreground">Untuk pesanan khusus</p>
            <h2
              id="custom-title"
              className="text-[34px] leading-[38px] lg:text-[44px] lg:leading-[48px]"
            >
              Ukuran dan hiasan ikut dihitung.
            </h2>
            <p>
              Tambahkan pilihan seperti topper atau tulisan. Lihat total harga
              dan untung sebelum mengirim penawaran.
            </p>
          </div>
          <figure
            aria-label="Contoh penawaran, bukan pesanan nyata"
            className="grid gap-2 rounded-xl border border-dashed border-input bg-card p-6 lg:order-1"
          >
            <p className="text-sm text-muted-foreground">Contoh penawaran</p>
            <h3 className="font-display text-3xl">Brownies ulang tahun</h3>
            <dl className="grid gap-1">
              <div className="flex justify-between">
                <dt>20 potong</dt>
                <dd>Rp 100.000</dd>
              </div>
              <div className="flex justify-between">
                <dt>Topper nama</dt>
                <dd>+ Rp 15.000</dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>Total contoh</dt>
                <dd>Rp 115.000</dd>
              </div>
            </dl>
            <span className="text-sm text-muted-foreground">
              Angka ilustrasi, bukan harga atau pesanan pelanggan.
            </span>
          </figure>
        </section>

        <section
          aria-labelledby="price-title"
          id="harga"
          className="bg-secondary py-[112px]"
        >
          <div className="mx-auto grid max-w-[1120px] gap-6 px-4 lg:px-8">
            <p className="text-muted-foreground">Pilih sesuai kebutuhan</p>
            <h2
              id="price-title"
              className="text-[34px] leading-[38px] lg:text-[44px] lg:leading-[48px]"
            >
              Mulai gratis. Buka lebih banyak saat siap.
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <article className="grid content-start gap-3 rounded-xl bg-card p-6">
                <h3 className="text-xl font-semibold">Gratis</h3>
                <p className="font-display text-5xl">Rp 0</p>
                <ul className="grid list-disc gap-1 pl-5">
                  <li>Simpan sampai 3 resep</li>
                  <li>1 saluran jual</li>
                  <li>Hitung HPP dan harga jual</li>
                  <li>Alarm saat harga bahan naik</li>
                </ul>
                <Button asChild variant="outline" size="lg">
                  <Link href={start}>Coba hitung resep</Link>
                </Button>
              </article>
              <article className="grid content-start gap-3 rounded-xl bg-card p-6 ring-2 ring-foreground">
                <h3 className="text-xl font-semibold">Pro</h3>
                <p className="font-display text-5xl">
                  {formatRupiah(PRICING.pro.idr)}{' '}
                  <span className="text-lg">sekali bayar</span>
                </p>
                <p>
                  Harga pendiri {formatRupiah(PRICING.pro.founderIdr)} untuk{' '}
                  {PRICING.pro.founderLimit} pembeli pertama.
                </p>
                <ul className="grid list-disc gap-1 pl-5">
                  <li>Resep tanpa batas dan sub-resep</li>
                  <li>Semua saluran jual</li>
                  <li>Penawaran custom dan gambar daftar harga</li>
                  <li>Pembaruan fitur tanpa biaya tambahan</li>
                </ul>
                <Button asChild size="lg">
                  <Link href={user ? '/beli' : '/masuk'}>
                    Masuk dan beli Pro
                  </Link>
                </Button>
              </article>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="preorder-title"
          id="daftar-tunggu"
          className="mx-auto grid max-w-[1120px] gap-8 px-4 py-[72px] lg:grid-cols-2 lg:gap-16 lg:px-8"
        >
          <div className="grid content-start gap-3">
            <p className="text-muted-foreground">Belum siap mencoba?</p>
            <h2
              id="preorder-title"
              className="text-[34px] leading-[38px] lg:text-[44px] lg:leading-[48px]"
            >
              Kabari aku soal Takaran.
            </h2>
            <p>Daftar gratis. Kami hanya menghubungimu soal Takaran.</p>
          </div>
          <WaitlistForm />
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-8 lg:px-8">
        <a href="#awal" className="font-display text-2xl">
          Takaran
        </a>
        <p className="text-sm text-muted-foreground">
          Resep dan harga bahanmu tersimpan di akunmu dan hanya bisa dibuka
          olehmu.
        </p>
        <Link
          href="/kebijakan-privasi"
          className="min-h-11 py-2 underline underline-offset-4"
        >
          Kebijakan privasi
        </Link>
      </footer>
    </>
  );
}
