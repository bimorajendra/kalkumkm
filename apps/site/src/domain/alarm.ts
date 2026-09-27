import {
  actualMarginBp,
  CalcError,
  type RecipeResult,
  suggestPrice,
} from '@takaran/calc';
import type { RecipeRow } from './types';

export interface AffectedRecipe {
  recipe: RecipeRow;
  marginBp: number;
  suggestedPrice: number;
}

/** Resep yang memakai bahan ini dan marginnya kini di bawah target. */
export function evaluateAffectedRecipes(
  ingredientId: string,
  recipes: RecipeRow[],
  results: Map<string, RecipeResult | CalcError>,
  roundingStep: number,
): AffectedRecipe[] {
  const usesIngredient = (recipeId: string, visited: Set<string>): boolean => {
    if (visited.has(recipeId)) return false;
    visited.add(recipeId);
    const recipe = recipes.find((item) => item.id === recipeId);
    return (
      recipe?.items.some((item) =>
        item.refType === 'ingredient'
          ? item.refId === ingredientId
          : usesIngredient(item.refId, visited),
      ) ?? false
    );
  };
  return recipes.flatMap((recipe) => {
    if (recipe.currentPrice === null || !usesIngredient(recipe.id, new Set())) {
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
