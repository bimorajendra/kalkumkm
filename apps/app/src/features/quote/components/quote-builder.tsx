import {
  CalcError,
  priceForChannel,
  quoteTotals,
  recalcAll,
} from '@takaran/calc';
import { formatRupiah } from '@takaran/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { db } from '../../../db/db';
import type { QuoteOptionRow } from '../../../db/schema';
import { setSetting, useSetting } from '../../settings/repository';
import { renderPng } from '../../share/render-png';
import { shareOrDownload } from '../../share/share-or-download';
import { quoteCopy } from '../copy';
import { deleteQuoteOption } from '../repository';
import { QuoteImage } from './quote-image';
import { QuoteOptionForm } from './quote-option-form';
import './quote.css';

const directChannel = {
  id: 'direct',
  name: 'Langsung',
  kind: 'commission' as const,
  rateBp: 0,
};

export function QuoteBuilder() {
  const data = useLiveQuery(
    async () => {
      try {
        const [ingredients, recipes, channels] = await Promise.all([
          db.ingredients.toArray(),
          db.recipes.toArray(),
          db.channels.toArray(),
        ]);
        return {
          error: false,
          recipes,
          channels,
          results: recalcAll({
            ingredients: new Map(ingredients.map((row) => [row.id, row])),
            recipes: new Map(recipes.map((row) => [row.id, row])),
            roundingStep: 500,
          }),
        };
      } catch {
        return { error: true, recipes: [], channels: [], results: new Map() };
      }
    },
    [],
    undefined,
  );
  const businessName = useSetting('businessName');
  const roundingStep = useSetting('roundingStep');
  const [recipeId, setRecipeId] = useState('');
  const [portionInput, setPortionInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [optionFormOpen, setOptionFormOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<QuoteOptionRow>();
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const nameDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!recipeId && data?.recipes[0]) setRecipeId(data.recipes[0].id);
  }, [data?.recipes, recipeId]);
  const recipe = data?.recipes.find((item) => item.id === recipeId);
  const selectedRecipeId = recipe?.id;
  const selectedYieldPortions = recipe?.yieldPortions;
  useEffect(() => {
    setPortionInput(
      selectedRecipeId && selectedYieldPortions
        ? String(selectedYieldPortions)
        : '',
    );
    setSelectedIds(new Set());
  }, [selectedRecipeId, selectedYieldPortions]);
  useEffect(() => {
    const dialog = nameDialogRef.current;
    if (!dialog) return;
    if (namePromptOpen && !dialog.open) dialog.showModal();
    if (!namePromptOpen && dialog.open) dialog.close();
  }, [namePromptOpen]);
  const options = useLiveQuery(
    () =>
      recipeId
        ? db.quoteOptions.where('recipeId').equals(recipeId).toArray()
        : Promise.resolve<QuoteOptionRow[]>([]),
    [recipeId],
    [] as QuoteOptionRow[],
  );
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedIds.has(option.id)),
    [options, selectedIds],
  );
  const result = recipe ? data?.results.get(recipe.id) : undefined;
  const portions = /^\d+$/.test(portionInput) ? Number(portionInput) : 0;
  let calculation: ReturnType<typeof quoteTotals> | undefined;
  let pricePerPortion: number | undefined;
  let calculationError = '';
  if (recipe && result && !(result instanceof CalcError)) {
    try {
      pricePerPortion = priceForChannel(
        result.hpp,
        recipe.targetMarginBp,
        null,
        data?.channels.find((channel) => channel.name === 'Langsung') ??
          directChannel,
        roundingStep,
      ).price;
      calculation = quoteTotals(
        result.hpp,
        pricePerPortion,
        portions,
        selectedOptions,
      );
    } catch (error) {
      calculationError =
        error instanceof Error
          ? error.message
          : 'Penawaran belum bisa dihitung.';
    }
  } else if (result instanceof CalcError) {
    calculationError = result.message;
  }
  const today = new Date();
  const date = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today);
  const optionsForImage = selectedOptions.map(({ name, priceAdd }) => ({
    name,
    priceAdd,
  }));

  if (!data)
    return (
      <main className="page quote-page">
        <output aria-live="polite">Menyiapkan penawaran…</output>
      </main>
    );
  if (data.error)
    return (
      <main className="page quote-page">
        <section className="error-state" role="alert">
          <h1>Penawaran belum terbaca.</h1>
          <p>{quoteCopy.loadError}</p>
        </section>
      </main>
    );
  if (data.recipes.length === 0)
    return (
      <main className="page quote-page">
        <h1>{quoteCopy.title}</h1>
        <section className="quote-empty empty-state">
          <div className="pan-motif tray" aria-hidden="true">
            <span />
          </div>
          <p>{quoteCopy.emptyRecipes}</p>
          <Link className="button button-primary" to="/resep">
            Buka daftar resep
          </Link>
        </section>
      </main>
    );

  async function download() {
    setMessage('');
    if (!businessName.trim()) {
      setNameInput('');
      setNamePromptOpen(true);
      return;
    }
    if (!calculation || !svgRef.current) {
      setMessage(
        calculationError || 'Lengkapi jumlah porsi sebelum membuat gambar.',
      );
      return;
    }
    setExporting(true);
    try {
      const png = await renderPng(svgRef.current);
      await shareOrDownload(
        png,
        `penawaran-${[
          today.getFullYear(),
          String(today.getMonth() + 1).padStart(2, '0'),
          String(today.getDate()).padStart(2, '0'),
        ].join('-')}.png`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Gambar belum bisa dibuat.',
      );
    } finally {
      setExporting(false);
    }
  }

  async function saveBusinessName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = nameInput.trim();
    if (!value || value.length > 120) {
      setNameError('Nama usaha wajib diisi, maksimal 120 karakter.');
      return;
    }
    try {
      await setSetting('businessName', value);
      setNamePromptOpen(false);
      setNameError('');
      setMessage(
        'Nama usaha tersimpan. Tekan “Unduh gambar penawaran” untuk membuat gambar.',
      );
    } catch {
      setNameError('Nama usaha belum tersimpan. Coba lagi.');
    }
  }

  async function removeOption(option: QuoteOptionRow) {
    if (!window.confirm(quoteCopy.deleteConfirm)) return;
    try {
      await deleteQuoteOption(option.id);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(option.id);
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : quoteCopy.saveError);
    }
  }

  return (
    <main className="page quote-page">
      <header className="quote-heading">
        <div>
          <div className="eyebrow">PESANAN CUSTOM</div>
          <h1>{quoteCopy.title}</h1>
          <p>{quoteCopy.description}</p>
        </div>
      </header>
      <div className="quote-layout">
        <section className="quote-controls" aria-label="Rincian penawaran">
          <label className="ingredient-label" htmlFor="quote-recipe">
            Resep dasar
            <select
              id="quote-recipe"
              value={recipeId}
              onChange={(event) => setRecipeId(event.target.value)}
            >
              {data.recipes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="ingredient-label" htmlFor="quote-portions">
            Jumlah porsi
            <input
              id="quote-portions"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={portionInput}
              onChange={(event) => setPortionInput(event.target.value)}
              aria-describedby={
                calculationError ? 'quote-calc-error' : undefined
              }
            />
          </label>
          <div className="quote-options-heading">
            <div>
              <h2>Opsi tambahan</h2>
              <p>Pilih yang diminta pelanggan.</p>
            </div>
            <button
              className="button"
              type="button"
              onClick={() => {
                setEditingOption(undefined);
                setOptionFormOpen(true);
              }}
            >
              Tambah opsi
            </button>
          </div>
          {options.length ? (
            <ul className="quote-option-list">
              {options.map((option) => (
                <li key={option.id}>
                  <label className="quote-option-choice">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(option.id)}
                      onChange={(event) =>
                        setSelectedIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(option.id);
                          else next.delete(option.id);
                          return next;
                        })
                      }
                    />
                    <span>
                      <strong>{option.name}</strong>
                      <small>+ {formatRupiah(option.priceAdd)}</small>
                    </span>
                  </label>
                  <div className="quote-option-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOption(option);
                        setOptionFormOpen(true);
                      }}
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeOption(option)}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="quote-options-empty">
              Belum ada opsi untuk resep ini. Tambahkan ukuran, tulisan, atau
              topper.
            </p>
          )}
          {calculationError ? (
            <p className="form-error" id="quote-calc-error" role="alert">
              {calculationError}
            </p>
          ) : null}
          {message ? (
            <p className="form-error" role="alert">
              {message}
            </p>
          ) : null}
          {calculation ? (
            <dl className="quote-totals">
              <div>
                <dt>Harga per porsi</dt>
                <dd>{formatRupiah(pricePerPortion ?? 0)}</dd>
              </div>
              <div>
                <dt>Total harga</dt>
                <dd>{formatRupiah(calculation.price)}</dd>
              </div>
              <div>
                <dt>HPP pesanan</dt>
                <dd>{formatRupiah(calculation.cost)}</dd>
              </div>
              <div
                className={
                  calculation.profit.lt(0)
                    ? 'quote-profit is-loss'
                    : 'quote-profit'
                }
              >
                <dt>{calculation.profit.lt(0) ? 'Rugi' : 'Untung'}</dt>
                <dd>{formatRupiah(calculation.profit)}</dd>
              </div>
            </dl>
          ) : null}
        </section>
        <section
          className="quote-preview-section"
          aria-labelledby="quote-preview-title"
        >
          <h2 id="quote-preview-title">Pratinjau untuk pelanggan</h2>
          <div className="quote-preview">
            <QuoteImage
              ref={svgRef}
              businessName={businessName || 'Nama usaha'}
              recipeName={recipe?.name ?? ''}
              portions={portions || recipe?.yieldPortions || 1}
              options={optionsForImage}
              totalPrice={calculation?.price ?? 0}
              date={date}
            />
          </div>
          <button
            className="button button-primary quote-download"
            type="button"
            disabled={exporting}
            onClick={() => void download()}
          >
            {exporting ? 'Menyiapkan gambar…' : 'Unduh gambar penawaran'}
          </button>
          <p className="quote-preview-note">
            Pratinjau tidak menampilkan HPP atau untung.
          </p>
        </section>
      </div>
      <QuoteOptionForm
        recipeId={recipeId}
        open={optionFormOpen}
        option={editingOption}
        onOpenChange={setOptionFormOpen}
        onSaved={() => setMessage(quoteCopy.saved)}
      />
      <dialog
        ref={nameDialogRef}
        className="ingredient-dialog"
        aria-labelledby="quote-business-name-title"
        onCancel={(event) => {
          event.preventDefault();
          setNamePromptOpen(false);
        }}
      >
        <form className="ingredient-form" onSubmit={saveBusinessName}>
          <div className="ingredient-form-heading">
            <h2 id="quote-business-name-title">Nama usaha</h2>
            <button
              className="icon-button"
              type="button"
              aria-label="Tutup"
              onClick={() => setNamePromptOpen(false)}
            >
              ×
            </button>
          </div>
          <p>{quoteCopy.noBusinessName}</p>
          <label className="ingredient-label" htmlFor="quote-business-name">
            Nama usaha
            <input
              id="quote-business-name"
              maxLength={120}
              autoFocus
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              aria-invalid={Boolean(nameError)}
            />
            {nameError ? (
              <span className="field-error">{nameError}</span>
            ) : null}
          </label>
          <div className="ingredient-form-actions">
            <button
              className="button"
              type="button"
              onClick={() => setNamePromptOpen(false)}
            >
              Batal
            </button>
            <button className="button button-primary" type="submit">
              Simpan nama
            </button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
