'use client';

import { CalcError, priceForChannel } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  errorMessage,
  useRecipeResults,
  useRun,
} from '@/components/takaran/data-provider';
import { EmptyState, Page, PageTitle } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BusinessNameDialog } from './business-name-dialog';
import { priceListCopy } from './copy';
import {
  type PriceListFormat,
  PriceListImage,
  type PriceListMenu,
  priceListLayoutFits,
} from './price-list-image';
import { renderPng } from './render-png';
import { shareOrDownload } from './share-or-download';

const directFallback = {
  id: 'direct',
  name: 'Langsung',
  kind: 'commission' as const,
  rateBp: 0,
};

export function PriceListBuilder() {
  const requestedRecipeId = useSearchParams().get('recipe');
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const { businessName, roundingStep } = snapshot.settings;
  const isPro = snapshot.plan === 'pro';
  const [format, setFormat] = useState<PriceListFormat>('story');
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showCopyLink, setShowCopyLink] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [message, setMessage] = useState('');
  const [nameInput, setNameInput] = useState(businessName);
  const [nameError, setNameError] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setNameInput(businessName);
  }, [businessName]);

  async function saveBusinessName() {
    const name = nameInput.trim();
    if (!name || name === businessName) return;
    try {
      await run({ type: 'settings.update', values: { businessName: name } });
      setNameError('');
    } catch (cause) {
      setNameError(errorMessage(cause, 'Nama usaha belum tersimpan.'));
    }
  }

  const priced = useMemo(
    () =>
      snapshot.recipes.map((recipe) => {
        try {
          const result = results.get(recipe.id);
          if (!result || result instanceof CalcError)
            return { recipe, price: null };
          const suggested = priceForChannel(
            result.hpp,
            recipe.targetMarginBp,
            null,
            directFallback,
            roundingStep,
          );
          return { recipe, price: recipe.currentPrice ?? suggested.price };
        } catch {
          return { recipe, price: null };
        }
      }),
    [snapshot.recipes, results, roundingStep],
  );

  useEffect(() => {
    if (selectedIds !== null || priced.length === 0) return;
    const requested = priced.find(
      (item) => item.recipe.id === requestedRecipeId && item.price !== null,
    );
    setSelectedIds(
      requested
        ? new Set([requested.recipe.id])
        : new Set(
            priced
              .filter((item) => item.price !== null)
              .map((item) => item.recipe.id),
          ),
    );
  }, [priced, requestedRecipeId, selectedIds]);

  const menus = useMemo<PriceListMenu[]>(
    () =>
      priced.flatMap(({ recipe, price }) =>
        selectedIds?.has(recipe.id) && price !== null
          ? [{ id: recipe.id, name: recipe.name, price }]
          : [],
      ),
    [priced, selectedIds],
  );
  const dimensions =
    format === 'story'
      ? { width: 1080, height: 1920 }
      : { width: 1080, height: 1080 };
  const fits = priceListLayoutFits(menus.length, format);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const shareText = `${businessName} · Lihat daftar harga: ${origin}/?ref=share`;

  if (error)
    return (
      <Page>
        <h1 className="font-display text-3xl font-semibold">
          Daftar harga belum bisa dibuka.
        </h1>
        <p role="alert">{priceListCopy.loadError}</p>
      </Page>
    );
  if (!snapshot.recipes.length)
    return (
      <Page className="grid gap-4">
        <PageTitle>{priceListCopy.title}</PageTitle>
        <EmptyState
          title="Belum ada resep."
          description={priceListCopy.noRecipes}
        >
          <Button asChild>
            <Link href="/dashboard/resep">Buka daftar resep</Link>
          </Button>
        </EmptyState>
      </Page>
    );

  async function createImage(action: 'share' | 'download') {
    setMessage('');
    setShowCopyLink(false);
    setCopyMessage('');
    if (!businessName.trim()) {
      setNameOpen(true);
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
      const filename = `daftar-harga-${format}.png`;
      if (action === 'share') {
        const result = await shareOrDownload(png, filename, {
          title: 'Daftar harga',
          text: shareText,
        });
        setShowCopyLink(result === 'downloaded');
        if (result === 'shared')
          setMessage('Gambar daftar harga siap dibagikan.');
      } else {
        const url = URL.createObjectURL(png);
        try {
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.append(link);
          link.click();
          link.remove();
        } finally {
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        setShowCopyLink(true);
      }
    } catch {
      setMessage(priceListCopy.imageError);
    } finally {
      setExporting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${origin}/?ref=share`);
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
    <Page className="grid gap-6">
      <header>
        <PageTitle>{priceListCopy.title}</PageTitle>
      </header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
        <section
          aria-label="Atur daftar harga"
          className="grid content-start gap-5 rounded-[20px] border border-line bg-surface p-4 sm:p-6"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="price-list-business-name">Nama usaha</Label>
            <Input
              id="price-list-business-name"
              maxLength={60}
              placeholder="Nama usahamu"
              value={nameInput}
              aria-invalid={nameError ? true : undefined}
              onChange={(event) => {
                setNameInput(event.target.value);
                setNameError('');
              }}
              onBlur={() => void saveBusinessName()}
            />
            {nameError ? (
              <p role="alert" className="text-sm text-destructive">
                {nameError}
              </p>
            ) : null}
          </div>
          <fieldset className="grid gap-1">
            <legend className="mb-1 text-sm font-medium">Pilih menu</legend>
            {priced.map(({ recipe, price }) => (
              <label
                key={recipe.id}
                className="flex min-h-11 items-center gap-3"
              >
                <Checkbox
                  checked={selectedIds?.has(recipe.id) ?? false}
                  disabled={price === null}
                  onCheckedChange={(checked) =>
                    toggleMenu(recipe.id, checked === true)
                  }
                />
                <span className="flex-1">{recipe.name}</span>
                <strong className="tabular-nums">
                  {price === null ? 'Belum bisa dihitung' : formatRupiah(price)}
                </strong>
              </label>
            ))}
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Ukuran gambar</legend>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as PriceListFormat)}
            >
              <div className="flex min-h-11 items-center gap-3">
                <RadioGroupItem id="format-story" value="story" />
                <Label htmlFor="format-story">Status · 1080 × 1920</Label>
              </div>
              <div className="flex min-h-11 items-center gap-3">
                <RadioGroupItem id="format-square" value="square" />
                <Label htmlFor="format-square">Feed · 1080 × 1080</Label>
              </div>
            </RadioGroup>
          </fieldset>
          {!fits ? (
            <p role="alert" className="text-sm text-destructive">
              {priceListCopy.tooMany}
            </p>
          ) : null}
          {message ? <output className="text-sm">{message}</output> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              size="lg"
              className="min-h-12 rounded-full"
              disabled={exporting || !menus.length || !fits}
              onClick={() => void createImage('share')}
            >
              {exporting ? 'Menyiapkan gambar…' : 'Bagikan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-12 rounded-full"
              disabled={exporting || !menus.length || !fits}
              onClick={() => void createImage('download')}
            >
              {exporting ? 'Menyiapkan gambar…' : 'Unduh PNG'}
            </Button>
          </div>
          {showCopyLink ? (
            <div className="grid gap-2 rounded-xl bg-secondary p-4">
              <a
                href={`${origin}/?ref=share`}
                className="break-all underline underline-offset-4"
              >
                {origin}/?ref=share
              </a>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => void copyLink()}
              >
                Salin tautan
              </Button>
              {copyMessage ? (
                <output className="text-sm">{copyMessage}</output>
              ) : null}
            </div>
          ) : null}
        </section>
        <section
          aria-labelledby="price-list-preview-title"
          className="grid content-start gap-3 rounded-[20px] bg-surface-soft p-4 sm:p-5"
        >
          <h2 id="price-list-preview-title" className="text-xl font-semibold">
            Pratinjau gambar
          </h2>
          <div
            className={`mx-auto w-full overflow-hidden rounded-[20px] border border-line bg-surface [&>svg]:h-auto [&>svg]:w-full ${
              format === 'story' ? 'max-w-[432px]' : 'max-w-[560px]'
            }`}
          >
            <PriceListImage
              ref={svgRef}
              businessName={businessName || 'Nama usaha'}
              menus={menus}
              format={format}
              isPro={isPro}
              domain={typeof window === 'undefined' ? '' : window.location.host}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Gambar tidak menampilkan HPP, margin, atau untung.
          </p>
        </section>
      </div>
      <BusinessNameDialog
        open={nameOpen}
        description={priceListCopy.noBusinessName}
        onOpenChange={setNameOpen}
        onSaved={() =>
          setMessage(
            'Nama usaha tersimpan. Pilih Bagikan atau Unduh PNG untuk melanjutkan.',
          )
        }
      />
    </Page>
  );
}
