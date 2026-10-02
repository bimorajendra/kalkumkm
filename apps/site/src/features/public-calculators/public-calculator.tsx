'use client';

import {
  actualMarginBp,
  markupBp,
  profitPerPortion,
  suggestPrice,
} from '@takaran/calc';
import { breakEvenUnits, hppFromCosts } from '@takaran/calc/public-pricing';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import Big from 'big.js';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { usePublicAnalytics } from '@/components/analytics/public-events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type CalculatorExample,
  calculatorExamples,
  calculatorLinks,
  calculatorNotes,
  type PublicCalculatorMode,
} from './content';

const labels: Record<
  PublicCalculatorMode,
  { title: string; description: string }
> = {
  hpp: {
    title: 'Hitung HPP makanan',
    description:
      'Masukkan biaya satu adonan, jumlah hasil, dan biaya kemasan per porsi.',
  },
  margin: {
    title: 'Hitung margin keuntungan',
    description: 'Lihat sisa keuntungan setelah HPP dan komisi saluran jual.',
  },
  bep: {
    title: 'Hitung titik impas',
    description:
      'Cari jumlah unit untuk menutup biaya tetap dengan harga dan biaya variabel per unit.',
  },
  price: {
    title: 'Hitung harga jual',
    description:
      'Cari harga jual berdasarkan HPP, target margin, dan pembulatan.',
  },
  ojol: {
    title: 'Hitung harga jual untuk ojol',
    description:
      'Sesuaikan harga dengan komisi platform agar target margin tetap tercapai.',
  },
};

const fields: Record<
  PublicCalculatorMode,
  Array<{ key: string; label: string; hint?: string }>
> = {
  hpp: [
    { key: 'material', label: 'Total biaya bahan satu adonan (Rp)' },
    {
      key: 'production',
      label: 'Biaya produksi lain satu adonan (Rp)',
      hint: 'Contoh: gas, listrik, atau tenaga kerja.',
    },
    { key: 'yield', label: 'Jumlah porsi yang dihasilkan' },
    { key: 'packaging', label: 'Biaya kemasan per porsi (Rp)' },
  ],
  margin: [
    { key: 'hpp', label: 'HPP per porsi (Rp)' },
    { key: 'price', label: 'Harga jual per porsi (Rp)' },
    { key: 'commission', label: 'Komisi saluran jual (%)' },
  ],
  bep: [
    { key: 'fixed', label: 'Biaya tetap yang ingin ditutup (Rp)' },
    { key: 'hpp', label: 'Biaya variabel per unit / HPP (Rp)' },
    { key: 'price', label: 'Harga jual per unit (Rp)' },
    { key: 'commission', label: 'Komisi saluran jual (%)' },
  ],
  price: [
    { key: 'hpp', label: 'HPP per porsi (Rp)' },
    { key: 'margin', label: 'Target margin (%)' },
    { key: 'rounding', label: 'Pembulatan harga (Rp)' },
  ],
  ojol: [
    { key: 'hpp', label: 'HPP per porsi (Rp)' },
    { key: 'margin', label: 'Target margin (%)' },
    { key: 'commission', label: 'Komisi ojol (%)' },
    { key: 'rounding', label: 'Pembulatan harga (Rp)' },
  ],
};

function wholeRupiah(raw: string, label: string, unit = 'rupiah bulat'): Big {
  if (!/^\d+$/.test(raw.trim()))
    throw new Error(`${label} harus berupa ${unit}.`);
  const value = new Big(raw.trim());
  if (!Number.isSafeInteger(value.toNumber()))
    throw new Error(`${label} melebihi batas angka yang aman.`);
  return value;
}

function basisPoints(raw: string, label: string): number {
  if (!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(raw.trim()))
    throw new Error(`${label} harus berupa angka 0 sampai 99,99.`);
  const value = new Big(raw.trim().replace(',', '.'));
  if (value.lt(0) || value.gte(100))
    throw new Error(`${label} harus kurang dari 100%.`);
  return value.times(100).round(0, Big.roundHalfUp).toNumber();
}

