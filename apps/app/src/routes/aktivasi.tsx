import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { db } from '../db/db';
import { getLicenseCode } from '../features/license/record';
import { verifyLicenseCode } from '../features/license/verify';
import { getSetting, setSetting } from '../features/settings/repository';
import { track } from '../lib/analytics';

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function AktivasiRoute() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  const activate = useCallback(async (value: string): Promise<boolean> => {
    const pasted = value.trim();
    const normalized = (
      pasted.includes('#') ? pasted.slice(pasted.lastIndexOf('#') + 1) : pasted
    ).replace(/[\s\r\n]/g, '');
    if (!normalized) return false;
    setBusy(true);
    setMessage('');
    try {
      const payload = await verifyLicenseCode(normalized);
      const previous = await db.settings.get('license');
      const previousLicense = previous?.value;
      const previousCode = getLicenseCode(previousLicense);
      const isSameLicense =
        previousCode === normalized && typeof previousLicense === 'object';
      await db.settings.put({
        key: 'license',
        value: isSameLicense
          ? previousLicense
          : {
              code: normalized,
              payload,
              activatedAt: new Date().toISOString(),
            },
      });
      if (previousCode !== normalized) track('license_activated', {});
      setMessage(`Takaran Pro aktif. Terima kasih, ${payload.n}.`);
      return true;
    } catch {
      setMessage(
        'Kode tidak cocok. Periksa lagi atau hubungi kami lewat WhatsApp.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order');
    if (!orderId) return;
    let active = true;
    async function poll() {
      if (!apiBaseUrl) {
        setPaymentMessage(
          'Pengecekan pembayaran belum tersedia. Coba lagi nanti.',
        );
        return;
      }
      const pending = await getSetting('pendingCheckout');
      if (!active) return;
      if (!pending || pending.orderId !== orderId) {
        setPaymentMessage('Data checkout tidak ditemukan di perangkat ini.');
        return;
      }
      setPaymentMessage('Memeriksa status pembayaran…');
      const startedAt = Date.now();
      while (active && Date.now() - startedAt < 120_000) {
        try {
          const response = await fetch(
            `${apiBaseUrl}/v1/checkout/${encodeURIComponent(orderId)}/license`,
            { headers: { 'X-Claim-Token': pending.claimToken } },
          );
          if (response.status === 404) {
            setPaymentMessage(
              'Pesanan tidak ditemukan. Periksa perangkat yang dipakai saat checkout.',
            );
            return;
          }
          const result: unknown = await response.json();
          if (
            result &&
            typeof result === 'object' &&
            'data' in result &&
            result.data &&
            typeof result.data === 'object' &&
            'code' in result.data &&
            typeof result.data.code === 'string'
          ) {
            const activated = await activate(result.data.code);
            if (activated && active) {
              await setSetting('pendingCheckout', null);
              track('checkout_paid', { plan: 'pro' });
              setPaymentMessage(
                'Pembayaran terkonfirmasi. Takaran Pro aktif di perangkat ini.',
              );
              window.history.replaceState(
                window.history.state,
                '',
                `${window.location.pathname}${window.location.hash}`,
              );
              return;
            }
          }
        } catch {
          // Percobaan berikutnya tetap memakai token lokal saat jaringan pulih.
        }
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
      }
      if (active)
        setPaymentMessage(
          'Pembayaran belum terkonfirmasi. Kami cek lagi otomatis saat kamu membuka aplikasi.',
        );
    }
    void poll();
    return () => {
      active = false;
    };
  }, [activate]);

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (!fragment) return;
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
    setCode(fragment);
    void activate(fragment);
  }, [activate]);

  return (
    <main className="page settings-page">
      <p className="eyebrow">TAKARAN PRO</p>
      <h1>Aktifkan lisensi</h1>
      <p>
        Tempel tautan aktivasi atau kode lisensi. Verifikasi bekerja tanpa
        internet.
      </p>
      <form
        className="settings-card"
        onSubmit={(event) => {
          event.preventDefault();
          void activate(code);
        }}
      >
        <label htmlFor="license-code">Kode lisensi</label>
        <textarea
          className="license-code"
          autoCapitalize="off"
          autoComplete="off"
          id="license-code"
          onChange={(event) => setCode(event.target.value)}
          rows={5}
          value={code}
        />
        <button
          className="button button-primary"
          disabled={busy || !code.trim()}
          type="submit"
        >
          {busy ? 'Memeriksa…' : 'Aktifkan Pro'}
        </button>
        {message ? <output aria-live="polite">{message}</output> : null}
      </form>
      {paymentMessage ? (
        <p aria-live="polite" className="payment-status">
          {paymentMessage}
        </p>
      ) : null}
      <p>
        <Link to="/beli">Kembali ke halaman Pro</Link>
      </p>
    </main>
  );
}
