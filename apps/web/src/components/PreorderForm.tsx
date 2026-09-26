import { preorderSchema } from '@takaran/schema';
import { Button } from '@takaran/ui';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { track } from '../lib/analytics';

type Turnstile = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

interface PreorderFormProps {
  apiBaseUrl: string;
  siteKey: string;
}

export default function PreorderForm({
  apiBaseUrl,
  siteKey,
}: PreorderFormProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    kind: 'status' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!siteKey) {
      setNotice({
        kind: 'error',
        message: 'Formulir belum bisa dimuat. Coba lagi nanti.',
      });
      return;
    }
    let disposed = false;
    const renderWidget = () => {
      if (disposed || !widgetRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token) => setTurnstileToken(token),
        'error-callback': () => {
          setTurnstileToken('');
          setNotice({
            kind: 'error',
            message:
              'Pemeriksaan keamanan gagal dimuat. Coba muat ulang halaman.',
          });
        },
        'expired-callback': () => setTurnstileToken(''),
      });
    };
    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (window.turnstile) renderWidget();
    else if (script)
      script.addEventListener('load', renderWidget, { once: true });
    else {
      script = document.createElement('script');
      script.id = scriptId;
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderWidget, { once: true });
      script.addEventListener(
        'error',
        () =>
          setNotice({
            kind: 'error',
            message:
              'Pemeriksaan keamanan gagal dimuat. Coba muat ulang halaman.',
          }),
        { once: true },
      );
      document.head.append(script);
    }
    return () => {
      disposed = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
    };
  }, [siteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!navigator.onLine) {
      setNotice({
        kind: 'error',
        message: 'Kamu sedang offline. Isianmu tetap tersimpan di halaman ini.',
      });
      return;
    }
    if (!turnstileToken || !apiBaseUrl) {
      setNotice({
        kind: 'error',
        message: 'Pemeriksaan keamanan belum siap. Coba muat ulang halaman.',
      });
      return;
    }
    setSubmitting(true);
    setNotice({ kind: 'status', message: 'Mengirim…' });
    try {
      const data = new FormData(event.currentTarget);
      const params = new URLSearchParams(window.location.search);
      const sourceValue =
        params.get('utm_source') || params.get('ref') || 'langsung';
      const source = /^[\p{L}\p{N}_-]{1,64}$/u.test(sourceValue)
        ? sourceValue
        : 'lainnya';
      const payload = {
        businessName: String(data.get('businessName') ?? ''),
        whatsapp: String(data.get('whatsapp') ?? ''),
        productType: String(data.get('productType') ?? ''),
        consent: data.get('consent') === 'on',
        turnstileToken,
        source,
      };
      const parsed = preorderSchema.safeParse(payload);
      if (!parsed.success) {
        setNotice({
          kind: 'error',
          message: 'Periksa lagi isian dan persetujuanmu.',
        });
        return;
      }
      const response = await fetch(
        `${apiBaseUrl.replace(/\/$/, '')}/v1/preorders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        },
      );
      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const code =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'object' &&
          result.error !== null &&
          'code' in result.error
            ? result.error.code
            : '';
        const message =
          code === 'RATE_LIMITED'
            ? 'Batas daftar tunggu tercapai. Coba lagi satu jam lagi.'
            : code === 'TURNSTILE_FAILED'
              ? 'Pemeriksaan keamanan gagal. Coba kirim lagi.'
              : 'Belum terkirim. Periksa isian dan coba lagi.';
        setNotice({ kind: 'error', message });
        setTurnstileToken('');
        window.turnstile?.reset(widgetId.current ?? '');
        return;
      }
      track('preorder_submitted', { source });
      setNotice({
        kind: 'status',
        message:
          'Terima kasih. Kami akan mengabari soal Takaran lewat WhatsApp.',
      });
    } catch {
      setNotice({
        kind: 'error',
        message: navigator.onLine
          ? 'Belum terkirim. Periksa sinyal lalu coba lagi.'
          : 'Kamu sedang offline. Isianmu tetap tersimpan di halaman ini.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="preorder-form" onSubmit={handleSubmit}>
      <label>
        Nama usaha
        <input
          autoComplete="organization"
          maxLength={120}
          name="businessName"
          required
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
        Jenis jualan
        <select name="productType" required defaultValue="">
          <option disabled value="">
            Pilih jenis jualan
          </option>
          <option value="kue">Kue</option>
          <option value="frozen">Frozen food</option>
          <option value="katering">Katering</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </label>
      <label className="preorder-form__consent">
        <input name="consent" required type="checkbox" />
        <span>
          Nomor ini hanya dipakai untuk mengabari soal Takaran.{' '}
          <a href="/kebijakan-privasi/">Baca kebijakan privasi</a>.
        </span>
      </label>
      <div className="preorder-form__turnstile" ref={widgetRef} />
      {notice ? (
        <output
          aria-live="polite"
          className={`preorder-form__notice preorder-form__notice--${notice.kind}`}
        >
          {notice.message}
        </output>
      ) : null}
      <Button disabled={submitting || !turnstileToken} type="submit">
        {submitting ? 'Mengirim' : 'Daftar gratis'}
      </Button>
    </form>
  );
}
