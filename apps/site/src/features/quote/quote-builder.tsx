'use client';

import { CalcError, priceForChannel, quoteTotals } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  errorMessage,
  useRecipeResults,
  useRun,
} from '@/components/takaran/data-provider';
import { EmptyState, Page, PageTitle } from '@/components/takaran/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuoteOptionRow } from '@/domain/types';
import { BusinessNameDialog } from '@/features/share/business-name-dialog';
import { renderPng } from '@/features/share/render-png';
import { shareOrDownload } from '@/features/share/share-or-download';
import { quoteCopy } from './copy';
import { QuoteImage } from './quote-image';
import { QuoteOptionForm } from './quote-option-form';

const directFallback = {
  id: 'direct',
  name: 'Langsung',
  kind: 'commission' as const,
  rateBp: 0,
};

export function QuoteBuilder() {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const { recipes, channels, quoteOptions, settings } = snapshot;
  const { businessName, roundingStep } = settings;
  const [recipeId, setRecipeId] = useState('');
  const [portionInput, setPortionInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [optionFormOpen, setOptionFormOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<QuoteOptionRow>();
  const [nameOpen, setNameOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!recipeId && recipes[0]) setRecipeId(recipes[0].id);
  }, [recipes, recipeId]);
  const recipe = recipes.find((item) => item.id === recipeId);
  const recipeKey = recipe?.id;
  const recipePortions = recipe?.yieldPortions;
  useEffect(() => {
    setPortionInput(recipeKey && recipePortions ? String(recipePortions) : '');
    setSelectedIds(new Set());
  }, [recipeKey, recipePortions]);

  const options = useMemo(
    () =>
      quoteOptions
        .filter((option) => option.recipeId === recipeId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [quoteOptions, recipeId],
  );
  const selectedOptions = options.filter((option) =>
    selectedIds.has(option.id),
  );
  const result = recipe ? results.get(recipe.id) : undefined;
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
        channels.find((channel) => channel.name === 'Langsung') ??
          directFallback,
        roundingStep,
      ).price;
      calculation = quoteTotals(
        result.hpp,
        pricePerPortion,
        portions,
        selectedOptions,
      );
    } catch (cause) {
      calculationError =
        cause instanceof Error
          ? cause.message
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

  if (error)
    return (
      <Page>
        <p role="alert">{quoteCopy.loadError}</p>
      </Page>
    );
  if (recipes.length === 0)
    return (
      <Page className="grid gap-4">
        <PageTitle>{quoteCopy.title}</PageTitle>
        <EmptyState
          title="Belum ada resep."
          description={quoteCopy.emptyRecipes}
        >
          <Button asChild>
            <Link href="/dashboard/resep">Buka daftar resep</Link>
          </Button>
        </EmptyState>
      </Page>
    );

  async function download() {
    setMessage('');
    if (!businessName.trim()) {
      setNameOpen(true);
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
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : 'Gambar belum bisa dibuat.',
      );
    } finally {
      setExporting(false);
    }
  }

  async function removeOption(option: QuoteOptionRow) {
    if (!window.confirm(quoteCopy.deleteConfirm)) return;
    try {
      await run({ type: 'quote.delete', id: option.id });
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(option.id);
        return next;
      });
    } catch (cause) {
      setMessage(errorMessage(cause, quoteCopy.saveError));
    }
  }

  return (
    <Page className="grid gap-6">
      <header className="grid gap-2">
        <div className="flex items-center gap-3">
          <PageTitle>{quoteCopy.title}</PageTitle>
          <Badge className="rounded-full bg-peach-100 text-caramel-700">
            Pro
          </Badge>
        </div>
        <p className="max-w-prose text-muted-foreground">
          {quoteCopy.description}
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-8">
        <section
          aria-label="Rincian penawaran"
          className="grid content-start gap-5 rounded-[20px] border border-line bg-surface p-4 sm:p-6"
        >
          <div className="grid gap-1.5">
            <label htmlFor="quote-recipe" className="text-sm font-medium">
              Resep dasar
            </label>
            <Select value={recipeId} onValueChange={setRecipeId}>
              <SelectTrigger id="quote-recipe" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="quote-portions" className="text-sm font-medium">
              Jumlah porsi
            </label>
            <Input
              id="quote-portions"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={portionInput}
              aria-describedby={
                calculationError ? 'quote-calc-error' : undefined
              }
              onChange={(event) => setPortionInput(event.target.value)}
            />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Opsi tambahan</h2>
              <p className="text-sm text-muted-foreground">
                Pilih yang diminta pelanggan.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-full"
              onClick={() => {
                setEditingOption(undefined);
                setOptionFormOpen(true);
              }}
            >
              Tambah opsi
            </Button>
          </div>
          {options.length ? (
            <ul className="divide-y divide-border">
              {options.map((option) => (
                <li
                  key={option.id}
                  className="flex min-h-16 items-center justify-between gap-3 py-2"
                >
                  <label className="flex min-h-11 flex-1 items-center gap-3">
                    <Checkbox
                      checked={selectedIds.has(option.id)}
                      onCheckedChange={(checked) =>
                        setSelectedIds((current) => {
                          const next = new Set(current);
                          if (checked === true) next.add(option.id);
                          else next.delete(option.id);
                          return next;
                        })
                      }
                    />
                    <span>
                      <strong className="block">{option.name}</strong>
                      <small className="text-muted-foreground">
                        + {formatRupiah(option.priceAdd)}
                      </small>
                    </span>
                  </label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11 rounded-full"
                      onClick={() => {
                        setEditingOption(option);
                        setOptionFormOpen(true);
                      }}
                    >
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="min-h-11 rounded-full text-destructive"
                      onClick={() => void removeOption(option)}
                    >
                      Hapus
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              Belum ada opsi untuk resep ini. Tambahkan ukuran, tulisan, atau
              topper.
            </p>
          )}
          {calculationError ? (
            <p
              id="quote-calc-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {calculationError}
            </p>
          ) : null}
          {message ? (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          ) : null}
          {calculation ? (
            <dl className="grid grid-cols-2 gap-4 rounded-[20px] bg-surface-soft p-5">
              <div>
                <dt className="text-sm text-muted-foreground">
                  Harga per porsi
                </dt>
                <dd className="text-lg font-semibold">
                  {formatRupiah(pricePerPortion ?? 0)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Total harga</dt>
                <dd className="text-lg font-semibold">
                  {formatRupiah(calculation.price)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">HPP pesanan</dt>
                <dd className="text-lg font-semibold">
                  {formatRupiah(calculation.cost)}
                </dd>
              </div>
              <div
                className={calculation.profit.lt(0) ? 'text-destructive' : ''}
              >
                <dt className="text-sm">
                  {calculation.profit.lt(0) ? 'Rugi' : 'Untung'}
                </dt>
                <dd className="text-lg font-semibold">
                  {formatRupiah(calculation.profit)}
                </dd>
              </div>
            </dl>
          ) : null}
        </section>
        <section
          aria-labelledby="quote-preview-title"
          className="grid content-start gap-3 rounded-[20px] bg-surface-soft p-4 sm:p-5"
        >
          <h2 id="quote-preview-title" className="text-xl font-semibold">
            Pratinjau untuk pelanggan
          </h2>
          <div className="overflow-hidden rounded-[20px] border border-line bg-surface [&>svg]:h-auto [&>svg]:w-full">
            <QuoteImage
              ref={svgRef}
              businessName={businessName || 'Nama usaha'}
              recipeName={recipe?.name ?? ''}
              portions={portions || recipe?.yieldPortions || 1}
              options={selectedOptions.map(({ name, priceAdd }) => ({
                name,
                priceAdd,
              }))}
              totalPrice={calculation?.price ?? 0}
              date={date}
            />
          </div>
          <Button
            type="button"
            size="lg"
            className="min-h-12 rounded-full"
            disabled={exporting}
            onClick={() => void download()}
          >
            {exporting ? 'Menyiapkan gambar…' : 'Unduh gambar penawaran'}
          </Button>
          <p className="text-sm text-muted-foreground">
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
      <BusinessNameDialog
        open={nameOpen}
        description={quoteCopy.noBusinessName}
        onOpenChange={setNameOpen}
        onSaved={() =>
          setMessage(
            'Nama usaha tersimpan. Tekan “Unduh gambar penawaran” untuk membuat gambar.',
          )
        }
      />
    </Page>
  );
}
