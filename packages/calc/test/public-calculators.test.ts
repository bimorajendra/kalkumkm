import Big from 'big.js';
import { describe, expect, it } from 'vitest';
import { breakEvenUnits, hppFromCosts } from '../src/public-pricing';

describe('kalkulator publik HPP dan titik impas', () => {
  it('menghitung HPP dari biaya satu batch dan kemasan per porsi', () => {
    expect(
      hppFromCosts(new Big(27800), new Big(3000), new Big(1000), 16),
    ).toEqual(new Big(2925));
  });

  it('membulatkan titik impas ke unit utuh berikutnya setelah komisi', () => {
    expect(breakEvenUnits(new Big(100000), new Big(3000), 5000, 1000)).toBe(67);
  });

  it('menolak jumlah hasil kosong dan harga yang tidak menutup biaya variabel', () => {
    expect(() =>
      hppFromCosts(new Big(100), new Big(0), new Big(0), 0),
    ).toThrow();
    expect(() =>
      breakEvenUnits(new Big(1000), new Big(5000), 5000, 0),
    ).toThrow();
  });
});
