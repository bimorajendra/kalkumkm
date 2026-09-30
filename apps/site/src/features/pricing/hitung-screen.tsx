'use client';

import {
  CalcError,
  markupBp,
  priceForChannel,
  profitPerHour,
  profitPerPortion,
  type RecipeResult,
} from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import dynamic from 'next/dynamic';
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
import { CalculatorResult } from './calculator-result';
import { pricingCopy } from './copy';
import { CurrentPriceInput } from './current-price-input';
import { SliderPanel } from './slider-panel';
import { useCalculator } from './use-calculator';

const MarginAlarm = dynamic(
  () =>
    import('@/features/margin-alarm/margin-alarm').then(
      (module) => module.MarginAlarm,
    ),
  { loading: () => null },
);

export function HitungScreen({
  initialRecipeId,
  fromPicker = false,
}: {
  initialRecipeId: string;
  fromPicker?: boolean;
}) {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const { recipes, settings } = snapshot;
  const recipe = recipes.find((item) => item.id === initialRecipeId);

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
          title={
            recipes.length
              ? 'Resep ini tidak ditemukan.'
              : 'Belum ada resep untuk dihitung.'
          }
          description={
            recipes.length
              ? 'Pilih resep dari daftar untuk melihat hitungan HPP-nya.'
              : 'Buat resep terlebih dahulu agar HPP bisa dihitung.'
          }
        >
          <Button asChild>
            <Link href={fromPicker ? '/dashboard/hitung' : '/dashboard/resep'}>
              {fromPicker
                ? 'Kembali ke pilih resep'
                : recipes.length
                  ? 'Kembali ke resep'
                  : 'Buat resep'}
            </Link>
          </Button>
        </EmptyState>
      </Page>
    );
  return (
    <CalculatorScreen
      snapshot={snapshot}
      results={results}
      recipe={recipe}
      fromPicker={fromPicker}
    />
  );
}

function CalculatorScreen({
  snapshot,
  results,
  recipe,
  fromPicker,
}: {
  snapshot: Snapshot;
  results: Results;
  recipe: RecipeRow;
  fromPicker: boolean;
}) {
  const run = useRun();
  const { channels, settings } = snapshot;
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
    // Harga saran selalu dari target untung di slider, terpisah dari harga
    // yang sudah kamu simpan (lihat CurrentPriceInput di bawah).
    const directSuggested = priceForChannel(
      result.hpp,
      calculator.targetMarginBp,
      null,
      directChannel,
      roundingStep,
    ).price;
    const channelResult = priceForChannel(
      result.hpp,
      calculator.targetMarginBp,
      directSuggested,
      selectedChannel,
      roundingStep,
    );
    price = channelResult.price;
    actualMargin = channelResult.marginBp;
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
        canSavePrice={selectedChannel.id === directChannel.id}
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
    <Page className="grid gap-6 pb-56 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-8 lg:pb-12">
      <div className="grid content-start gap-5">
        <Link
          href={
            fromPicker ? '/dashboard/hitung' : `/dashboard/resep/${recipe.id}`
          }
          className="inline-flex min-h-11 w-fit items-center font-semibold text-link underline-offset-4 hover:underline"
        >
          {fromPicker ? 'Kembali ke pilih resep' : 'Kembali ke detail resep'}
        </Link>
        {settings.marginAlarm && !settings.marginAlarm.dismissed ? (
          <MarginAlarm />
        ) : null}
        <section aria-labelledby="calculator-title" className="grid gap-5">
          <h1
            id="calculator-title"
            className="font-display text-[34px] font-bold leading-[38px] lg:text-[44px] lg:leading-[48px]"
          >
            Hitung harga {recipe.name.toLocaleLowerCase('id-ID')}
          </h1>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-muted-foreground">Modal per potong</span>
            <strong className="text-lg tabular-nums">
              {formatRupiah(result.hpp)}
            </strong>
            <Link
              href={`/dashboard/resep/${recipe.id}`}
              className="text-sm font-semibold text-link underline-offset-4 hover:underline"
            >
              Ubah resep
            </Link>
          </div>
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
            yieldPortions={recipe.yieldPortions}
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
