import {
  actualMarginBp,
  CalcError,
  type RecipeResult,
  recalcAll,
  suggestPrice,
} from '@takaran/calc';
import type { MarginSnapshotRow, RecipeRow, Snapshot } from './types';

function marginForRecipe(
  recipe: RecipeRow,
  result: RecipeResult | CalcError | undefined,
  roundingStep: number,
): number | null {
  if (!result || result instanceof CalcError) return null;
  try {
    const price =
      recipe.currentPrice ??
      suggestPrice(result.hpp, recipe.targetMarginBp, 0, roundingStep);
    return actualMarginBp(price, result.hpp, 0);
  } catch {
    return null;
  }
}

/**
 * Baris margin baru untuk resep yang marginBp-nya beda dari titik tersimpan
 * terakhir (lastByRecipe). Dipanggil sekali setelah tiap perintah tersimpan;
 * mengembalikan array kosong kalau tidak ada margin yang berubah.
 */
export function computeMarginSnapshots(
  snapshot: Snapshot,
  lastByRecipe: Map<string, number>,
  now: string,
): MarginSnapshotRow[] {
  if (snapshot.recipes.length === 0) return [];
  const results = recalcAll({
    ingredients: new Map(snapshot.ingredients.map((item) => [item.id, item])),
    recipes: new Map(snapshot.recipes.map((item) => [item.id, item])),
    roundingStep: snapshot.settings.roundingStep,
  });
  const rows: MarginSnapshotRow[] = [];
  for (const recipe of snapshot.recipes) {
    const marginBp = marginForRecipe(
      recipe,
      results.get(recipe.id),
      snapshot.settings.roundingStep,
    );
    if (marginBp === null || lastByRecipe.get(recipe.id) === marginBp) continue;
    rows.push({ recipeId: recipe.id, marginBp, recordedAt: now });
  }
  return rows;
}

export interface MonthlyMarginPoint {
  month: string;
  marginBp: number;
}

/**
 * Rata-rata margin per bulan kalender, isi-maju dari titik terakhir yang
 * diketahui tiap resep. Bulan tanpa satu pun resep yang punya data dilewati,
 * bukan diisi nol, supaya grafik tidak menyiratkan angka yang tidak ada.
 */
export function monthlySeries(
  history: MarginSnapshotRow[],
  recipeIds: string[],
  monthsBack = 6,
  reference = new Date(),
): MonthlyMarginPoint[] {
  const byRecipe = new Map<string, MarginSnapshotRow[]>();
  for (const row of history) {
    if (!recipeIds.includes(row.recipeId)) continue;
    const list = byRecipe.get(row.recipeId);
    if (list) list.push(row);
    else byRecipe.set(row.recipeId, [row]);
  }
  for (const list of byRecipe.values())
    list.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  const refYear = reference.getUTCFullYear();
  const refMonth = reference.getUTCMonth();
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(refYear, refMonth - i, 1));
    months.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
    );
  }

  const series: MonthlyMarginPoint[] = [];
  for (const month of months) {
    const endOfMonth = `${month}-31T23:59:59.999Z`;
    const values: number[] = [];
    for (const list of byRecipe.values()) {
      let latest: number | null = null;
      for (const row of list) {
        if (row.recordedAt > endOfMonth) break;
        latest = row.marginBp;
      }
      if (latest !== null) values.push(latest);
    }
    if (values.length === 0) continue;
    series.push({
      month,
      marginBp: Math.round(
        values.reduce((sum, value) => sum + value, 0) / values.length,
      ),
    });
  }
  return series;
}
