import { type CalcError, type RecipeResult, recalcAll } from '@takaran/calc';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function useRecipeResults() {
  return useLiveQuery(
    async () => {
      try {
        const [ingredients, recipes] = await Promise.all([
          db.ingredients.toArray(),
          db.recipes.toArray(),
        ]);
        const results = recalcAll({
          ingredients: new Map(ingredients.map((item) => [item.id, item])),
          recipes: new Map(recipes.map((item) => [item.id, item])),
          roundingStep: 500,
        });
        return {
          ingredients,
          recipes,
          results: results as Map<string, RecipeResult | CalcError>,
          error: false as const,
        };
      } catch {
        return {
          ingredients: [],
          recipes: [],
          results: new Map<string, RecipeResult | CalcError>(),
          error: true as const,
        };
      }
    },
    [],
    { ingredients: [], recipes: [], results: new Map(), error: false },
  );
}