export function PublicCalculator({
  mode,
  example = calculatorExamples[mode],
  embedded = false,
}: {
  mode: PublicCalculatorMode;
  example?: CalculatorExample;
  embedded?: boolean;
}) {
  const track = usePublicAnalytics(mode);
  const id = useId();
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [manualCopy, setManualCopy] = useState('');
  const [sharing, setSharing] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const config = labels[mode];
  const Heading = embedded ? 'h2' : 'h1';
  const Subheading = embedded ? 'h3' : 'h2';
  useEffect(() => setCanShare(typeof navigator.share === 'function'), []);

  function clearResult() {
    setResult([]);
    setError('');
    setShareMessage('');
    setManualCopy('');
  }

  async function share(copy: boolean) {
    const url = new URL(window.location.pathname, window.location.origin).href;
    const text = `${config.title}\n${result.join('\n')}\n\nDihitung dengan Takaran\n${url}`;
    setSharing(true);
    setShareMessage('');
    setManualCopy('');
    try {
      if (copy) {
        await navigator.clipboard.writeText(text);
        setShareMessage('Hasil hitung tersalin. Tempel ke pesanmu.');
      } else {
        await navigator.share({ title: config.title, text });
        setShareMessage('Hasil hitung sudah dibagikan.');
      }
      track('calculator_share');
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      setShareMessage(
        copy
          ? 'Salin teks hasil dari kolom di bawah.'
          : 'Belum bisa dibagikan. Gunakan Salin hasil hitung.',
      );
      if (copy) setManualCopy(text);
    } finally {
      setSharing(false);
    }
  }

  function calculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearResult();
    try {
      const get = (key: string) => values[key] ?? '';
      const money = (key: string, label: string) =>
        wholeRupiah(get(key), label);
      const pct = (key: string, label: string) => basisPoints(get(key), label);
      let lines: string[];
      if (mode === 'hpp') {
        const hpp = hppFromCosts(
          money('material', 'Biaya bahan'),
          money('production', 'Biaya produksi'),
          money('packaging', 'Biaya kemasan'),
          wholeRupiah(
            get('yield'),
            'Jumlah porsi',
            'bilangan bulat',
          ).toNumber(),
        );
        lines = [`HPP per porsi: ${formatRupiah(hpp)}`];
      } else if (mode === 'margin') {
        const hpp = money('hpp', 'HPP');
        const price = money('price', 'Harga jual').toNumber();
        const commission = pct('commission', 'Komisi');
        const margin = actualMarginBp(price, hpp, commission);
        const profit = profitPerPortion(price, hpp, commission);
        lines = [
          `HPP per porsi: ${formatRupiah(hpp)}`,
          `Harga jual: ${formatRupiah(price)}`,
          `Komisi: ${formatPercent(commission)}`,
          `Untung per porsi setelah komisi: ${formatRupiah(profit)}`,
          `Margin aktual: ${formatPercent(margin)}`,
          hpp.gt(0)
            ? `Markup sebelum komisi: ${formatPercent(markupBp(price, hpp))}`
            : 'Markup tidak tersedia karena HPP nol.',
        ];
      } else if (mode === 'bep') {
        const units = breakEvenUnits(
          money('fixed', 'Biaya tetap'),
          money('hpp', 'Biaya variabel'),
          money('price', 'Harga jual').toNumber(),
          pct('commission', 'Komisi'),
        );
        lines = [`Titik impas: ${units.toLocaleString('id-ID')} unit`];
      } else {
        const hpp = money('hpp', 'HPP');
        const margin = pct('margin', 'Target margin');
        const commission =
          mode === 'ojol' ? pct('commission', 'Komisi ojol') : 0;
        const rounding = money('rounding', 'Pembulatan').toNumber();
        const price = suggestPrice(hpp, margin, commission, rounding);
        lines = [
          `Harga jual saran: ${formatRupiah(price)}`,
          `HPP: ${formatRupiah(hpp)}`,
          `Target margin: ${formatPercent(margin)}`,
        ];
        if (mode === 'ojol')
          lines.push(`Komisi ojol: ${formatPercent(commission)}`);
      }
      setResult(lines);
      track('calculator_complete');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Hitungan belum bisa dibuat. Periksa kembali angka yang dimasukkan.',
      );
    }
  }

  return (
    <section
      className={`mx-auto grid w-full max-w-3xl gap-6 ${embedded ? '' : 'px-5 py-10 lg:py-16'}`}
    >
      <header className="grid gap-3">
        <Heading className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
          {config.title}
        </Heading>
        <p className="max-w-2xl text-muted-foreground">
          {config.description} Hitungan berjalan di perangkat ini dan tidak
          disimpan.
        </p>
      </header>
      <section
        aria-label="Contoh hitungan"
        className="grid justify-items-start gap-3"
      >
        <Subheading className="font-semibold">
          Contoh hitungan, angka ilustrasi
        </Subheading>
        <p className="text-muted-foreground">{example.description}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearResult();
            setValues({ ...example.values });
          }}
        >
          Isi angka contoh
        </Button>
      </section>
      <form
        onSubmit={calculate}
        className="grid gap-5 rounded-2xl border border-input/60 bg-card p-5 lg:p-7"
      >
        {fields[mode].map((field) => (
          <label key={field.key} className="grid gap-2 text-sm font-semibold">
            {field.label}
            <Input
              required
              inputMode={
                field.key === 'margin' || field.key === 'commission'
                  ? 'decimal'
                  : 'numeric'
              }
              type="text"
              value={values[field.key] ?? ''}
              maxLength={32}
              onChange={(event) => {
                clearResult();
                setValues((previous) => ({
                  ...previous,
                  [field.key]: event.target.value,
                }));
              }}
              aria-describedby={
                field.hint ? `${id}-${field.key}-hint` : undefined
              }
            />
            {field.hint ? (
              <span
                id={`${id}-${field.key}-hint`}
                className="font-normal text-muted-foreground"
              >
                {field.hint}
              </span>
            ) : null}
          </label>
        ))}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="min-h-11">
          Hitung sekarang
        </Button>
      </form>
      {result.length ? (
        <section
          aria-live="polite"
          aria-label="Hasil hitung"
          className="grid gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5"
        >
          <Subheading className="font-display text-xl font-semibold">
            Hasil hitung
          </Subheading>
          {result.map((line) => (
            <p key={line} className="text-lg font-semibold tabular-nums">
              {line}
            </p>
          ))}
          <p className="text-sm text-muted-foreground">
            Hasil memuat biaya dan keuntungan. Bagikan hanya jika kamu ingin
            penerima melihatnya.
          </p>
          <div className="flex flex-wrap gap-2">
            {canShare ? (
              <Button
                type="button"
                disabled={sharing}
                onClick={() => void share(false)}
              >
                Bagikan hasil hitung
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={sharing}
              onClick={() => void share(true)}
            >
              Salin hasil hitung
            </Button>
          </div>
          <output className="text-sm">
            {sharing ? 'Menyiapkan hasil…' : shareMessage}
          </output>
          {manualCopy ? (
            <label className="grid gap-2 text-sm">
              Teks hasil untuk disalin
              <textarea
                readOnly
                value={manualCopy}
                onFocus={(event) => event.currentTarget.select()}
                className="min-h-40 w-full rounded-lg border border-input bg-surface p-3 text-base"
              />
            </label>
          ) : null}
          <Link
            href="/masuk"
            onClick={() => track('calculator_signup_click')}
            className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
          >
            Masuk untuk menyimpan resepmu
          </Link>
        </section>
      ) : null}
      <section className="grid gap-2">
        <Subheading className="text-xl font-semibold">
          Cara membaca hitungan
        </Subheading>
        <p className="text-muted-foreground">{calculatorNotes[mode]}</p>
      </section>
      <nav
        aria-label="Kalkulator terkait"
        className="grid gap-1 border-t border-input/50 pt-4"
      >
        {calculatorLinks
          .filter((item) => item.mode !== mode)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
            >
              {item.label}
            </Link>
          ))}
        <Link
          href="/artikel/cara-menghitung-hpp-makanan"
          className="inline-flex min-h-11 items-center text-link underline underline-offset-4"
        >
          Baca panduan menghitung HPP makanan
        </Link>
      </nav>
    </section>
  );
}
