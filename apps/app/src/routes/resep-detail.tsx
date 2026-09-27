import { actualMarginBp, CalcError, suggestPrice } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { RecipeRow } from '../db/schema';
import { FreeLimitError } from '../features/license/limits';
import { HppBreakdown } from '../features/recipes/components/hpp-breakdown';
import { RecipeEditor } from '../features/recipes/components/recipe-editor';
import { recipeCopy } from '../features/recipes/copy';
import { duplicateRecipe } from '../features/recipes/duplicate';
import { claimFirstHppEvent } from '../features/recipes/repository';
import { useRecipeResults } from '../features/recipes/use-recipe-results';
import { setSetting, useSetting } from '../features/settings/repository';
import { track } from '../lib/analytics';

export function ResepDetailRoute() {
  const { id = '' } = useParams();
  const data = useRecipeResults();
  const roundingStep = useSetting('roundingStep');
  const [editing, setEditing] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const navigate = useNavigate();
  const recipe = data?.recipes.find((item) => item.id === id);
  const result = data?.results.get(id);

  useEffect(() => {
    if (id) void setSetting('lastRecipeId', id).catch(() => {});
  }, [id]);
  useEffect(() => {
    if (!id || !result || result instanceof CalcError) return;
    let active = true;
    void claimFirstHppEvent()
      .then((event) => {
        if (active && event.first)
          track('hpp_first_shown', { seconds_bucket: event.secondsBucket });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, result]);

  if (!data)
    return (
      <main className="page">
        <output>Memuat resep…</output>
      </main>
    );
  if (data.error)
    return (
      <main className="page">
        <section className="error-state">
          <h1>Resep belum terbaca.</h1>
          <p>{recipeCopy.loadError}</p>
          <Link className="button" to="/resep">
            Kembali ke resep
          </Link>
        </section>
      </main>
    );
  if (!recipe)
    return (
      <main className="page">
        <section className="error-state">
          <h1>Resep tidak ditemukan.</h1>
          <p>Resep ini mungkin sudah dihapus.</p>
          <Link className="button" to="/resep">
            Kembali ke resep
          </Link>
        </section>
      </main>
    );
  if (result instanceof CalcError)
    return (
      <main className="page">
        <section className="error-state">
          <Link className="back-link" to="/resep">
            Kembali ke resep
          </Link>
          <h1>{recipe.name}</h1>
          <p className="form-error" role="alert">
            {result.code === 'MISSING_REF'
              ? 'Bahan ini sudah dihapus. Ubah resep untuk memperbaikinya.'
              : result.message}
          </p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => setEditing(true)}
          >
            Ubah resep
          </button>
          <RecipeEditor
            open={editing}
            recipe={recipe}
            onOpenChange={setEditing}
            onDeleted={() => navigate('/resep')}
          />
        </section>
      </main>
    );
  if (!result)
    return (
      <main className="page">
        <output>Menghitung HPP…</output>
      </main>
    );
  let price = recipe.currentPrice;
  try {
    price ??= suggestPrice(result.hpp, recipe.targetMarginBp, 0, roundingStep);
  } catch {
    price = null;
  }
  const margin =
    price !== null && price > 0
      ? actualMarginBp(price, result.hpp, 0)
      : undefined;
  async function duplicate() {
    setDuplicateMessage('');
    try {
      const copy = await duplicateRecipe(recipe as RecipeRow);
      navigate(`/resep/${copy.id}`);
    } catch (error) {
      setDuplicateMessage(
        error instanceof FreeLimitError
          ? `${error.message} Takaran Pro, lihat di /beli.`
          : 'Resep belum bisa diduplikasi. Coba lagi.',
      );
    }
  }
  return (
    <main className="page recipe-detail-page">
      <Link className="back-link" to="/resep">
        Kembali ke resep
      </Link>
      <div className="recipe-detail-heading">
        <div>
          <p className="eyebrow">HPP (MODAL PER PORSI)</p>
          <h1>{recipe.name}</h1>
          <p>{recipe.yieldPortions} porsi per adonan</p>
        </div>
        <button
          className="button"
          type="button"
          onClick={() => setEditing(true)}
        >
          Ubah resep
        </button>
        <button
          className="button"
          type="button"
          onClick={() => void duplicate()}
        >
          Duplikat
        </button>
      </div>
      {duplicateMessage && (
        <p className="form-error" role="alert">
          {duplicateMessage}{' '}
          {duplicateMessage.includes('/beli') && (
            <Link to="/beli">Lihat Takaran Pro</Link>
          )}
        </p>
      )}
      <section
        className="recipe-result-summary"
        aria-label="Hasil hitung resep"
      >
        <div>
          <span>HPP per porsi</span>
          <strong>{formatRupiah(result.hpp)}</strong>
        </div>
        <div>
          <span>Harga {recipe.currentPrice ? 'sekarang' : 'saran'}</span>
          <strong>
            {price === null ? 'Belum tersedia' : formatRupiah(price)}
          </strong>
        </div>
        <p
          className={`recipe-margin ${margin !== undefined && margin >= recipe.targetMarginBp ? 'is-above' : 'is-below'}`}
        >
          <span className="recipe-margin-dot" aria-hidden="true" />
          {margin === undefined
            ? 'Harga jual belum diisi'
            : margin >= recipe.targetMarginBp
              ? 'Di atas target'
              : 'Di bawah target'}
          {margin !== undefined
            ? ` · ${(margin / 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`
            : ''}
        </p>
      </section>
      <HppBreakdown
        recipe={recipe}
        result={result}
        price={price ?? result.hpp.toNumber()}
      />
      <RecipeEditor
        open={editing}
        recipe={recipe as RecipeRow}
        onOpenChange={setEditing}
        onDeleted={() => navigate('/resep')}
      />
    </main>
  );
}
