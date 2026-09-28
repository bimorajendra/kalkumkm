'use client';

import {
  actualMarginBp,
  CalcError,
  markupBp,
  priceForChannel,
  profitPerHour,
  profitPerPortion,
  type RecipeResult,
} from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  type Results,
  useRecipeResults,
  useRun,
} from '@/components/takaran/data-provider';
import { EmptyState, Page } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ChannelRow, RecipeRow, Snapshot } from '@/domain/types';
import { ChannelPriceTable } from '@/features/channels/channel-price-table';
import { MarginAlarm } from '@/features/margin-alarm/margin-alarm';
import { CalculatorResult } from './calculator-result';
import { pricingCopy } from './copy';
import { CurrentPriceInput } from './current-price-input';
import { RecipePicker } from './recipe-picker';
import { SliderPanel } from './slider-panel';
import { useCalculator } from './use-calculator';

export function HitungScreen() {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const { recipes, settings } = snapshot;
  const recipe =
    recipes.find((item) => item.id === settings.lastRecipeId) ?? recipes[0];

  useEffect(() => {
    if (recipe && recipe.id !== settings.lastRecipeId)
      void run({
        type: 'settings.update',
        values: { lastRecipeId: recipe.id },
      }).catch(() => {});
  }, [recipe, settings.lastRecipeId, run]);

  if (error)
    return (
      <Page>
        <p role="alert">
          Data resep tidak bisa dibuka. Muat ulang halaman untuk mencoba lagi.
        </p>
      </Page>
    );
  if (!recipe)
    return (
      <Page>
        <EmptyState
          title="Mulai dari satu resep."
          description="Pakai contoh brownies atau buat sendiri."
        >
          <Button asChild>
            <Link href="/dashboard/resep">Lihat resep</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/bahan">Tambah bahan</Link>
          </Button>
        </EmptyState>
      </Page>
    );
  return (
    <CalculatorScreen
      snapshot={snapshot}
      results={results}
      recipe={recipe}
      onSelect={(next) =>
        void run({ type: 'settings.update', values: { lastRecipeId: next.id } })
      }
    />
  );
}

