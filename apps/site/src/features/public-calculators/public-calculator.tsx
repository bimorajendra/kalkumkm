'use client';

import { actualMarginBp, suggestPrice } from '@takaran/calc';
import { breakEvenUnits, hppFromCosts } from '@takaran/calc/public-pricing';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import Big from 'big.js';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type PublicCalculatorMode = 'hpp' | 'margin' | 'bep' | 'price' | 'ojol';

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

function wholeRupiah(raw: string, label: string): Big {
  if (!/^\d+$/.test(raw.trim()))
    throw new Error(`${label} harus berupa rupiah bulat.`);
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

export function PublicCalculator({ mode }: { mode: PublicCalculatorMode }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string[]>([]);
  const [error, setError] = useState('');
  const config = labels[mode];

  function calculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult([]);
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
          Number(get('yield')),
        );
        lines = [`HPP per porsi: ${formatRupiah(hpp)}`];
      } else if (mode === 'margin') {
        const hpp = money('hpp', 'HPP');
        const price = money('price', 'Harga jual').toNumber();
        const commission = pct('commission', 'Komisi');
        const margin = actualMarginBp(price, hpp, commission);
        const profit = new Big(String(price))
          .times(10000 - commission)
          .div(10000)
          .minus(hpp);
        lines = [
          `Untung per porsi setelah komisi: ${formatRupiah(profit)}`,
          `Margin aktual: ${formatPercent(margin)}`,
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
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Hitungan belum bisa dibuat. Periksa kembali angka yang dimasukkan.',
      );
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6 px-5 py-10 lg:py-16">
      <header className="grid gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
          {config.title}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {config.description} Hitungan berjalan di perangkat ini dan tidak
          disimpan.
        </p>
      </header>
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
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  [field.key]: event.target.value,
                }))
              }
              aria-describedby={field.hint ? `${field.key}-hint` : undefined}
            />
            {field.hint ? (
              <span
                id={`${field.key}-hint`}
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
          <h2 className="font-display text-xl font-semibold">Hasil hitung</h2>
          {result.map((line) => (
            <p key={line} className="text-lg font-semibold tabular-nums">
              {line}
            </p>
          ))}
        </section>
      ) : null}
    </section>
  );
}
