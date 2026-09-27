'use client';

import { type FormEvent, useState } from 'react';
import { Field, fieldProps } from '@/components/takaran/field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const messages: Record<string, string> = {
  RATE_LIMITED: 'Batas daftar tunggu tercapai. Coba lagi satu jam lagi.',
  VALIDATION_FAILED: 'Periksa lagi isian dan persetujuanmu.',
};

export function WaitlistForm() {
  const [productType, setProductType] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{
    kind: 'status' | 'error';
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const businessName = String(data.get('businessName') ?? '').trim();
    const whatsapp = String(data.get('whatsapp') ?? '').trim();
    const next: Record<string, string> = {};
    if (!businessName) next.businessName = 'Nama usaha wajib diisi.';
    if (!whatsapp) next.whatsapp = 'Nomor WhatsApp wajib diisi.';
    if (!productType) next.productType = 'Pilih jenis jualan.';
    if (!consent) next.consent = 'Centang persetujuan untuk melanjutkan.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const params = new URLSearchParams(window.location.search);
    const sourceValue =
      params.get('utm_source') || params.get('ref') || 'langsung';
    const source = /^[\p{L}\p{N}_-]{1,64}$/u.test(sourceValue)
      ? sourceValue
      : 'lainnya';
    setSubmitting(true);
    setNotice({ kind: 'status', text: 'Mengirim…' });
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          whatsapp,
          productType,
          consent: true,
          website: String(data.get('website') ?? ''),
          source,
        }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: { code?: string; message?: string };
        } | null;
        setNotice({
          kind: 'error',
          text:
            result?.error?.message ??
            messages[result?.error?.code ?? ''] ??
            'Belum terkirim. Periksa isian dan coba lagi.',
        });
        return;
      }
      setNotice({
        kind: 'status',
        text: 'Terima kasih. Kami akan mengabari soal Takaran lewat WhatsApp.',
      });
    } catch {
      setNotice({
        kind: 'error',
        text: 'Belum terkirim. Periksa sinyal lalu coba lagi.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-4 rounded-xl bg-card p-5 sm:p-6"
    >
      {/* Kolom jebakan bot: tersembunyi dari pengguna dan pembaca layar. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          Jangan diisi
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field id="wl-usaha" label="Nama usaha" error={errors.businessName}>
        <Input
          {...fieldProps('wl-usaha', errors.businessName)}
          name="businessName"
          autoComplete="organization"
          maxLength={120}
        />
      </Field>
      <Field id="wl-wa" label="Nomor WhatsApp" error={errors.whatsapp}>
        <Input
          {...fieldProps('wl-wa', errors.whatsapp)}
          name="whatsapp"
          autoComplete="tel"
          inputMode="tel"
          maxLength={32}
        />
      </Field>
      <Field id="wl-jenis" label="Jenis jualan" error={errors.productType}>
        <Select value={productType} onValueChange={setProductType}>
          <SelectTrigger id="wl-jenis" className="w-full">
            <SelectValue placeholder="Pilih jenis jualan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kue">Kue</SelectItem>
            <SelectItem value="frozen">Frozen food</SelectItem>
            <SelectItem value="katering">Katering</SelectItem>
            <SelectItem value="lainnya">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-1">
        <label className="flex min-h-11 items-start gap-3">
          <Checkbox
            className="mt-1"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked === true)}
          />
          <span>
            Nomor ini hanya dipakai untuk mengabari soal Takaran.{' '}
            <a
              href="/kebijakan-privasi"
              className="underline underline-offset-4"
            >
              Baca kebijakan privasi
            </a>
            .
          </span>
        </label>
        {errors.consent ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.consent}
          </p>
        ) : null}
      </div>
      {notice ? (
        <output
          aria-live="polite"
          className={
            notice.kind === 'error' ? 'text-sm text-destructive' : 'text-sm'
          }
        >
          {notice.text}
        </output>
      ) : null}
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Mengirim' : 'Daftar gratis'}
      </Button>
    </form>
  );
}
