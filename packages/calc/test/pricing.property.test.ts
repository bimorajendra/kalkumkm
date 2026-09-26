import Big from 'big.js';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  actualMarginBp,
  markupBp,
  priceForChannel,
  profitPerHour,
  quoteTotals,
  suggestPrice,
} from '../src';

describe('harga dan margin', () => {
  it('memastikan harga saran mencapai target margin untuk 1.000 input valid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }),
        fc.integer({ min: 0, max: 8000 }),
        fc.integer({ min: 0, max: 8000 }),
        fc.constantFrom(100, 500, 1000),
        (hppValue, marginBp, commissionBp, step) => {
          fc.pre(marginBp + commissionBp < 10000);
          const hpp = new Big(hppValue);
          const price = suggestPrice(hpp, marginBp, commissionBp, step);

          expect(
            actualMarginBp(price, hpp, commissionBp),
          ).toBeGreaterThanOrEqual(marginBp);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('menolak margin dan komisi yang totalnya 100% atau lebih', () => {
    expect(() => suggestPrice(new Big(1000), 4000, 6000, 500)).toThrowError(
      expect.objectContaining({ code: 'MARGIN_TOO_HIGH' }),
    );
    expect(() => suggestPrice(new Big(1000), 7000, 4000, 500)).toThrowError(
      expect.objectContaining({ code: 'MARGIN_TOO_HIGH' }),
    );
  });

  it('menolak langkah pembulatan tidak valid', () => {
    expect(() => suggestPrice(new Big(1000), 4000, 0, 0)).toThrowError(
      expect.objectContaining({ code: 'INVALID_ROUNDING_STEP' }),
    );
  });

  it('menolak HPP negatif dan hasil harga di luar batas rupiah aman', () => {
    expect(() => suggestPrice(new Big(-1), 4000, 0, 500)).toThrowError(
      expect.objectContaining({ code: 'INVALID_INPUT' }),
    );
    expect(() =>
      suggestPrice(new Big('9007199254740992'), 0, 0, 1),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
  });

  it('menolak margin dan markup dengan input yang tidak valid', () => {
    expect(() => actualMarginBp(0, new Big(1000), 0)).toThrowError(
      expect.objectContaining({ code: 'INVALID_INPUT' }),
    );
    expect(() => markupBp(-1, new Big(1000))).toThrowError(
      expect.objectContaining({ code: 'INVALID_INPUT' }),
    );
    expect(() => markupBp(1000, new Big(0))).toThrowError(
      expect.objectContaining({ code: 'INVALID_INPUT' }),
    );
    expect(() => profitPerHour(-1, new Big(100), 0, 1, 60)).toThrowError(
      expect.objectContaining({ code: 'INVALID_INPUT' }),
    );
  });

  it('menerapkan harga saluran komisi dan diskon sesuai aturan', () => {
    expect(
      priceForChannel(
        new Big(2925),
        4000,
        5000,
        { id: 'ojol', name: 'Ojol', kind: 'commission', rateBp: 2000 },
        500,
      ),
    ).toEqual({ price: 7500, marginBp: 4100 });
    expect(
      priceForChannel(
        new Big(2925),
        4000,
        5000,
        { id: 'reseller', name: 'Reseller', kind: 'discount', rateBp: 1000 },
        500,
      ),
    ).toEqual({ price: 4500, marginBp: 3500 });
  });

  it('menolak input quote dan diskon yang tidak valid serta total yang overflow', () => {
    expect(() =>
      priceForChannel(
        new Big(1000),
        4000,
        null,
        { id: 'reseller', name: 'Reseller', kind: 'discount', rateBp: 1000 },
        500,
      ),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
    expect(() =>
      priceForChannel(
        new Big(1000),
        4000,
        5000,
        { id: 'reseller', name: 'Reseller', kind: 'discount', rateBp: 10000 },
        500,
      ),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
    expect(() =>
      priceForChannel(
        new Big(1000),
        4000,
        5000,
        { id: 'reseller', name: 'Reseller', kind: 'discount', rateBp: 1000 },
        0,
      ),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_ROUNDING_STEP' }));
    expect(() =>
      quoteTotals(new Big(1000), Number.MAX_SAFE_INTEGER, 2, []),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
    expect(() => quoteTotals(new Big(1000), 1000, 0, [])).toThrowError(
      expect.objectContaining({ code: 'INVALID_INPUT' }),
    );
    expect(() =>
      quoteTotals(new Big(1000), 1000, 1, [{ priceAdd: -1, costAdd: 0 }]),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }));
  });
});
