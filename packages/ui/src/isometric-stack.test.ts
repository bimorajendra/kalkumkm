import { describe, expect, it } from 'vitest';
import { calculateLayerHeights } from './isometric-stack';

describe('tinggi tumpukan isometrik', () => {
  it('membagi tinggi sesuai nilai dengan tinggi minimum tiap lapisan', () => {
    expect(calculateLayerHeights([0, 9], 18, 6)).toEqual([6, 12]);
  });

  it('membagi tinggi sama rata ketika semua nilai nol', () => {
    expect(calculateLayerHeights([0, 0, 0], 36, 6)).toEqual([12, 12, 12]);
  });

  it('menolak ukuran dan nilai lapisan yang tidak valid', () => {
    expect(() => calculateLayerHeights([], 144, 6)).toThrow(RangeError);
    expect(() => calculateLayerHeights([1, 2], 10, 6)).toThrow(RangeError);
    expect(() => calculateLayerHeights([-1, 2])).toThrow(RangeError);
  });
});
