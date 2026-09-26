import type { Recipe, RecipeResult } from '@takaran/calc';
import { formatRupiah, IsometricStack } from '@takaran/ui';
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
  const batchIngredients = parts.ingredients
    .plus(parts.subRecipes)
    .times(recipe.yieldPortions);
  const batchParts = [
    nonzero('Bahan', batchIngredients),
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
  const profit = result.hpp.times(-1).plus(price);
  return (
    <section className="hpp-breakdown" aria-labelledby="hpp-breakdown-title">
      <h2 id="hpp-breakdown-title">Rincian HPP per porsi</h2>
      <p className="hpp-formula">{sentence}</p>
      {recipe.items.length === 0 && (
        <p className="recipe-no-ingredients">
          Belum ada bahan. HPP saat ini hanya menghitung energi dan kemasan.
        </p>
      )}
      <IsometricStack
        layers={
          layers.length
            ? layers
            : [{ key: 'cost', label: 'Biaya', value: result.hpp }]
        }
        profit={profit}
      />
    </section>
  );
}
