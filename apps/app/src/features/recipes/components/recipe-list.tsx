import { actualMarginBp, CalcError, suggestPrice } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { RecipeRow } from '../../../db/schema';
import { useSetting } from '../../settings/repository';
import { recipeCopy } from '../copy';
import { seedExample } from '../seed-example';
import { useRecipeResults } from '../use-recipe-results';
import { RecipeEditor } from './recipe-editor';

export function RecipeList() {
  const data = useRecipeResults();
  const roundingStep = useSetting('roundingStep');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<RecipeRow>();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  if (!data)
    return <output className="recipe-load-state">Memuat resep…</output>;
  if (data.error)
    return (
      <p className="form-error" role="alert">
        {recipeCopy.loadError}
      </p>
    );
  const { recipes, results } = data;
  if (recipes.length === 0)
    return (
      <section
        className="empty-state compact recipe-empty"
        aria-labelledby="recipe-empty-title"
      >
        <div className="pan-motif tray" aria-hidden="true">
          <span />
        </div>
        <h2 id="recipe-empty-title">{recipeCopy.emptyTitle}</h2>
        <p>{recipeCopy.emptyDescription}</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button
            className="button button-primary"
            type="button"
            onClick={async () => {
              setError('');
              try {
                const recipe = await seedExample();
                navigate(`/resep/${recipe.id}`);
              } catch {
                setError(recipeCopy.saveError);
              }
            }}
          >
            {recipeCopy.example}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setSelected(undefined);
              setEditorOpen(true);
            }}
          >
            {recipeCopy.create}
          </button>
        </div>
        <RecipeEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSaved={(recipe) => navigate(`/resep/${recipe.id}`)}
        />
      </section>
    );
  return (
    <>
      <div className="recipe-page-heading">
        <p>HPP (modal per porsi), harga jual, dan untungmu.</p>
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            setSelected(undefined);
            setEditorOpen(true);
          }}
        >
          Buat resep
        </button>
      </div>
      <ul className="recipe-list" aria-label="Daftar resep">
        {recipes.map((recipe) => {
          const result = results.get(recipe.id);
          const hasError = result instanceof CalcError;
          let price: number | undefined;
          let margin: number | undefined;
          if (result && !hasError) {
            try {
              const currentOrSuggested =
                recipe.currentPrice ??
                suggestPrice(
                  result.hpp,
                  recipe.targetMarginBp,
                  0,
                  roundingStep,
                );
              price = currentOrSuggested;
              margin = actualMarginBp(currentOrSuggested, result.hpp, 0);
            } catch {
              price = undefined;
            }
          }
          const aboveTarget =
            margin !== undefined && margin >= recipe.targetMarginBp;
          return (
            <li className="recipe-list-row" key={recipe.id}>
              <Link className="recipe-list-link" to={`/resep/${recipe.id}`}>
                <strong>{recipe.name}</strong>
                <span className="recipe-list-metrics">
                  {hasError ? (
                    <span className="field-error">{result.message}</span>
                  ) : result ? (
                    <>
                      HPP {formatRupiah(result.hpp)}{' '}
                      <span aria-hidden="true">·</span> Harga{' '}
                      {price === undefined ? 'belum ada' : formatRupiah(price)}
                    </>
                  ) : (
                    'Menghitung…'
                  )}
                </span>
              </Link>
              <span
                className={`recipe-margin ${aboveTarget ? 'is-above' : 'is-below'}`}
              >
                <span className="recipe-margin-dot" aria-hidden="true" />
                {margin === undefined
                  ? 'Belum bisa dihitung'
                  : aboveTarget
                    ? 'Di atas target'
                    : 'Di bawah target'}
              </span>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setSelected(recipe);
                  setEditorOpen(true);
                }}
              >
                Ubah
              </button>
            </li>
          );
        })}
      </ul>
      <RecipeEditor
        open={editorOpen}
        recipe={selected}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setSelected(undefined);
        }}
        onSaved={() => setSelected(undefined)}
      />
    </>
  );
}
