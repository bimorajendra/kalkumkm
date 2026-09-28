'use client';

import { actualMarginBp, quoteTotals } from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import Big from 'big.js';
import { useId, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BASE_HPP = 69000;
const BASE_PRICE = 115000;

const OPTIONS = [
  {
    id: 'tulisan',
    name: 'Tulisan cokelat',
    price: 10000,
    cost: 2000,
    defaultChecked: true,
  },
  {
    id: 'topper',
    name: 'Topper akrilik',
    price: 35000,
    cost: 18000,
    defaultChecked: true,
  },
  {
    id: 'tema',
    name: 'Buttercream warna tema',
    price: 20000,
    cost: 6500,
    defaultChecked: true,
  },
  {
    id: 'mika',
    name: 'Kotak mika premium',
    price: 15000,
    cost: 9000,
    defaultChecked: false,
  },
] as const;

/** Builder pesanan custom. Total/modal/untung dihitung lewat `quoteTotals`
 * dan `actualMarginBp` dari @takaran/calc — mesin hitung yang sama dengan
 * fitur penawaran di aplikasi (PRD FR-30), bukan rumus tulis ulang. */
export function CustomOrderBuilder() {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(OPTIONS.map((o) => [o.id, o.defaultChecked])),
  );
  const selectId = useId();
  const chosen = OPTIONS.filter((option) => checked[option.id]);
  const result = quoteTotals(
    new Big(BASE_HPP),
    BASE_PRICE,
    1,
    chosen.map((option) => ({ priceAdd: option.price, costAdd: option.cost })),
  );
  const marginBp = actualMarginBp(result.price, result.cost, 0);

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-[var(--mk-radius-xl)] border border-[var(--mk-border)] bg-[var(--mk-surface)] shadow-[var(--mk-shadow-float)] lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-7 lg:p-9">
        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor={selectId}>
            Kue dasar
          </label>
          <Select defaultValue="cokelat-22">
            <SelectTrigger className="h-[50px] w-full" id={selectId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cokelat-22">Kue cokelat 22 cm</SelectItem>
              <SelectItem value="cokelat-24">Kue cokelat 24 cm</SelectItem>
              <SelectItem value="chiffon-22">Chiffon pandan 22 cm</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[13px] text-[var(--mk-text-3)]">
            Modal {formatRupiah(BASE_HPP)} · harga {formatRupiah(BASE_PRICE)}
          </span>
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-semibold">
            Tambahan dari pelanggan
          </legend>
          {OPTIONS.map((option) => {
            const inputId = `${selectId}-${option.id}`;
            return (
              <label
                className="grid cursor-pointer grid-cols-[22px_1fr_auto] items-center gap-3.5 rounded-[var(--mk-radius-md)] border border-[var(--mk-border)] px-4 py-3.5"
                htmlFor={inputId}
                key={option.id}
              >
                <Checkbox
                  checked={checked[option.id]}
                  className="size-5 rounded-[6px] data-[state=checked]:bg-[var(--mk-primary)] data-[state=checked]:border-[var(--mk-primary)]"
                  id={inputId}
                  onCheckedChange={(value) =>
                    setChecked((prev) => ({
                      ...prev,
                      [option.id]: value === true,
                    }))
                  }
                />
                <span className="grid gap-0.5">
                  <span className="text-[15px] font-semibold">
                    {option.name}
                  </span>
                  <span className="text-[13px] text-[var(--mk-text-3)]">
                    modal {formatRupiah(option.cost)}
                  </span>
                </span>
                <span className="text-[15px] font-semibold">
                  + {formatRupiah(option.price)}
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <Tile label="Harga ke pelanggan" value={formatRupiah(result.price)} />
          <Tile label="Modal" value={formatRupiah(result.cost.toNumber())} />
          <Tile
            label={`Untung · ${formatPercent(marginBp)}`}
            tone="success"
            value={formatRupiah(result.profit.toNumber())}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 border-t border-[var(--mk-border)] bg-[var(--mk-sand)] p-7 lg:border-t-0 lg:border-l lg:p-9">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-semibold">Pratinjau penawaran</span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--mk-text-3)]">
            <svg
              aria-hidden="true"
              fill="none"
              height="14"
              viewBox="0 0 16 16"
              width="14"
            >
              <path
                d="M2 8s2.2-4.5 6-4.5S14 8 14 8s-2.2 4.5-6 4.5S2 8 2 8Z"
                stroke="var(--mk-text-3)"
                strokeWidth="1.4"
              />
              <path
                d="M3 13 13 3"
                stroke="var(--mk-text-3)"
                strokeLinecap="round"
                strokeWidth="1.4"
              />
            </svg>
            Modal dan untung tidak ikut tercetak
          </span>
        </div>

        <div className="grid w-full max-w-[380px] gap-4 rounded-[var(--mk-radius-lg)] bg-[var(--mk-surface)] p-6 shadow-[var(--mk-shadow-highlight)]">
          <div className="flex justify-between text-xs font-semibold tracking-[0.04em] text-[var(--mk-text-3)]">
            <span>PENAWARAN HARGA</span>
            <span>27 Sep 2026</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-bold tracking-[-0.02em]">
              Dapur Rina
            </span>
            <span className="rounded-full bg-[var(--mk-sand)] px-2 py-1 text-[11px] font-semibold text-[var(--mk-text-2)]">
              contoh
            </span>
          </div>
          <span className="text-[13px] text-[var(--mk-text-3)]">
            Untuk: [nama pelanggan] · ulang tahun
          </span>
          <div className="border-t border-[var(--mk-divider)]" />
          <div className="grid gap-2.5 text-sm">
            <div className="flex justify-between">
              <span>Kue cokelat 22 cm</span>
              <span>{formatRupiah(BASE_PRICE)}</span>
            </div>
            {chosen.map((option) => (
              <div className="flex justify-between" key={option.id}>
                <span className="text-[var(--mk-text-2)]">+ {option.name}</span>
                <span>{formatRupiah(option.price)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-baseline justify-between border-t border-[var(--mk-divider)] pt-3.5">
            <span className="text-[15px] font-semibold">Total</span>
            <span className="text-[32px] font-bold tracking-[-0.03em]">
              {formatRupiah(result.price)}
            </span>
          </div>
          <span className="text-center text-xs text-[var(--mk-text-3)]">
            Pesan lewat WhatsApp [nomor usaha]
          </span>
        </div>

        <div className="flex gap-2.5">
          <button
            className="h-11 rounded-[var(--mk-radius-md)] border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] px-4.5 text-sm font-semibold text-[var(--mk-text-4)]"
            disabled
            title="Contoh tampilan, belum bisa diunduh dari halaman ini"
            type="button"
          >
            Simpan gambar
          </button>
          <button
            className="h-11 rounded-[var(--mk-radius-md)] border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] px-4.5 text-sm font-semibold text-[var(--mk-text-4)]"
            disabled
            title="Contoh tampilan, belum bisa diunduh dari halaman ini"
            type="button"
          >
            Simpan PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success';
}) {
  return (
    <div
      className={`grid gap-1 rounded-[var(--mk-radius-md)] px-4 py-3.5 ${
        tone === 'success'
          ? 'bg-[var(--mk-success-tint)] text-[var(--mk-success-ink)]'
          : 'bg-[var(--mk-surface-muted)]'
      }`}
    >
      <span
        className={`text-[13px] ${tone === 'success' ? '' : 'text-[var(--mk-text-3)]'}`}
      >
        {label}
      </span>
      <span className="text-[22px] font-bold tracking-[-0.02em]">{value}</span>
    </div>
  );
}
