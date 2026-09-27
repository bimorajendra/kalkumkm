import {
  checkoutResponseSchema,
  checkoutSchema,
  PRICING,
} from '@takaran/schema';
import { formatRupiah } from '@takaran/ui';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { db } from '../db/db';
import { TurnstileField } from '../features/checkout/turnstile-field';
import { track } from '../lib/analytics';

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY;

const payment = {
  bankName: import.meta.env.VITE_PAYMENT_BANK_NAME?.trim(),
  accountName: import.meta.env.VITE_PAYMENT_ACCOUNT_NAME?.trim(),
  accountNumber: import.meta.env.VITE_PAYMENT_ACCOUNT_NUMBER?.trim(),
  qrisImage: import.meta.env.VITE_PAYMENT_QRIS_IMAGE?.trim(),
  sellerWa: import.meta.env.VITE_SELLER_WA?.replace(/\D/g, ''),
};
const manualReady =
  Object.values(payment).every(Boolean) &&
  Boolean(
    payment.qrisImage?.startsWith('/') && !payment.qrisImage.startsWith('//'),
  );

export default function BeliRoute() {
  const [turnstileToken, setTurnstileToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [turnstileError, setTurnstileError] = useState(false);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [pending, setPending] = useState<{
    orderId: string;
    claimToken: string;
  } | null>(null);

  useEffect(() => {
    void db.settings.get('pendingCheckout').then((row) => {
      const value = row?.value;
      if (
        value &&
        typeof value === 'object' &&
        'orderId' in value &&
        typeof value.orderId === 'string' &&
        'claimToken' in value &&
        typeof value.claimToken === 'string'
      )
        setPending({ orderId: value.orderId, claimToken: value.claimToken });
    });
  }, []);

  const onToken = useCallback((token: string) => setTurnstileToken(token), []);
  const onTurnstileError = useCallback(() => setTurnstileError(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    if (!navigator.onLine) {
      setNotice('Checkout perlu internet. Coba lagi setelah tersambung.');
      return;
    }
    if (!apiBaseUrl || !turnstileToken) {
      setNotice(
        'Pemeriksaan keamanan belum siap. Muat ulang halaman lalu coba lagi.',
      );
      return;
    }
    const form = new FormData(event.currentTarget);
    const parsed = checkoutSchema.safeParse({
      name: form.get('name'),
      email: form.get('email'),
      whatsapp: form.get('whatsapp'),
      businessName: form.get('businessName'),
      consent: form.get('consent') === 'on',
      turnstileToken,
    });
    if (!parsed.success) {
      setNotice('Periksa lagi nama, email, nomor WhatsApp, dan persetujuanmu.');
      return;
    }
    setBusy(true);
    setNotice('Menyiapkan pembayaran…');
    try {
      const response = await fetch(`${apiBaseUrl}/v1/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code =
          body &&
          typeof body === 'object' &&
          'error' in body &&
          body.error &&
          typeof body.error === 'object' &&
          'code' in body.error
            ? body.error.code
            : '';
        setNotice(
          code === 'RATE_LIMITED'
            ? 'Batas checkout tercapai. Coba lagi satu jam lagi.'
            : code === 'TURNSTILE_FAILED'
              ? 'Pemeriksaan keamanan gagal. Coba kirim lagi.'
              : 'Pembayaran belum bisa dibuat. Periksa isian dan coba lagi.',
        );
        setTurnstileToken('');
        setTurnstileReset((current) => current + 1);
        return;
      }
      const result = checkoutResponseSchema.safeParse(body);
      if (!result.success) {
        setNotice('Respons pembayaran tidak terbaca. Coba lagi nanti.');
        return;
      }
      const checkout = result.data.data;
      await db.settings.put({
        key: 'pendingCheckout',
        value: { orderId: checkout.orderId, claimToken: checkout.claimToken },
      });
      setPending({
        orderId: checkout.orderId,
        claimToken: checkout.claimToken,
      });
      track('checkout_started', { plan: 'pro' });
      window.location.assign(checkout.paymentUrl);
    } catch {
      setNotice(
        'Pembayaran belum dibuat. Periksa sinyal lalu coba lagi. Isianmu tetap ada.',
      );
      setTurnstileToken('');
      setTurnstileReset((current) => current + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page settings-page">
      <p className="eyebrow">TAKARAN PRO</p>
      <h1>Lebih leluasa mengelola usaha</h1>
      <section className="settings-card">
        <h2>Pro, sekali bayar</h2>
        <p className="price-status">
          {formatRupiah(PRICING.pro.founderIdr)} untuk{' '}
          {PRICING.pro.founderLimit} pembeli pertama
        </p>
        <p>
          Setelah itu {formatRupiah(PRICING.pro.idr)}. Harga invoice ditentukan
          server.
        </p>
        <p>
          Kontakmu dipakai untuk pesanan dan pengiriman tautan aktivasi. Data
          resep dan harga tetap di perangkat.
        </p>
        <form className="checkout-form" onSubmit={submit}>
          <label>
            Nama
            <input autoComplete="name" maxLength={120} name="name" required />
          </label>
          <label>
            Email
            <input
              autoComplete="email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </label>
          <label>
            Nomor WhatsApp
            <input
              autoComplete="tel"
              inputMode="tel"
              maxLength={32}
              name="whatsapp"
              required
            />
          </label>
          <label>
            Nama usaha
            <input
              autoComplete="organization"
              maxLength={120}
              name="businessName"
              required
            />
          </label>
          <label className="checkout-consent">
            <input name="consent" required type="checkbox" />
            <span>
              Saya setuju data kontak dipakai untuk memproses pesanan dan
              pembayaran melalui Mayar, serta aktivasi lisensi.
            </span>
          </label>
          <TurnstileField
            onError={onTurnstileError}
            onToken={onToken}
            resetSignal={turnstileReset}
            siteKey={siteKey ?? ''}
          />
          {turnstileError ? (
            <p role="alert">
              Pemeriksaan keamanan gagal dimuat. Coba muat ulang halaman.
            </p>
          ) : null}
          {notice ? <output aria-live="polite">{notice}</output> : null}
          <button
            className="button button-primary"
            disabled={busy || !turnstileToken}
            type="submit"
          >
            {busy ? 'Menyiapkan pembayaran' : 'Bayar dengan Mayar'}
          </button>
        </form>
        {pending ? (
          <p>
            Pembayaran sebelumnya belum dicek.{' '}
            <Link to={`/aktivasi?order=${encodeURIComponent(pending.orderId)}`}>
              Cek status pembayaran
            </Link>
          </p>
        ) : null}
      </section>
      {manualReady ? (
        <section className="settings-card">
          <h2>Transfer atau QRIS</h2>
          <p>Jalur cadangan jika kamu tidak bisa memakai Mayar.</p>
          <p>
            Transfer ke {payment.bankName}, atas nama {payment.accountName}.
          </p>
          <p>Nomor rekening {payment.accountNumber}.</p>
          <img
            className="payment-qris"
            alt="Kode QRIS pembayaran Takaran Pro"
            src={payment.qrisImage}
          />
          <a
            className="button"
            href={`https://wa.me/${payment.sellerWa}?text=${encodeURIComponent('Saya sudah membayar Takaran Pro. Mohon bantu aktivasi.')}`}
          >
            Hubungi kami setelah membayar
          </a>
        </section>
      ) : null}
      <section className="settings-card">
        <h2>Sudah punya kode?</h2>
        <p>Aktifkan Takaran Pro tanpa koneksi internet.</p>
        <Link className="button" to="/aktivasi">
          Masukkan kode lisensi
        </Link>
      </section>
    </main>
  );
}
