'use client';

import { PRICING } from '@takaran/schema';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import {
  type BillingStatus,
  billingStatus,
  startCheckout,
} from '@/app/(app)/dashboard/beli/actions';
import { useSnapshot } from '@/components/takaran/data-provider';
import { Field, fieldProps } from '@/components/takaran/field';
import { Page, PageTitle } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

const benefits = [
  'Resep tanpa batas',
  'Sub-resep untuk adonan dasar',
  'Semua saluran jual',
  'Penawaran pesanan custom',
  'Gambar daftar harga tanpa tanda',
  'Fitur baru berikutnya tanpa biaya tambahan',
];

export function BeliScreen() {
  const { settings } = useSnapshot();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [whatsapp, setWhatsapp] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!businessName.trim()) next.businessName = 'Nama usaha wajib diisi.';
    if (!/^\+?[\d\s()-]{8,32}$/.test(whatsapp.trim()))
      next.whatsapp = 'Masukkan nomor WhatsApp Indonesia.';
    if (!consent) next.consent = 'Centang persetujuan untuk melanjutkan.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setNotice('Membuka pembayaran…');
    try {
      const result = await startCheckout({ businessName, whatsapp, consent });
      if (result.ok) {
        window.location.assign(result.paymentUrl);
        return;
      }
      setNotice(result.message);
    } catch {
      setNotice('Belum terkirim. Periksa sinyal lalu coba lagi.');
    }
    setBusy(false);
  }

  if (status?.pro)
    return (
      <Page className="grid max-w-2xl gap-4">
        <PageTitle>Takaran Pro aktif</PageTitle>
        <p>Terima kasih. Semua fitur Pro di akunmu sudah terbuka.</p>
        <Button asChild className="w-fit">
          <Link href="/dashboard/resep">Kembali ke resep</Link>
        </Button>
      </Page>
    );

  const price = status?.price ?? PRICING.pro.founderIdr;
  return (
    <Page className="grid max-w-2xl gap-6">
      <div>
        <PageTitle>Takaran Pro</PageTitle>
        <p className="mt-2 text-muted-foreground">
          Sekali bayar, tanpa langganan.
        </p>
      </div>
      <section
        aria-label="Isi paket Pro"
        className="grid gap-3 rounded-[20px] border border-line bg-surface p-5"
      >
        <p className="font-display text-5xl font-bold">{formatRupiah(price)}</p>
        {price < PRICING.pro.idr ? (
          <p className="text-sm text-muted-foreground">
            Harga pendiri untuk {PRICING.pro.founderLimit} pembeli pertama.
            Setelah itu {formatRupiah(PRICING.pro.idr)}.
          </p>
        ) : null}
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
          <Button asChild variant="outline" className="w-fit">
            <a href={status.pendingUrl}>Lanjutkan pembayaran</a>
          </Button>
        </section>
      ) : null}
      <form className="grid gap-4" onSubmit={submit} noValidate>
        <Field id="beli-usaha" label="Nama usaha" error={errors.businessName}>
          <Input
            {...fieldProps('beli-usaha', errors.businessName)}
            maxLength={120}
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
          />
        </Field>
        <Field
          id="beli-wa"
          label="Nomor WhatsApp"
          error={errors.whatsapp}
          hint="Dipakai Mayar untuk bukti pembayaran."
        >
          <Input
            {...fieldProps('beli-wa', errors.whatsapp, 'hint')}
            inputMode="tel"
            autoComplete="tel"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </Field>
        <div className="grid gap-1">
          <label className="flex min-h-11 items-start gap-3">
            <Checkbox
              className="mt-1"
              checked={consent}
              aria-invalid={errors.consent ? true : undefined}
              onCheckedChange={(checked) => setConsent(checked === true)}
            />
            <span>
              Saya setuju nama, email akun, dan nomor WhatsApp dipakai untuk
              memproses pembayaran ini. Lihat{' '}
              <Link
                href="/kebijakan-privasi"
                className="underline underline-offset-4"
              >
                kebijakan privasi
              </Link>
              .
            </span>
          </label>
          {errors.consent ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.consent}
            </p>
          ) : null}
        </div>
        {notice ? <output className="text-sm">{notice}</output> : null}
        <Button type="submit" size="lg" disabled={busy}>
          Bayar dengan Mayar
        </Button>
      </form>
    </Page>
  );
}