function CalculatorScreen({
  snapshot,
  results,
  recipe,
  onSelect,
}: {
  snapshot: Snapshot;
  results: Results;
  recipe: RecipeRow;
  onSelect: (recipe: RecipeRow) => void;
}) {
  const run = useRun();
  const { channels, recipes, settings } = snapshot;
  const { roundingStep } = settings;
  const calculator = useCalculator(recipe);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const directChannel =
    channels.find((channel) => channel.name === 'Langsung') ?? channels[0];
  const selectedChannel: ChannelRow | undefined =
    channels.find((channel) => channel.id === selectedChannelId) ??
    directChannel;
  const result = results.get(recipe.id);

  async function savePrice(price: number) {
    if (recipe.currentPrice !== price)
      await run({
        type: 'recipe.patch',
        id: recipe.id,
        patch: { currentPrice: price },
      });
  }

  if (result === undefined)
    return (
      <Page>
        <output aria-live="polite">Menghitung HPP…</output>
      </Page>
    );
  if (!selectedChannel || !directChannel)
    return (
      <Page>
        <output aria-live="polite">Menyiapkan saluran jual…</output>
      </Page>
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
      <Page className="grid gap-4">
        <div>
          <RecipePicker
            onSelect={onSelect}
            recipes={recipes}
            selectedId={recipe.id}
          />
        </div>
        <section role="alert" className="grid justify-items-start gap-3">
          <h1 className="font-display text-3xl font-semibold">
            Belum bisa menghitung resep ini
          </h1>
          <p>{message}</p>
          <Button asChild>
            <Link href={`/dashboard/resep/${recipe.id}`}>Periksa resep</Link>
          </Button>
        </section>
      </Page>
    );
  }

  let price = 0;
  let actualMargin = 0;
  let markup = 0;
  let hourlyProfit: RecipeResult['hpp'] | null = null;
  let channelError = '';
  const commissionBp =
    selectedChannel.kind === 'commission' ? selectedChannel.rateBp : 0;
  try {
    const directSuggested = priceForChannel(
      result.hpp,
      calculator.targetMarginBp,
      null,
      directChannel,
      roundingStep,
    ).price;
    const retailPrice = recipe.currentPrice ?? directSuggested;
    const channelResult = priceForChannel(
      result.hpp,
      calculator.targetMarginBp,
      retailPrice,
      selectedChannel,
      roundingStep,
    );
    price =
      selectedChannel.id === directChannel.id && recipe.currentPrice !== null
        ? recipe.currentPrice
        : channelResult.price;
    actualMargin =
      price > 0
        ? price === channelResult.price
          ? channelResult.marginBp
          : actualMarginBp(price, result.hpp, commissionBp)
        : 0;
    markup = result.hpp.gt(0) ? markupBp(price, result.hpp) : 0;
    hourlyProfit =
      calculator.laborMinutesPerBatch > 0
        ? profitPerHour(
            price,
            result.hpp,
            commissionBp,
            recipe.yieldPortions,
            calculator.laborMinutesPerBatch,
          )
        : null;
  } catch (error) {
    channelError =
      error instanceof CalcError && error.code === 'MARGIN_TOO_HIGH'
        ? 'Komisi terlalu besar untuk target untung ini.'
        : pricingCopy.genericError;
  }

  const ingredientsCost = result.breakdown.ingredients.plus(
    result.breakdown.subRecipes,
  );
  const layers = [
    { key: 'ingredients', label: 'Bahan', value: ingredientsCost },
    { key: 'energy', label: 'Energi', value: result.breakdown.energy },
    { key: 'labor', label: 'Tenaga', value: result.breakdown.labor },
    { key: 'packaging', label: 'Kemasan', value: result.breakdown.packaging },
  ].filter((layer) => layer.value.gt(0));
  if (layers.length === 0)
    layers.push({ key: 'ingredients', label: 'Biaya', value: result.hpp });

  const resultCard = (compact: boolean, onDetails?: () => void) =>
    channelError ? (
      <p role="alert" className="rounded-xl bg-card p-4 text-destructive">
        {channelError}
      </p>
    ) : (
      <CalculatorResult
        compact={compact}
        onDetails={onDetails}
        canSavePrice={
          selectedChannel.id === directChannel.id &&
          recipe.currentPrice === null
        }
        channelName={selectedChannel.name}
        commissionBp={commissionBp}
        hpp={result.hpp}
        hourlyProfit={hourlyProfit}
        laborMinutes={calculator.laborMinutesPerBatch}
        laborRatePerHour={recipe.laborRatePerHour}
        layers={layers}
        marginBp={actualMargin}
        markupBp={markup}
        onSavePrice={() => savePrice(price)}
        price={price}
        recipeId={recipe.id}
        targetMarginBp={calculator.targetMarginBp}
      />
    );

  const channelTable = (idSuffix: string) => (
    <ChannelPriceTable
      idSuffix={idSuffix}
      channels={channels}
      hpp={result.hpp}
      targetMarginBp={calculator.targetMarginBp}
      currentPrice={recipe.currentPrice}
      roundingStep={roundingStep}
    />
  );

  return (
    <Page className="grid gap-6 pb-56 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-12 lg:pb-12">
      <div className="grid content-start gap-5">
        <MarginAlarm />
        <section aria-labelledby="calculator-title" className="grid gap-5">
          <div>
            <RecipePicker
              onSelect={onSelect}
              recipes={recipes}
              selectedId={recipe.id}
            />
          </div>
          <h1
            id="calculator-title"
            className="font-display text-[34px] font-bold leading-[38px] lg:text-[44px] lg:leading-[48px]"
          >
            Hitung untung {recipe.name.toLocaleLowerCase('id-ID')}
          </h1>
          <section aria-labelledby="cost-title" className="grid gap-1">
            <h2 id="cost-title" className="text-xl font-semibold">
              Rincian biaya
            </h2>
            <p>
              Bahan {formatRupiah(ingredientsCost)} + energi{' '}
              {formatRupiah(result.breakdown.energy)} + kemasan{' '}
              {formatRupiah(result.breakdown.packaging)}
            </p>
            <p>
              HPP (modal per potong) <strong>{formatRupiah(result.hpp)}</strong>{' '}
              · {recipe.yieldPortions} potong per adonan
            </p>
          </section>
          <SliderPanel
            channels={channels}
            selectedChannelId={selectedChannel.id}
            onChannelChange={setSelectedChannelId}
            laborMinutesPerBatch={calculator.laborMinutesPerBatch}
            onLaborMinutesChange={calculator.setLaborMinutesPerBatch}
            onTargetMarginChange={calculator.setTargetMarginBp}
            targetMarginBp={calculator.targetMarginBp}
          />
          {calculator.saveError ? (
            <p role="alert" className="text-sm text-destructive">
              Pengaturan belum tersimpan. Coba geser lagi.
            </p>
          ) : null}
          <CurrentPriceInput
            key={recipe.id}
            currentPrice={recipe.currentPrice}
            hpp={result.hpp}
            targetMarginBp={calculator.targetMarginBp}
            onSave={savePrice}
          />
          {!channelError && result.hpp.gt(0) && price > 0 ? (
            <p className="rounded-xl border border-input/40 bg-card p-4 text-sm">
              Markup {formatPercent(markup)} artinya harga jual{' '}
              {formatPercent(markup)} di atas modal. Margin{' '}
              {formatPercent(actualMargin)} artinya dari setiap{' '}
              {formatRupiah(price)} yang kamu terima,{' '}
              {formatRupiah(profitPerPortion(price, result.hpp, commissionBp))}{' '}
              adalah untung.
            </p>
          ) : null}
        </section>
      </div>

      <aside
        aria-label="Hasil kalkulasi"
        className="hidden content-start gap-5 lg:sticky lg:top-24 lg:grid lg:self-start"
      >
        {resultCard(false)}
        {channelTable('')}
      </aside>

      <div className="fixed inset-x-0 bottom-16 z-20 px-4 pb-2 lg:hidden">
        {resultCard(true, () => setDetailsOpen(true))}
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] gap-4 overflow-y-auto rounded-t-xl p-4"
        >
          <SheetHeader className="p-0">
            <SheetTitle className="font-display text-3xl font-semibold">
              Hasil lengkap
            </SheetTitle>
            <SheetDescription className="sr-only">
              Harga jual, untung, dan harga di tiap saluran untuk resep ini.
            </SheetDescription>
          </SheetHeader>
          {resultCard(false)}
          {channelTable('-mobile')}
        </SheetContent>
      </Sheet>
      {result.hpp.lte(0) ? (
        <p className="sr-only">{pricingCopy.emptyCost}</p>
      ) : null}
    </Page>
  );
}
