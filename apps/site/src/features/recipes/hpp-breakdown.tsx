'use client';

import type { Recipe, RecipeResult } from '@takaran/calc';
import { IsometricStack } from '@takaran/ui';
import { formatRupiah } from '@takaran/ui/format';
import type Big from 'big.js';

function nonzero(label: string, amount: Big) {
  return amount.gt(0) ? `${label} ${formatRupiah(amount)}` : undefined;
}

export function HppBreakdown({
  recipe,
  result,
  price,
}: {
  recipe: Recipe;
  result: RecipeResult;
  price: number;
}) {
  const parts = result.breakdown;
  const batchParts = [
    nonzero(
      'Bahan',
      parts.ingredients.plus(parts.subRecipes).times(recipe.yieldPortions),
    ),
    nonzero('energi', parts.energy.times(recipe.yieldPortions)),
    nonzero('tenaga', parts.labor.times(recipe.yieldPortions)),
  ].filter(Boolean);
  const sentence = `(${batchParts.length ? batchParts.join(' + ') : 'Belum ada bahan'}) ÷ ${recipe.yieldPortions} porsi + kemasan ${formatRupiah(parts.packaging)} = HPP ${formatRupiah(result.hpp)} per porsi`;
  const layers = [
    {
      key: 'ingredients',
      label: 'Bahan',
      value: parts.ingredients.plus(parts.subRecipes),
    },
    { key: 'energy', label: 'Energi', value: parts.energy },
    { key: 'labor', label: 'Tenaga', value: parts.labor },
    { key: 'packaging', label: 'Kemasan', value: parts.packaging },
  ].filter((layer) => layer.value.gt(0));
  return (
    <section
      aria-labelledby="hpp-breakdown-title"
      className="grid gap-3 rounded-xl bg-card p-5"
    >
      <h2 id="hpp-breakdown-title" className="text-xl font-semibold">
        Rincian HPP per porsi
      </h2>
      <p>{sentence}</p>
      {recipe.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada bahan. HPP saat ini hanya menghitung energi dan kemasan.
        </p>
      ) : null}
      <IsometricStack
        layers={
          layers.length
            ? layers
            : [{ key: 'cost', label: 'Biaya', value: result.hpp }]
        }
        profit={result.hpp.times(-1).plus(price)}
      />
    </section>
  );
}
