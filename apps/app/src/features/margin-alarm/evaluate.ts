import {
  actualMarginBp,
  CalcError,
  suggestPrice,
  type RecipeResult,
} from '@takaran/calc';
import type { RecipeRow } from '../../db/schema';

export interface AffectedRecipe {
  recipe: RecipeRow;
  hpp: RecipeResult['hpp'];
  marginBp: number;
  suggestedPrice: number;
}

export function evaluateAffectedRecipes(
  ingredientId: string,
  recipes: RecipeRow[],
  results: Map<string, RecipeResult | CalcError>,
  roundingStep: number,
): AffectedRecipe[] {
  return recipes.flatMap((recipe) => {
    if (
      recipe.currentPrice === null ||
      !recipe.items.some(
        (item) => item.refType === 'ingredient' && item.refId === ingredientId,
      )
    ) {
      return [];
    }
    const result = results.get(recipe.id);
    if (!result || result instanceof CalcError) return [];
    try {
      const marginBp = actualMarginBp(recipe.currentPrice, result.hpp, 0);
      if (marginBp >= recipe.targetMarginBp) return [];
      return [
        {
          recipe,
          hpp: result.hpp,
          marginBp,
          suggestedPrice: suggestPrice(
            result.hpp,
            recipe.targetMarginBp,
            0,
            roundingStep,
          ),
        },
      ];
    } catch {
      return [];
    }
  });
}
