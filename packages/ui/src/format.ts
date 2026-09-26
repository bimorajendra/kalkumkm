/// <reference path="./big-js.d.ts" />
import Big from 'big.js';

const rupiah = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

export function formatRupiah(value: number | Big): string {
  const amount = value instanceof Big ? value : new Big(String(value));
  const rounded = amount.round(0, Big.roundHalfUp).toString();
  return `Rp ${rupiah.format(BigInt(rounded))}`;
}

export function formatPercent(basisPoints: number): string {
  if (!Number.isSafeInteger(basisPoints)) {
    throw new RangeError('Persentase harus berupa bilangan bulat basis poin.');
  }
  return `${percent.format(basisPoints / 100)}%`;
}
