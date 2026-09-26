import type { Recipe } from './types';

export function findCycles(recipes: Recipe[]): string[][] {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const state = new Map<string, 0 | 1 | 2>();
  const path: string[] = [];
  const cycles: string[][] = [];
  const seen = new Set<string>();

  function visit(id: string): void {
    state.set(id, 1);
    path.push(id);
    const recipe = byId.get(id);
    for (const item of recipe?.items ?? []) {
      if (item.refType !== 'recipe' || !byId.has(item.refId)) continue;
      const nextState = state.get(item.refId) ?? 0;
      if (nextState === 0) visit(item.refId);
      else if (nextState === 1) {
        const start = path.indexOf(item.refId);
        const cycle = [...path.slice(start), item.refId];
        const key = cycle.slice(0, -1).slice().sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
      }
    }
    path.pop();
    state.set(id, 2);
  }

  for (const recipe of recipes) if (!state.has(recipe.id)) visit(recipe.id);
  return cycles;
}
