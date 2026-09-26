import { type CalcError, type RecipeResult, recalcAll } from '@takaran/calc';
import { db } from '../../db/db';
import type { MarginAlarm, RecipeRow } from '../../db/schema';
import { evaluateAffectedRecipes } from './evaluate';

export async function evaluateAfterPriceChange(ingredientId: string) {
  const [ingredients, recipes] = await Promise.all([
    db.ingredients.toArray(),
    db.recipes.toArray(),
  ]);
  const roundingSetting = await db.settings.get('roundingStep');
  const roundingStep =
    typeof roundingSetting?.value === 'number' ? roundingSetting.value : 500;
  const results = recalcAll({
    ingredients: new Map(ingredients.map((item) => [item.id, item])),
    recipes: new Map(recipes.map((item) => [item.id, item])),
    roundingStep,
  }) as Map<string, RecipeResult | CalcError>;
  const affected = evaluateAffectedRecipes(
    ingredientId,
    recipes as RecipeRow[],
    results,
    roundingStep,
  );
  const alarm: MarginAlarm = {
    recipeIds: affected.map(({ recipe }) => recipe.id),
    triggeredBy: ingredientId,
    createdAt: new Date().toISOString(),
    dismissed: false,
  };
  await db.settings.put({ key: 'marginAlarm', value: alarm });
  return alarm.recipeIds.length;
}
