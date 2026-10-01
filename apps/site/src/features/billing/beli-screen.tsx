'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  type BillingStatus,
  billingStatus,
} from '@/app/(app)/dashboard/beli/actions';
import { useSnapshot } from '@/components/takaran/data-provider';
import { Page, PageTitle } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';

const benefits = [
  'Resep tanpa batas',
  'Sub-resep untuk adonan dasar',
  'Semua saluran jual',
  'Penawaran pesanan custom',
  'Gambar daftar harga tanpa tanda',
  'Fitur baru berikutnya tanpa biaya tambahan',
];

export function BeliScreen() {
  const { plan } = useSnapshot();
  const [status, setStatus] = useState<BillingStatus | null>(null);

  // Cek status saat dibuka, lalu tiap 5 detik selama ada pesanan menunggu.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      try {
        const next = await billingStatus();
        if (!active) return;
        setStatus(next);
        if (next && !next.pro && next.pendingUrl)
          timer = setTimeout(poll, 5000);
      } catch {
        if (active) timer = setTimeout(poll, 15000);
      }
    }
    void poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (plan === 'pro' || status?.pro)
    return (
      <Page className="grid max-w-2xl gap-4">
        <PageTitle>Takaran Pro aktif</PageTitle>
        <p>Terima kasih. Semua fitur Pro di akunmu sudah terbuka.</p>
        <Button asChild className="w-fit">
          <Link href="/dashboard/resep">Kembali ke resep</Link>
        </Button>
      </Page>
    );

  return (
    <Page className="grid max-w-2xl gap-6">
      <div>
        <PageTitle>Takaran Pro segera hadir</PageTitle>
        <p className="mt-2 text-muted-foreground">
          Pembelian belum dibuka. Kamu tetap bisa memakai paket Gratis untuk 3
          resep.
        </p>
      </div>
      <section
        aria-label="Isi paket Pro"
        className="grid gap-3 rounded-[20px] border border-line bg-surface p-5"
      >
        <h2 className="text-xl font-semibold">Fitur dalam paket Pro</h2>
        <ul className="grid list-disc gap-1 pl-5">
          {benefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      {status?.pendingUrl ? (
        <section
          aria-live="polite"
          className="grid gap-3 rounded-[20px] border border-line bg-surface p-5"
        >
          <h2 className="text-xl font-semibold">
            Pembayaran belum terkonfirmasi
          </h2>
          <p>
            Bila sudah membayar, Pro terbuka otomatis dalam beberapa saat.
            Halaman ini mengecek sendiri.
          </p>
        </section>
      ) : null}
      <Button asChild className="w-fit">
        <Link href="/dashboard/resep">Kembali ke resep</Link>
      </Button>
    </Page>
  );
}
