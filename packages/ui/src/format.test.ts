import Big from 'big.js';
import { describe, expect, it } from 'vitest';
import { formatPercent, formatRupiah } from './format';

describe('formatter angka Indonesia', () => {
  it('memformat rupiah bulat dan hasil pecahan Big dengan pembulatan tampilan', () => {
    expect(formatRupiah(5000)).toBe('Rp 5.000');
    expect(formatRupiah(new Big('1737.5'))).toBe('Rp 1.738');
    expect(formatRupiah(new Big('-12500000'))).toBe('Rp -12.500.000');
  });

  it('memformat basis poin menjadi persen lokal', () => {
    expect(formatPercent(4150)).toBe('41,5%');
    expect(formatPercent(4000)).toBe('40%');
    expect(formatPercent(7094)).toBe('70,9%');
    expect(() => formatPercent(40.5)).toThrow(RangeError);
  });
});
