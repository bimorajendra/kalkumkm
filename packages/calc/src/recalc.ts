import { CalcError } from './errors';
import { findCycles } from './graph';
import type { BatchCache } from './recipe-cost';
import { calculateRecipeResult } from './recipe-cost';
import type { CalcContext, Recipe, RecipeResult } from './types';

export function recalcAll(
  context: CalcContext,
): Map<string, RecipeResult | CalcError> {
  const results = new Map<string, RecipeResult | CalcError>();
  const recipes = [...context.recipes.values()];
  const cycles = findCycles(recipes);
  const cyclicIds = new Set(cycles.flatMap((cycle) => cycle.slice(0, -1)));
  for (const id of cyclicIds)
    results.set(
      id,
      new CalcError('CYCLE', 'Resep memiliki referensi melingkar.', {
        recipeId: id,
      }),
    );

  const order: Recipe[] = [];
  const visiting = new Set<string>();
  const ordered = new Set<string>();
  function visit(recipe: Recipe): void {
    if (ordered.has(recipe.id) || visiting.has(recipe.id)) return;
    visiting.add(recipe.id);
    for (const item of recipe.items) {
      if (item.refType !== 'recipe') continue;
      const dependency = context.recipes.get(item.refId);
      if (dependency) visit(dependency);
    }
    visiting.delete(recipe.id);
    ordered.add(recipe.id);
    order.push(recipe);
  }
  recipes.forEach(visit);

  const cache: BatchCache = new Map();
  for (const recipe of order) {
    if (results.has(recipe.id)) continue;
    const failedDependency = recipe.items.find(
      (item) =>
        item.refType === 'recipe' &&
        results.get(item.refId) instanceof CalcError,
    );
    if (failedDependency && failedDependency.refType === 'recipe') {
      results.set(
        recipe.id,
        new CalcError(
          'DEPENDENCY_FAILED',
          `Resep ${failedDependency.refId} belum bisa dihitung.`,
          { recipeId: recipe.id, dependencyId: failedDependency.refId },
        ),
      );
      continue;
    }
    try {
      results.set(recipe.id, calculateRecipeResult(recipe, context, cache));
    } catch (error) {
      results.set(
        recipe.id,
        error instanceof CalcError
          ? error
          : new CalcError('INVALID_INPUT', 'Resep tidak dapat dihitung.', {
              recipeId: recipe.id,
            }),
      );
    }
  }
  return results;
}
