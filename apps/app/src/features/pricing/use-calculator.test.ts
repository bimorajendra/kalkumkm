import {
  actualMarginBp,
  hppPerPortion,
  profitPerHour,
  profitPerPortion,
  suggestPrice,
} from '@takaran/calc';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleSave } from './save-delay';

describe('kalkulator harga dan untung', () => {
  afterEach(() => vi.useRealTimers());

  it('menyimpan perubahan setelah 300 ms dan membatalkan simpan lama', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const cancel = scheduleSave(save);
    vi.advanceTimersByTime(299);
    expect(save).not.toHaveBeenCalled();
    cancel();
    vi.advanceTimersByTime(1);
    expect(save).not.toHaveBeenCalled();
    scheduleSave(save);
    vi.advanceTimersByTime(300);
    expect(save).toHaveBeenCalledOnce();
  });

  it('menolak target margin dan komisi yang berjumlah 100 persen', () => {
    const hpp = hppPerPortion(exampleRecipe, emptyContext);
    expect(() => suggestPrice(hpp, 9000, 1000, 500)).toThrow(
      'Target margin dan komisi harus berjumlah kurang dari 100%.',
    );
  });

  it('menghasilkan angka brownies sesuai contoh tetap', () => {
    const hpp = hppPerPortion(exampleRecipe, emptyContext);
    const price = suggestPrice(hpp, 4000, 0, 500);
    expect(price).toBe(5000);
    expect(actualMarginBp(price, hpp, 0)).toBe(4150);
    expect(profitPerPortion(price, hpp, 0).toNumber()).toBe(2075);
    expect(profitPerHour(price, hpp, 0, 16, 90)?.toNumber()).toBeCloseTo(
      22133.333,
      2,
    );
    expect(profitPerHour(price, hpp, 0, 16, 0)).toBeNull();
  });
});

const exampleRecipe = {
  id: 'brownies',
  name: 'Brownies',
  yieldPortions: 16,
  items: [],
  packagingPerPortion: 0,
  energyPerBatch: 46_800,
  laborMinutesPerBatch: 90,
  laborRatePerHour: null,
  targetMarginBp: 4000,
  currentPrice: null,
  isSubRecipe: false,
  subRecipeYield: null,
};
const emptyContext = {
  ingredients: new Map(),
  recipes: new Map(),
  roundingStep: 500,
};
