import { describe, expect, it } from 'vitest';
import { computeMarginSnapshots, monthlySeries } from './margin-history';
import type { MarginSnapshotRow, RecipeRow, Snapshot } from './types';

function recipe(overrides: Partial<RecipeRow> = {}): RecipeRow {
  return {
    id: 'r1',
    name: 'Brownies',
    yieldPortions: 1,
    items: [],
    packagingPerPortion: 1000,
    energyPerBatch: 0,
    laborMinutesPerBatch: 0,
    laborRatePerHour: null,
    targetMarginBp: 4000,
    currentPrice: 2000,
    isSubRecipe: false,
    subRecipeYield: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    plan: 'free',
    ingredients: [],
    recipes: [recipe()],
    channels: [],
    quoteOptions: [],
    settings: {
      businessName: '',
      roundingStep: 500,
      defaultMarginBp: 4000,
      lastRecipeId: null,
      marginAlarm: null,
    },
    marginHistory: [],
    ...overrides,
  };
}

describe('computeMarginSnapshots', () => {
  it('mencatat titik baru untuk resep yang belum pernah punya riwayat', () => {
    const rows = computeMarginSnapshots(
      snapshot(),
      new Map(),
      '2026-06-01T00:00:00.000Z',
    );
    // HPP hanya kemasan Rp 1.000, harga Rp 2.000 -> margin 50% (5000 bp).
    expect(rows).toEqual([
      {
        recipeId: 'r1',
        marginBp: 5000,
        recordedAt: '2026-06-01T00:00:00.000Z',
      },
    ]);
  });

  it('tidak mencatat apa pun kalau marginBp sama dengan titik terakhir', () => {
    const rows = computeMarginSnapshots(
      snapshot(),
      new Map([['r1', 5000]]),
      '2026-06-01T00:00:00.000Z',
    );
    expect(rows).toEqual([]);
  });

  it('mencatat titik baru kalau marginBp berubah dari titik terakhir', () => {
    const rows = computeMarginSnapshots(
      snapshot({ recipes: [recipe({ currentPrice: 4000 })] }),
      new Map([['r1', 5000]]),
      '2026-06-01T00:00:00.000Z',
    );
    // Harga Rp 4.000, HPP Rp 1.000 -> margin 75% (7500 bp), beda dari 5000.
    expect(rows).toEqual([
      {
        recipeId: 'r1',
        marginBp: 7500,
        recordedAt: '2026-06-01T00:00:00.000Z',
      },
    ]);
  });

  it('melewati resep yang belum bisa dihitung (bahan sudah dihapus)', () => {
    const broken = recipe({
      items: [
        { refType: 'ingredient', refId: 'hilang', quantity: 1, unit: 'g' },
      ],
    });
    const rows = computeMarginSnapshots(
      snapshot({ recipes: [broken] }),
      new Map(),
      '2026-06-01T00:00:00.000Z',
    );
    expect(rows).toEqual([]);
  });

  it('mengembalikan array kosong kalau tidak ada resep', () => {
    expect(
      computeMarginSnapshots(
        snapshot({ recipes: [] }),
        new Map(),
        '2026-06-01T00:00:00.000Z',
      ),
    ).toEqual([]);
  });
});

describe('monthlySeries', () => {
  const history: MarginSnapshotRow[] = [
    { recipeId: 'a', marginBp: 4000, recordedAt: '2026-04-10T00:00:00.000Z' },
    { recipeId: 'b', marginBp: 3000, recordedAt: '2026-05-20T00:00:00.000Z' },
    { recipeId: 'a', marginBp: 4500, recordedAt: '2026-06-05T00:00:00.000Z' },
  ];
  const reference = new Date(Date.UTC(2026, 5, 15));

  it('mengisi-maju titik terakhir tiap resep dan merata-ratakan per bulan', () => {
    expect(monthlySeries(history, ['a', 'b'], 3, reference)).toEqual([
      { month: '2026-04', marginBp: 4000 },
      { month: '2026-05', marginBp: 3500 },
      { month: '2026-06', marginBp: 3750 },
    ]);
  });

  it('melewati bulan sebelum resep mana pun punya data, bukan mengisi nol', () => {
    const series = monthlySeries(history, ['a', 'b'], 5, reference);
    expect(series.map((point) => point.month)).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
  });

  it('hanya menghitung resep yang diminta', () => {
    expect(monthlySeries(history, ['b'], 3, reference)).toEqual([
      { month: '2026-05', marginBp: 3000 },
      { month: '2026-06', marginBp: 3000 },
    ]);
  });

  it('mengembalikan array kosong kalau tidak ada riwayat', () => {
    expect(monthlySeries([], ['a'], 6, reference)).toEqual([]);
  });
});
