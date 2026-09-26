import type { Ingredient } from '@takaran/calc';
import { useState } from 'react';
import type { IngredientRow } from '../db/schema';
import { IngredientForm } from '../features/ingredients/components/ingredient-form';
import { IngredientList } from '../features/ingredients/components/ingredient-list';
import { ingredientCopy } from '../features/ingredients/copy';
import {
  claimFirstIngredientEvent,
  useIngredients,
} from '../features/ingredients/repository';
import { MarginAlarm } from '../features/margin-alarm/components/margin-alarm';
import { useRecipeResults } from '../features/recipes/use-recipe-results';
import { track } from '../lib/analytics';

export function BahanRoute() {
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientRow>();
  const allIngredients = useIngredients('');
  const recipeData = useRecipeResults();

  async function saved(_ingredient: Ingredient) {
    if (editing) return;
    try {
      if (await claimFirstIngredientEvent())
        track('ingredient_first_added', {});
    } catch {
      // Analytics state must not affect a saved ingredient.
    }
  }

  function openForm(ingredient?: IngredientRow) {
    setEditing(ingredient);
    setFormOpen(true);
  }

  function closeForm(open: boolean) {
    setFormOpen(open);
    if (!open) setEditing(undefined);
  }

  return (
    <main className="page ingredient-page">
      {!recipeData.error ? <MarginAlarm data={recipeData} /> : null}
      <section aria-labelledby="page-title">
        <div className="ingredient-page-heading">
          <div>
            <div className="eyebrow">DAPURMU</div>
            <h1 id="page-title">{ingredientCopy.title}</h1>
          </div>
          {allIngredients.data && allIngredients.data.length > 0 && (
            <button
              className="button button-primary ingredient-add-desktop"
              type="button"
              onClick={() => openForm()}
            >
              {ingredientCopy.add}
            </button>
          )}
        </div>
        {allIngredients.data?.length === 0 &&
        !('error' in allIngredients && allIngredients.error) ? (
          <section
            aria-labelledby="empty-title"
            className="empty-state compact ingredient-empty"
          >
            <div
              aria-label="Rak bahan dengan tepung"
              className="pan-motif flour"
              role="img"
            >
              <span />
            </div>
            <h2 id="empty-title">{ingredientCopy.emptyTitle}</h2>
            <p>{ingredientCopy.emptyDescription}</p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => openForm()}
            >
              {ingredientCopy.add}
            </button>
          </section>
        ) : (
          <>
            <label className="ingredient-search" htmlFor="ingredient-search">
              {ingredientCopy.searchLabel}
              <input
                id="ingredient-search"
                type="search"
                placeholder={ingredientCopy.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <IngredientList query={query} onEdit={openForm} />
            <button
              className="button button-primary ingredient-add-mobile"
              type="button"
              onClick={() => openForm()}
            >
              {ingredientCopy.add}
            </button>
          </>
        )}
      </section>
      <IngredientForm
        open={formOpen}
        ingredient={editing}
        onOpenChange={closeForm}
        onSaved={saved}
      />
    </main>
  );
}
