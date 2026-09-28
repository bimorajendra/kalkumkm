'use client';

import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { useId, useState } from 'react';
import { calculateBrownies } from '@/lib/brownies';

const ingredientRows = [
  ['Tepung terigu', '150 g', 'Rp 2.100'],
  ['Cokelat masak', '200 g', 'Rp 10.000'],
  ['Telur', '4 butir', 'Rp 8.000'],
  ['Gula pasir', '200 g', 'Rp 3.200'],
  ['Margarin', '150 g', 'Rp 4.500'],
] as const;

const MIN = 10;
const MAX = 70;
const STEP = 5;

/** Kalkulator demo di beranda. Memakai mesin hitung yang sama dengan aplikasi
 * (`@takaran/calc` lewat `calculateBrownies`, dipakai juga di layar HPP
 * sungguhan) — cuma slider target untung yang bisa digeser, harga telur
 * tetap sesuai contoh acuan PRD bagian 7. */
export function DemoCalculator() {
  const [marginBp, setMarginBp] = useState(4000);
  const result = calculateBrownies(2000, marginBp);
  const marginPercent = marginBp / 100;
  const fill = ((marginPercent - MIN) / (MAX - MIN)) * 100;
  const id = useId();

  return (
    <div className="relative">
      <div className="absolute -top-13 right-6 z-10 hidden flex-col items-center lg:flex">
        <span className="flex items-center gap-2 rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] px-3 py-2 text-[13px] font-semibold shadow-[var(--mk-shadow-chip)]">
          <span className="size-1.5 rounded-full bg-[var(--mk-primary)]" />
          Harga dari struk belanja
        </span>
        <span className="h-4.5 border-l border-dashed border-[var(--mk-primary)]" />
      </div>

      <div className="overflow-hidden rounded-[var(--mk-radius-xl)] border border-[var(--mk-border)] bg-[var(--mk-surface)] shadow-[var(--mk-shadow-float)]">
        <div className="flex items-center justify-between border-b border-[var(--mk-divider)] px-5 py-4 lg:px-6 lg:py-5">
          <div className="grid gap-0.5">
            <span className="text-base font-bold lg:text-[17px]">
              Brownies panggang
            </span>
            <span className="text-[13px] text-[var(--mk-text-3)]">
              1 loyang = 16 potong
            </span>
          </div>
          <span className="rounded-full bg-[var(--mk-sand)] px-2.5 py-1 text-xs font-semibold text-[var(--mk-text-2)]">
            Contoh
          </span>
        </div>

        <div className="grid gap-2 px-5 py-3.5 text-sm lg:px-6 lg:py-4">
          <div className="grid grid-cols-[1fr_54px_76px] gap-2 text-xs font-semibold text-[var(--mk-text-3)] lg:grid-cols-[1fr_64px_84px]">
            <span>Bahan</span>
            <span>Takaran</span>
            <span className="text-right">Biaya</span>
          </div>
          {ingredientRows.map(([name, qty, cost]) => (
            <div
              className="grid grid-cols-[1fr_54px_76px] gap-2 lg:grid-cols-[1fr_64px_84px]"
              key={name}
            >
              <span>{name}</span>
              <span className="text-[var(--mk-text-3)]">{qty}</span>
              <span className="text-right">{cost}</span>
            </div>
          ))}
          <div className="text-[var(--mk-text-3)]">
            + gas &amp; listrik, kemasan
          </div>
        </div>

        <div className="flex items-center justify-between border-y border-[var(--mk-divider)] bg-[var(--mk-surface-muted)] px-5 py-3.5 lg:px-6 lg:py-4">
          <span className="text-sm font-semibold">
            Modal per potong <span className="font-normal">(HPP)</span>
          </span>
          <span className="text-xl font-bold tracking-[-0.02em] lg:text-2xl">
            {formatRupiah(result.hpp)}
          </span>
        </div>

        <div className="grid gap-3.5 px-5 py-4 lg:px-6 lg:py-4.5">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold" htmlFor={id}>
                Target untung
              </label>
              <span className="text-[15px] font-bold text-[var(--mk-primary-ink)]">
                {formatPercent(marginBp)}
              </span>
            </div>
            <input
              aria-valuetext={`${formatPercent(marginBp)}, harga jual ${formatRupiah(result.price)}`}
              className="mk-range"
              id={id}
              max={MAX}
              min={MIN}
              onChange={(event) =>
                setMarginBp(Number(event.currentTarget.value) * 100)
              }
              step={STEP}
              style={{
                background: `linear-gradient(90deg, var(--mk-primary) ${fill}%, #EDE7DF ${fill}%)`,
              }}
              type="range"
              value={marginPercent}
            />
            <div className="flex justify-between text-xs text-[var(--mk-text-3)]">
              <span>10%</span>
              <span>70%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="grid gap-1 rounded-[var(--mk-radius-md)] bg-[var(--mk-primary-tint)] px-4 py-3.5">
              <span className="text-[13px] font-medium text-[var(--mk-primary-ink)]">
                Harga jual disarankan
              </span>
              <span className="text-[28px] leading-tight font-bold tracking-[-0.03em] lg:text-[34px]">
                {formatRupiah(result.price)}
              </span>
              <span className="text-xs text-[var(--mk-primary-ink)]">
                dibulatkan ke atas, kelipatan Rp 500
              </span>
            </div>
            <div className="grid gap-1 rounded-[var(--mk-radius-md)] bg-[var(--mk-success-tint)] px-4 py-3.5">
              <span className="text-[13px] font-medium text-[var(--mk-success-ink)]">
                Untung per potong
              </span>
              <span className="text-xl leading-tight font-bold tracking-[-0.02em] text-[var(--mk-success-ink)] lg:text-2xl">
                {formatRupiah(result.price - result.hpp.toNumber())}
              </span>
              <span className="text-xs text-[var(--mk-success-ink)]">
                {formatPercent(result.marginBp)} dari harga jual
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3.5 text-center text-[13px] text-[var(--mk-text-3)]">
        Harga bahan hanya contoh. Geser slidernya untuk mencoba.
      </p>
    </div>
  );
}
