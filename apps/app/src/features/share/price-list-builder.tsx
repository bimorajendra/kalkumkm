import { CalcError, priceForChannel, recalcAll } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { db } from '../../db/db';
import { track } from '../../lib/analytics';
import { hasProLicense } from '../license/limits';
import { setSetting, useSetting } from '../settings/repository';
import { priceListCopy } from './copy';
import {
  type PriceListFormat,
  PriceListImage,
  type PriceListMenu,
  priceListLayoutFits,
} from './price-list-image';
import { renderPng } from './render-png';
import { shareOrDownload } from './share-or-download';
import './price-list.css';

const directChannel = {
  id: 'direct',
  name: 'Langsung',
  kind: 'commission' as const,
  rateBp: 0,
};

export function PriceListBuilder() {
  const [searchParams] = useSearchParams();
  const requestedRecipeId = searchParams.get('recipe');
  const businessName = useSetting('businessName');
  const roundingStep = useSetting('roundingStep');
  const data = useLiveQuery(
    async () => {
      try {
        const [ingredients, recipes] = await Promise.all([
          db.ingredients.toArray(),
          db.recipes.toArray(),
        ]);
        const results = recalcAll({
          ingredients: new Map(ingredients.map((item) => [item.id, item])),
          recipes: new Map(recipes.map((item) => [item.id, item])),
          roundingStep,
        });
        return {
          error: false,
          recipes: recipes.map((recipe) => {
            try {
              const recipeResult = results.get(recipe.id);
              if (!recipeResult || recipeResult instanceof CalcError)
                return { recipe, price: null };
              const result = priceForChannel(
                recipeResult.hpp,
                recipe.targetMarginBp,
                null,
                directChannel,
                roundingStep,
              );
              return { recipe, price: recipe.currentPrice ?? result.price };
            } catch {
              return { recipe, price: null };
            }
          }),
        };
      } catch {
        return { error: true, recipes: [] };
      }
    },
    [roundingStep],
    undefined,
  );
  const [format, setFormat] = useState<PriceListFormat>('story');
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const [isPro, setIsPro] = useState<boolean>();
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showCopyLink, setShowCopyLink] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [message, setMessage] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const nameDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;
    void hasProLicense()
      .then((licensed) => {
        if (active) setIsPro(licensed);
      })
      .catch(() => {
        if (active) setIsPro(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!data || selectedIds !== null) return;
    const requested = data.recipes.find(
      (item) => item.recipe.id === requestedRecipeId && item.price !== null,
    );
    setSelectedIds(
      requested
        ? new Set([requested.recipe.id])
        : new Set(
            data.recipes
              .filter((item) => item.price !== null)
              .map((item) => item.recipe.id),
          ),
    );
  }, [data, requestedRecipeId, selectedIds]);
  useEffect(() => {
    const dialog = nameDialogRef.current;
    if (!dialog) return;
    if (namePromptOpen && !dialog.open) dialog.showModal();
    if (!namePromptOpen && dialog.open) dialog.close();
  }, [namePromptOpen]);

  const menus = useMemo<PriceListMenu[]>(
    () =>
      (data?.recipes ?? []).flatMap(({ recipe, price }) =>
        selectedIds?.has(recipe.id) && price !== null
          ? [{ id: recipe.id, name: recipe.name, price }]
          : [],
      ),
    [data?.recipes, selectedIds],
  );
  const dimensions =
    format === 'story'
      ? { width: 1080, height: 1920 }
      : { width: 1080, height: 1080 };
  const fits = priceListLayoutFits(menus.length, format);
  const shareText = `${businessName} · Lihat daftar harga: ${window.location.origin}/?ref=share`;

  if (!data || isPro === undefined)
    return (
      <main className="page price-list-page">
        <output aria-live="polite">Menyiapkan daftar harga…</output>
      </main>
    );
  if (data.error)
    return (
      <main className="page price-list-page">
        <section className="error-state" role="alert">
          <h1>Daftar harga belum bisa dibuka.</h1>
          <p>{priceListCopy.loadError}</p>
        </section>
      </main>
    );
  if (!data.recipes.length)
    return (
      <main className="page price-list-page">
        <h1>{priceListCopy.title}</h1>
        <section className="empty-state">
          <p>{priceListCopy.noRecipes}</p>
          <Link className="button button-primary" to="/resep">
            Buka daftar resep
          </Link>
        </section>
      </main>
    );

  async function createImage() {
    setMessage('');
    setShowCopyLink(false);
    setCopyMessage('');
    if (!businessName.trim()) {
      setNameInput('');
      setNamePromptOpen(true);
      return;
    }
    if (!menus.length) {
      setMessage('Pilih minimal satu menu yang bisa dihitung.');
      return;
    }
    if (!fits) {
      setMessage(priceListCopy.tooMany);
      return;
    }
    if (!svgRef.current) {
      setMessage(priceListCopy.imageError);
      return;
    }
    setExporting(true);
    try {
      const png = await renderPng(svgRef.current, dimensions);
      track('share_image_created', { format });
      const result = await shareOrDownload(png, `daftar-harga-${format}.png`, {
        title: 'Daftar harga',
        text: shareText,
      });
      setShowCopyLink(result === 'downloaded');
      if (result === 'shared')
        setMessage('Gambar daftar harga siap dibagikan.');
    } catch {
      setMessage(priceListCopy.imageError);
    } finally {
      setExporting(false);
    }
  }

  async function saveBusinessName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = nameInput.trim();
    if (!value || value.length > 120) {
      setNameError(priceListCopy.nameRequired);
      return;
    }
    try {
      await setSetting('businessName', value);
      setNamePromptOpen(false);
      setNameError('');
      setMessage(
        'Nama usaha tersimpan. Tekan “Buat gambar daftar harga” untuk melanjutkan.',
      );
    } catch {
      setNameError(priceListCopy.nameSaveError);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/?ref=share`,
      );
      setCopyMessage(priceListCopy.copied);
    } catch {
      setCopyMessage(priceListCopy.copyError);
    }
  }

  function toggleMenu(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current ?? []);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setMessage('');
    setShowCopyLink(false);
  }

  return (
    <main className="page price-list-page">
      <header className="price-list-heading">
        <div>
          <div className="eyebrow">BAGIKAN KE PELANGGAN</div>
          <h1>{priceListCopy.title}</h1>
          <p>{priceListCopy.description}</p>
        </div>
      </header>
      <div className="price-list-layout">
        <section className="price-list-controls" aria-label="Atur daftar harga">
          <fieldset>
            <legend>Pilih menu</legend>
            <div className="price-list-menu-list">
              {data.recipes.map(({ recipe, price }) => (
                <label className="price-list-menu" key={recipe.id}>
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(recipe.id) ?? false}
                    disabled={price === null}
                    onChange={(event) =>
                      toggleMenu(recipe.id, event.target.checked)
                    }
                  />
                  <span>{recipe.name}</span>
                  <strong>
                    {price === null
                      ? 'Belum bisa dihitung'
                      : formatRupiah(price)}
                  </strong>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Ukuran gambar</legend>
            <div className="price-list-formats">
              <label>
                <input
                  type="radio"
                  name="price-list-format"
                  value="story"
                  checked={format === 'story'}
                  onChange={() => setFormat('story')}
                />
                <span>Status · 1080 × 1920</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="price-list-format"
                  value="square"
                  checked={format === 'square'}
                  onChange={() => setFormat('square')}
                />
                <span>Feed · 1080 × 1080</span>
              </label>
            </div>
          </fieldset>
          {!fits ? (
            <p className="form-error" role="alert">
              {priceListCopy.tooMany}
            </p>
          ) : null}
          {message ? (
            <output className="price-list-message">{message}</output>
          ) : null}
          <button
            className="button button-primary price-list-create"
            type="button"
            disabled={exporting || !menus.length || !fits}
            onClick={() => void createImage()}
          >
            {exporting ? 'Menyiapkan gambar…' : 'Buat gambar daftar harga'}
          </button>
          {showCopyLink ? (
            <div className="price-list-copy-link">
              <a href={`${window.location.origin}/?ref=share`}>
                {window.location.origin}/?ref=share
              </a>
              <button
                className="button"
                type="button"
                onClick={() => void copyLink()}
              >
                Salin tautan
              </button>
              {copyMessage ? <output>{copyMessage}</output> : null}
            </div>
          ) : null}
        </section>
        <section
          className="price-list-preview-section"
          aria-labelledby="price-list-preview-title"
        >
          <h2 id="price-list-preview-title">Pratinjau gambar</h2>
          <div className={`price-list-preview price-list-preview--${format}`}>
            <PriceListImage
              ref={svgRef}
              businessName={businessName || 'Nama usaha'}
              menus={menus}
              format={format}
              isPro={isPro}
              domain={window.location.host}
            />
          </div>
          <p className="price-list-note">
            Gambar tidak menampilkan HPP, margin, atau untung.
          </p>
        </section>
      </div>
      <dialog
        ref={nameDialogRef}
        className="ingredient-dialog"
        aria-labelledby="price-list-name-title"
        onCancel={(event) => {
          event.preventDefault();
          setNamePromptOpen(false);
        }}
      >
        <form className="ingredient-form" onSubmit={saveBusinessName}>
          <div className="ingredient-form-heading">
            <h2 id="price-list-name-title">Nama usaha</h2>
            <button
              className="icon-button"
              type="button"
              aria-label="Tutup"
              onClick={() => setNamePromptOpen(false)}
            >
              ×
            </button>
          </div>
          <p>{priceListCopy.noBusinessName}</p>
          <label
            className="ingredient-label"
            htmlFor="price-list-business-name"
          >
            Nama usaha
            <input
              id="price-list-business-name"
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
