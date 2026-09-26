import {
  actualMarginBp,
  CalcError,
  markupBp,
  profitPerHour,
  profitPerPortion,
  type RecipeResult,
  suggestPrice,
} from '@takaran/calc';
import { formatRupiah } from '@takaran/ui';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { db } from '../db/db';
import type { RecipeRow } from '../db/schema';
import { CalculatorResult } from '../features/pricing/components/calculator-result';
import { CurrentPriceInput } from '../features/pricing/components/current-price-input';
import { MarginNote } from '../features/pricing/components/margin-note';
import { RecipePicker } from '../features/pricing/components/recipe-picker';
import { SliderPanel } from '../features/pricing/components/slider-panel';
import { pricingCopy } from '../features/pricing/copy';
import { useCalculator } from '../features/pricing/use-calculator';
import { updateRecipe } from '../features/recipes/repository';
import { useRecipeResults } from '../features/recipes/use-recipe-results';
import { setSetting, useSetting } from '../features/settings/repository';

export function HitungRoute() {
  const data = useRecipeResults();
  const lastRecipeId = useSetting('lastRecipeId');
  const recipe =
    data.recipes.find((item) => item.id === lastRecipeId) ?? data.recipes[0];

  useEffect(() => {
    if (recipe && recipe.id !== lastRecipeId)
      void setSetting('lastRecipeId', recipe.id);
  }, [lastRecipeId, recipe]);

  if (data.error)
    return (
      <main className="page">
        <p role="alert">
          Data resep tidak bisa dibuka. Muat ulang aplikasi untuk mencoba lagi.
        </p>
      </main>
    );
  if (!recipe) {
    return (
      <main className="page">
        <section aria-labelledby="page-title" className="empty-state">
          <div
            aria-label="Ilustrasi konsep loyang brownies kosong"
            className="pan-motif"
            role="img"
          >
            <span />
          </div>
          <div className="eyebrow">KALKULATOR HPP</div>
          <h1 id="page-title">Mulai dari satu resep.</h1>
          <p>Pakai contoh brownies atau buat sendiri.</p>
          <div className="actions">
            <Link className="button button-primary" to="/resep">
              Lihat resep
            </Link>
            <Link className="button" to="/bahan">
              Tambah bahan
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <CalculatorScreen
      data={data}
      recipes={data.recipes}
      recipe={recipe}
      onSelect={(next) => void setSetting('lastRecipeId', next.id)}
    />
  );
}

function CalculatorScreen({
  data,
  onSelect,
  recipe,
  recipes,
}: {
  data: NonNullable<ReturnType<typeof useRecipeResults>>;
  onSelect: (recipe: RecipeRow) => void;
  recipe: RecipeRow;
  recipes: RecipeRow[];
}) {
  const calculator = useCalculator(recipe);
  const roundingStep = useSetting('roundingStep');
  const result = data.results.get(recipe.id);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsDragStart = useRef<number | null>(null);

  useEffect(() => {
    const dialog = document.querySelector<HTMLDialogElement>(
      '.calculator-details',
    );
    if (!dialog) return;
    if (detailsOpen && !dialog.open) dialog.showModal();
    if (!detailsOpen && dialog.open) dialog.close();
  }, [detailsOpen]);

  async function savePrice(price: number) {
    const latest = await db.recipes.get(recipe.id);
    if (!latest) throw new Error('Resep tidak ditemukan.');
    if (latest.currentPrice !== price)
      await updateRecipe(recipe.id, { ...latest, currentPrice: price });
  }

  if (result === undefined)
    return (
      <main className="page" aria-live="polite">
        Menghitung HPP…
      </main>
    );
  if (result instanceof CalcError) {
    const message =
      result.code === 'MARGIN_TOO_HIGH'
        ? pricingCopy.fixMargin
        : result.code === 'MISSING_REF'
          ? pricingCopy.missingIngredient
          : result.code === 'UNIT_MISMATCH' || result.code === 'INVALID_YIELD'
            ? pricingCopy.invalidRecipe
            : pricingCopy.genericError;
    return (
      <main className="page">
        <RecipePicker
          onSelect={onSelect}
          recipes={recipes}
          selectedId={recipe.id}
        />
        <section className="calculator-error" role="alert">
          <h1>Belum bisa menghitung resep ini</h1>
          <p>{message}</p>
          <Link className="button" to={`/resep/${recipe.id}`}>
            Periksa resep
          </Link>
        </section>
      </main>
    );
  }

  let price: number;
  let actualMargin: number;
  let markup: number;
  let hourlyProfit: RecipeResult['hpp'] | null;
  try {
    price = suggestPrice(
      result.hpp,
      calculator.targetMarginBp,
      0,
      roundingStep,
    );
    actualMargin = price > 0 ? actualMarginBp(price, result.hpp, 0) : 0;
    markup = result.hpp.gt(0) ? markupBp(price, result.hpp) : 0;
    hourlyProfit =
      calculator.laborMinutesPerBatch > 0
        ? profitPerHour(
            price,
            result.hpp,
            0,
            recipe.yieldPortions,
            calculator.laborMinutesPerBatch,
          )
        : null;
  } catch (error) {
    const message =
      error instanceof CalcError
        ? pricingCopy.fixMargin
        : pricingCopy.genericError;
    return (
      <main className="page">
        <p className="calculator-error" role="alert">
          {message}
        </p>
      </main>
    );
  }

  const layers = [
    {
      key: 'ingredients',
      label: 'Bahan',
      value: result.breakdown.ingredients.plus(result.breakdown.subRecipes),
    },
    { key: 'energy', label: 'Energi', value: result.breakdown.energy },
    { key: 'labor', label: 'Tenaga', value: result.breakdown.labor },
    { key: 'packaging', label: 'Kemasan', value: result.breakdown.packaging },
  ].filter((layer) => layer.value.gt(0));
  if (layers.length === 0)
    layers.push({ key: 'ingredients', label: 'Biaya', value: result.hpp });

  return (
    <main className="page calculator-page">
      <section className="calculator-inputs" aria-labelledby="calculator-title">
        <RecipePicker
          onSelect={onSelect}
          recipes={recipes}
          selectedId={recipe.id}
        />
        <h1 id="calculator-title">
          Hitung untung {recipe.name.toLocaleLowerCase('id-ID')}
        </h1>
        <section aria-labelledby="cost-title" className="cost-summary">
          <h2 id="cost-title">Rincian biaya</h2>
          <p>
            Bahan{' '}
            {formatRupiah(
              result.breakdown.ingredients.plus(result.breakdown.subRecipes),
            )}{' '}
            + energi {formatRupiah(result.breakdown.energy)} + kemasan{' '}
            {formatRupiah(result.breakdown.packaging)}
          </p>
          <p>
            HPP <strong>{formatRupiah(result.hpp)}</strong> per potong ·{' '}
            {recipe.yieldPortions} potong per adonan
          </p>
        </section>
        <SliderPanel
          laborMinutesPerBatch={calculator.laborMinutesPerBatch}
          onLaborMinutesChange={calculator.setLaborMinutesPerBatch}
          onTargetMarginChange={calculator.setTargetMarginBp}
          targetMarginBp={calculator.targetMarginBp}
        />
        {calculator.saveError ? (
          <p className="form-error" role="alert">
            Pengaturan belum tersimpan. Coba geser lagi.
          </p>
        ) : null}
        <CurrentPriceInput
          currentPrice={recipe.currentPrice}
          hpp={result.hpp}
          key={recipe.id}
          onSave={savePrice}
          targetMarginBp={calculator.targetMarginBp}
        />
        {result.hpp.gt(0) && price > 0 ? (
          <MarginNote
            marginBp={actualMargin}
            markupBp={markup}
            price={price}
            profit={profitPerPortion(price, result.hpp, 0)}
          />
        ) : null}
      </section>
      <aside aria-label="Hasil kalkulasi" className="calculator-result-desktop">
        <CalculatorResult
          hpp={result.hpp}
          hourlyProfit={hourlyProfit}
          laborMinutes={calculator.laborMinutesPerBatch}
          laborRatePerHour={recipe.laborRatePerHour}
          layers={layers}
          marginBp={actualMargin}
          markupBp={markup}
          onSavePrice={() => savePrice(price)}
          price={price}
          targetMarginBp={calculator.targetMarginBp}
        />
      </aside>
      <div className="calculator-result-mobile">
        <CalculatorResult
          compact
          hpp={result.hpp}
          hourlyProfit={hourlyProfit}
          laborMinutes={calculator.laborMinutesPerBatch}
          laborRatePerHour={recipe.laborRatePerHour}
          layers={layers}
          marginBp={actualMargin}
          markupBp={markup}
          onDetails={() => setDetailsOpen(true)}
          onSavePrice={() => savePrice(price)}
          price={price}
          targetMarginBp={calculator.targetMarginBp}
        />
      </div>
      <dialog
        aria-labelledby="calculator-details-title"
        className="calculator-details"
        onClose={() => setDetailsOpen(false)}
      >
        <div
          className="calculator-details__heading"
          onTouchStart={(event) => {
            detailsDragStart.current = event.touches[0]?.clientY ?? null;
          }}
          onTouchEnd={(event) => {
            const start = detailsDragStart.current;
            const end = event.changedTouches[0]?.clientY ?? start ?? 0;
            detailsDragStart.current = null;
            if (start !== null && end - start > 80) setDetailsOpen(false);
          }}
        >
          <h2 id="calculator-details-title">Hasil lengkap</h2>
          <button
            aria-label="Tutup detail"
            className="icon-button"
            onClick={() => setDetailsOpen(false)}
            type="button"
          >
            ×
          </button>
        </div>
        <CalculatorResult
          hpp={result.hpp}
          hourlyProfit={hourlyProfit}
          laborMinutes={calculator.laborMinutesPerBatch}
          laborRatePerHour={recipe.laborRatePerHour}
          layers={layers}
          marginBp={actualMargin}
          markupBp={markup}
          onSavePrice={() => savePrice(price)}
          price={price}
          targetMarginBp={calculator.targetMarginBp}
        />
      </dialog>
      {result.hpp.lte(0) ? (
        <p className="sr-only">{pricingCopy.emptyCost}</p>
      ) : null}
    </main>
  );
}
