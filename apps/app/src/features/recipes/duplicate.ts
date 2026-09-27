import type { RecipeRow } from '../../db/schema';
import { createRecipe } from './repository';

export async function duplicateRecipe(recipe: RecipeRow): Promise<RecipeRow> {
  const suffix = ' (salinan)';
  const name = `${recipe.name.slice(0, 60 - suffix.length)}${suffix}`;
  return createRecipe({
    ...recipe,
    name,
    items: recipe.items.map((item) => ({ ...item })),
    currentPrice: null,
  });
}
