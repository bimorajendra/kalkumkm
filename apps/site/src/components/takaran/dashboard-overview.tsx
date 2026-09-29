'use client';

import {
  actualMarginBp,
  CalcError,
  priceForChannel,
  profitPerHour,
  profitPerPortion,
  type RecipeResult,
  suggestPrice,
} from '@takaran/calc';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { Plus, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { monthlySeries } from '@/domain/margin-history';
import type { RecipeRow } from '@/domain/types';
import { errorMessage, useRecipeResults, useRun } from './data-provider';
import { MarginTrendChart } from './margin-trend-chart';
import { EmptyState, Page, PageTitle } from './page';

type RecipeMetric = {
  id: string;
  name: string;
  hpp: RecipeResult['hpp'] | null;
  price: number | null;
  marginBp: number | null;
  targetMarginBp: number;
  hourlyProfit: ReturnType<typeof profitPerHour>;
  error: boolean;
};

export function DashboardOverview({
  userName,
  greeting,
  dateLabel,
}: {
  userName: string;
  greeting: string;
  dateLabel: string;
}) {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const { ingredients, recipes, channels, settings } = snapshot;
  const [filter, setFilter] = useState<'all' | 'below' | 'ok'>('all');
  const [applyError, setApplyError] = useState('');
  const [trendRecipeId, setTrendRecipeId] = useState('all');
  const [compositionRecipeId, setCompositionRecipeId] = useState('last');
  const activeRecipe =
    recipes.find((recipe) => recipe.id === settings.lastRecipeId) ?? recipes[0];
  const compositionRecipe =
    recipes.find((recipe) => recipe.id === compositionRecipeId) ?? activeRecipe;
  const directChannel =
    channels.find((channel) => channel.name === 'Langsung') ?? channels[0];
  const firstName = userName.trim().split(/\s+/)[0] || 'teman';

  if (error)
    return (
      <Page>
        <p role="alert" className="text-destructive">
          Ringkasan belum bisa dibuka. Muat ulang halaman untuk mencoba lagi.
        </p>
      </Page>
    );

  const metrics: RecipeMetric[] = recipes.map((recipe) => {
    const result = results.get(recipe.id);
    if (!result || result instanceof CalcError)
      return {
        id: recipe.id,
        name: recipe.name,
        hpp: null,
        price: null,
        marginBp: null,
        targetMarginBp: recipe.targetMarginBp,
        hourlyProfit: null,
        error: Boolean(result),
      };
    try {
      const channel = directChannel ?? {
        id: 'direct',
        name: 'Langsung',
        kind: 'commission' as const,
        rateBp: 0,
      };
      const price =
        recipe.currentPrice ??
        priceForChannel(
          result.hpp,
          recipe.targetMarginBp,
          null,
          channel,
          settings.roundingStep,
        ).price;
      return {
        id: recipe.id,
        name: recipe.name,
        hpp: result.hpp,
        price,
        marginBp: actualMarginBp(price, result.hpp, channel.rateBp),
        targetMarginBp: recipe.targetMarginBp,
        hourlyProfit: profitPerHour(
          price,
          result.hpp,
          channel.rateBp,
          recipe.yieldPortions,
          recipe.laborMinutesPerBatch,
        ),
        error: false,
      };
    } catch {
      return {
        id: recipe.id,
        name: recipe.name,
        hpp: result.hpp,
        price: null,
        marginBp: null,
        targetMarginBp: recipe.targetMarginBp,
        hourlyProfit: null,
        error: true,
      };
    }
  });
  const attention = metrics.filter(
    (item) =>
      item.error ||
      (item.marginBp !== null && item.marginBp < item.targetMarginBp),
  );
  const belowCount = metrics.filter(
    (item) => item.marginBp !== null && item.marginBp < item.targetMarginBp,
  ).length;
  const withMargin = metrics.filter((item) => item.marginBp !== null);
  const averageMarginBp = withMargin.length
    ? Math.round(
        withMargin.reduce((sum, item) => sum + (item.marginBp ?? 0), 0) /
          withMargin.length,
      )
    : null;
  const risingIngredient =
    settings.marginAlarm && !settings.marginAlarm.dismissed
      ? ingredients.find(
          (item) => item.id === settings.marginAlarm?.triggeredBy,
        )
      : undefined;
  const recentPriceChanges = (snapshot.priceHistory ?? []).filter(
    (row) => Date.parse(row.changedAt) >= Date.now() - 30 * 24 * 60 * 60 * 1000,
  );
  const latestPriceChange = new Map(
    recentPriceChanges.map((row) => [row.ingredientId, row]),
  );
  const risingIngredients = [...latestPriceChange.values()]
    .filter((row) => row.oldPrice !== null && row.newPrice > row.oldPrice)
    .flatMap((row) => {
      const ingredient = ingredients.find(
        (item) => item.id === row.ingredientId,
      );
      return ingredient
        ? [{ ingredient, change: row.newPrice - (row.oldPrice ?? 0) }]
        : [];
    })
    .sort((a, b) => b.change - a.change);
  const topRisingIngredient = risingIngredients[0];
  const trendRecipeIds =
    trendRecipeId === 'all'
      ? recipes.map((recipe) => recipe.id)
      : [trendRecipeId];
  const trendPoints = monthlySeries(snapshot.marginHistory, trendRecipeIds);
  const trendLast = trendPoints[trendPoints.length - 1];
  const trendPrevious = trendPoints[trendPoints.length - 2];
  const overallTrend = monthlySeries(
    snapshot.marginHistory,
    recipes.map((recipe) => recipe.id),
  );
  const overallLast = overallTrend[overallTrend.length - 1];
  const overallPrevious = overallTrend[overallTrend.length - 2];
  const marginTrend =
    overallLast && overallPrevious
      ? {
          deltaBp: overallLast.marginBp - overallPrevious.marginBp,
          vsLabel: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(
            new Date(
              Date.UTC(
                Number(overallPrevious.month.slice(0, 4)),
                Number(overallPrevious.month.slice(5, 7)) - 1,
                1,
              ),
            ),
          ),
        }
      : null;
  const bestHourly = metrics
    .filter((item) => item.hourlyProfit !== null)
    .sort((a, b) => {
      if (!a.hourlyProfit || !b.hourlyProfit) return 0;
      if (b.hourlyProfit.gt(a.hourlyProfit)) return 1;
      if (b.hourlyProfit.lt(a.hourlyProfit)) return -1;
      return 0;
    })[0];
  const compositionResult = compositionRecipe
    ? results.get(compositionRecipe.id)
    : undefined;
  const compositionMetric = compositionRecipe
    ? metrics.find((item) => item.id === compositionRecipe.id)
    : undefined;
  let compositionRows: {
    label: string;
    value: RecipeResult['hpp'];
    color: string;
  }[] = [];
  let compositionProfit: ReturnType<typeof profitPerPortion> | null = null;
  if (
    compositionRecipe &&
    compositionResult &&
    !(compositionResult instanceof CalcError) &&
    compositionMetric?.price !== null &&
    compositionMetric?.price !== undefined
  ) {
    const breakdown = compositionResult.breakdown;
    const costs = [
      {
        label: 'Bahan',
        value: breakdown.ingredients.plus(breakdown.subRecipes),
      },
      { label: 'Energi', value: breakdown.energy },
      { label: 'Tenaga', value: breakdown.labor },
      { label: 'Kemasan', value: breakdown.packaging },
    ].filter((row) => row.value.gt(0));
    compositionProfit = profitPerPortion(
      compositionMetric.price,
      compositionResult.hpp,
      directChannel?.rateBp ?? 0,
    );
    const palette = [
      'var(--tan-400)',
      'var(--tan-300)',
      'var(--tan-200)',
      'var(--tan-100)',
    ];
    compositionRows = costs.map((row, index) => ({
      ...row,
      color: palette[index % palette.length] ?? 'var(--tan-400)',
    }));
    if (compositionProfit.gt(0))
      compositionRows.push({
        label: 'Untung',
        value: compositionProfit,
        color: 'var(--caramel-500)',
      });
    if (!compositionRows.length)
      compositionRows = [
        {
          label: 'Biaya',
          value: compositionResult.hpp,
          color: 'var(--tan-300)',
        },
      ];
  }
  const filteredMetrics = metrics.filter((item) => {
    if (filter === 'below')
      return item.marginBp !== null && item.marginBp < item.targetMarginBp;
    if (filter === 'ok')
      return item.marginBp !== null && item.marginBp >= item.targetMarginBp;
    return true;
  });

  return (
    <Page className="grid gap-6 xl:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-sm capitalize text-muted-foreground">
            {dateLabel}
          </p>
          <PageTitle>
            Selamat {greeting}, {firstName}
          </PageTitle>
          <p className="max-w-prose text-muted-foreground">
            {belowCount > 0 ? (
              <>
                <strong className="text-destructive">{belowCount} menu</strong>{' '}
                untungnya di bawah target.
              </>
            ) : (
              'Cek ringkasan bahan dan keuntungan usahamu hari ini.'
            )}
          </p>
        </div>
        <Button asChild size="lg" className="min-h-12 rounded-full">
          <Link href="/dashboard/hitung">
            <Plus aria-hidden="true" />
            Hitung resep baru
          </Link>
        </Button>
      </header>

      <section
        aria-label="Ringkasan data usaha"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <MetricCard
          label="Rata-rata margin"
          value={
            averageMarginBp === null ? '—' : formatPercent(averageMarginBp)
          }
          hint={
            averageMarginBp === null
              ? 'Belum ada resep terhitung'
              : `${withMargin.length} resep terhitung`
          }
          trend={marginTrend}
        />
        <MetricCard
          label="Menu di bawah target"
          value={String(belowCount)}
          hint={`dari ${metrics.length} resep`}
          tone={belowCount > 0 ? 'warning' : 'normal'}
        />
        <MetricCard
          label="Bahan naik harga"
          value={`${risingIngredients.length} bahan`}
          hint={
            topRisingIngredient
              ? `${topRisingIngredient.ingredient.name} naik ${formatRupiah(topRisingIngredient.change)} dalam 30 hari`
              : 'Belum ada kenaikan dalam 30 hari'
          }
        />
        <MetricCard
          label="Untung per jam terbaik"
          value={
            bestHourly?.hourlyProfit
              ? formatRupiah(bestHourly.hourlyProfit)
              : 'Belum ada'
          }
          hint={
            bestHourly
              ? bestHourly.name
              : 'Isi waktu kerja resep untuk menghitungnya'
          }
        />
      </section>

      {recipes.length > 0 ? (
        <div className="grid items-start gap-5 xl:grid-cols-12">
          <section
            aria-labelledby="trend-title"
            className="grid gap-4 rounded-[20px] border border-line bg-surface p-4 sm:p-5 xl:col-span-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="trend-title" className="text-xl font-semibold">
                  Margin dari bulan ke bulan
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Terisi otomatis tiap kali harga bahan atau harga jual berubah.
                </p>
              </div>
              {trendLast ? (
                <div className="text-right">
                  <p className="font-display text-2xl font-semibold tabular-nums">
                    {formatPercent(trendLast.marginBp)}
                  </p>
                  {trendPrevious ? (
                    <p
                      className={`text-sm font-medium tabular-nums ${trendLast.marginBp >= trendPrevious.marginBp ? 'text-success' : 'text-destructive'}`}
                    >
                      {trendLast.marginBp >= trendPrevious.marginBp
                        ? 'naik'
                        : 'turun'}{' '}
                      {Math.abs(
                        (trendLast.marginBp - trendPrevious.marginBp) / 100,
                      ).toLocaleString('id-ID', {
                        maximumFractionDigits: 1,
                      })}{' '}
                      poin
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Pilih menu untuk grafik</legend>
              <FilterButton
                active={trendRecipeId === 'all'}
                onClick={() => setTrendRecipeId('all')}
              >
                Semua menu
              </FilterButton>
              {recipes.map((recipe) => (
                <FilterButton
                  key={recipe.id}
                  active={trendRecipeId === recipe.id}
                  onClick={() => setTrendRecipeId(recipe.id)}
                >
                  {recipe.name}
                </FilterButton>
              ))}
            </fieldset>
            {trendPoints.length >= 2 ? (
              <MarginTrendChart points={trendPoints} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Grafik akan muncul setelah ada perubahan harga di bulan
                berikutnya. Titik pertama tercatat begitu harga bahan atau harga
                jual berubah.
              </p>
            )}
          </section>
          <CompositionPanel
            recipes={recipes}
            selectedRecipe={compositionRecipe}
            rows={compositionRows}
            profit={compositionProfit}
            marginBp={compositionMetric?.marginBp ?? null}
            price={compositionMetric?.price ?? null}
            onSelect={setCompositionRecipeId}
          />
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-12">
        <section
          aria-labelledby="margin-list-title"
          className="grid gap-4 rounded-[20px] border border-line bg-surface p-4 sm:p-5 xl:col-span-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="margin-list-title" className="text-xl font-semibold">
                Menu kamu
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                HPP dan margin memakai harga jual tersimpan, atau harga saran
                jika belum diatur.
              </p>
            </div>
            <Link
              href="/dashboard/resep"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline-offset-4 hover:underline"
            >
              Semua resep
            </Link>
          </div>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Saring resep</legend>
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Semua ({metrics.length})
            </FilterButton>
            <FilterButton
              active={filter === 'below'}
              onClick={() => setFilter('below')}
            >
              Di bawah target ({belowCount})
            </FilterButton>
            <FilterButton
              active={filter === 'ok'}
              onClick={() => setFilter('ok')}
            >
              Sesuai target ({metrics.length - belowCount})
            </FilterButton>
          </fieldset>
          {filteredMetrics.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y border-line bg-surface-soft text-ink-muted">
                    <th scope="col" className="px-3 py-3 font-medium">
                      Menu
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right font-medium"
                    >
                      Modal per porsi
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right font-medium"
                    >
                      Harga jual
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Margin
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMetrics.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-line last:border-0"
                    >
                      <th scope="row" className="px-3 py-3 font-semibold">
                        <Link
                          href={`/dashboard/resep/${item.id}`}
                          className="inline-flex min-h-11 flex-col justify-center text-left underline-offset-4 hover:text-link hover:underline"
                        >
                          <span>{item.name}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {recipes.find((recipe) => recipe.id === item.id)
                              ?.yieldPortions ?? 'Belum diatur'}{' '}
                            porsi per adonan
                          </span>
                        </Link>
                      </th>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {item.error || item.hpp === null
                          ? 'Belum tersedia'
                          : formatRupiah(item.hpp)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {item.price === null
                          ? 'Belum tersedia'
                          : formatRupiah(item.price)}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {item.marginBp === null ? (
                          '—'
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{formatPercent(item.marginBp)}</span>
                            <MarginBar
                              marginBp={item.marginBp}
                              targetMarginBp={item.targetMarginBp}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <MarginStatus
                          margin={item.marginBp ?? undefined}
                          above={
                            item.marginBp !== null &&
                            item.marginBp >= item.targetMarginBp
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-5 text-muted-foreground">
              Tidak ada resep untuk saringan ini.
            </p>
          )}
        </section>

        <aside
          aria-labelledby="attention-title"
          className="grid content-start gap-4 rounded-[20px] bg-surface-soft p-4 sm:p-5 xl:col-span-5"
        >
          <div>
            <h2 id="attention-title" className="text-xl font-semibold">
              Perlu kamu cek
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hanya resep yang datanya menunjukkan perlu perhatian.
            </p>
          </div>
          {attention.length ? (
            <ul className="grid gap-3">
              {attention.slice(0, 4).map((item) => {
                const suggested = ((): number | null => {
                  if (item.error || item.hpp === null) return null;
                  try {
                    return suggestPrice(
                      item.hpp,
                      item.targetMarginBp,
                      0,
                      settings.roundingStep,
                    );
                  } catch {
                    return null;
                  }
                })();
                return (
                  <li
                    key={item.id}
                    className="grid gap-2 rounded-2xl bg-surface p-4"
                  >
                    <div className="flex gap-3">
                      <TriangleAlert
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-caramel-700"
                        strokeWidth={1.75}
                      />
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.error || item.marginBp === null
                            ? 'HPP belum bisa dihitung. Periksa bahan dan takaran.'
                            : `Margin ${formatPercent(item.marginBp)} berada di bawah target ${formatPercent(item.targetMarginBp)}.`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-8">
                      {suggested !== null ? (
                        <Button
                          type="button"
                          onClick={async () => {
                            setApplyError('');
                            try {
                              await run({
                                type: 'alarm.applyPrice',
                                recipeId: item.id,
                                price: suggested,
                              });
                            } catch (cause) {
                              setApplyError(
                                errorMessage(
                                  cause,
                                  'Harga belum tersimpan. Coba lagi.',
                                ),
                              );
                            }
                          }}
                        >
                          Pakai harga saran {formatRupiah(suggested)}
                        </Button>
                      ) : null}
                      <Button asChild variant="outline">
                        <Link href={`/dashboard/resep/${item.id}`}>
                          Periksa resep
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl bg-surface p-4 text-muted-foreground">
              Belum ada resep yang perlu diperiksa.
            </p>
          )}
          {applyError ? (
            <p role="alert" className="text-sm text-destructive">
              {applyError}
            </p>
          ) : null}
          {risingIngredient ? (
            <div className="flex gap-3 rounded-2xl bg-surface p-4">
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-caramel-700"
                strokeWidth={1.75}
              />
              <div className="grid gap-1">
                <h3 className="font-semibold">
                  Harga {risingIngredient.name} naik
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sekarang {formatRupiah(risingIngredient.buyPrice)} per{' '}
                  {risingIngredient.buyUnit}.
                </p>
                <Link
                  href="/dashboard/bahan"
                  className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline"
                >
                  Lihat bahan
                </Link>
              </div>
            </div>
          ) : null}
          {!ingredients.length ? (
            <div className="grid gap-2 rounded-2xl bg-surface p-4">
              <h3 className="font-semibold">Belum ada bahan</h3>
              <p className="text-sm text-muted-foreground">
                Tambahkan bahan dari struk belanja agar HPP bisa dihitung.
              </p>
              <Link
                href="/dashboard/bahan"
                className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline"
              >
                Tambah bahan
              </Link>
            </div>
          ) : null}
        </aside>
      </div>

      {recipes.length === 0 ? (
        <EmptyState
          title="Mulai dari satu resep."
          description="Tambahkan bahan dari struk belanja, lalu susun resep untuk melihat HPP per porsi."
        >
          <Button asChild>
            <Link href="/dashboard/resep">Buat resep pertama</Link>
          </Button>
        </EmptyState>
      ) : null}
    </Page>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = 'normal',
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'normal' | 'warning';
  trend?: { deltaBp: number; vsLabel: string } | null;
}) {
  const up = (trend?.deltaBp ?? 0) >= 0;
  return (
    <article
      className={`grid content-between gap-3 rounded-[20px] border border-line bg-surface p-4 sm:p-5 ${tone === 'warning' ? 'border-l-4 border-l-danger' : ''}`}
    >
      <h2 className="text-sm font-medium text-ink-muted">{label}</h2>
      <p className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">
        {value}
      </p>
      {trend ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-[10px] px-2 py-0.5 text-xs font-semibold tabular-nums ${up ? 'bg-success-tint text-success' : 'bg-danger-tint text-destructive'}`}
          >
            {up ? (
              <TrendingUp aria-hidden="true" className="size-3.5" />
            ) : (
              <TrendingDown aria-hidden="true" className="size-3.5" />
            )}
            {up ? 'naik' : 'turun'}{' '}
            {Math.abs(trend.deltaBp / 100).toLocaleString('id-ID', {
              maximumFractionDigits: 1,
            })}{' '}
            poin
          </span>
          <span className="text-ink-muted">vs {trend.vsLabel}</span>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">{hint}</p>
      )}
    </article>
  );
}

function CompositionPanel({
  recipes,
  selectedRecipe,
  rows,
  profit,
  marginBp,
  price,
  onSelect,
}: {
  recipes: RecipeRow[];
  selectedRecipe?: RecipeRow;
  rows: { label: string; value: RecipeResult['hpp']; color: string }[];
  profit: ReturnType<typeof profitPerPortion> | null;
  marginBp: number | null;
  price: number | null;
  onSelect: (id: string) => void;
}) {
  const total = rows.reduce((sum, row) => sum + row.value.toNumber(), 0);
  let position = 0;
  const stops = rows.map((row) => {
    const start = position;
    position += total > 0 ? (row.value.toNumber() / total) * 100 : 0;
    return `${row.color} ${start}% ${position}%`;
  });
  const gradient = stops.length
    ? `conic-gradient(${stops.join(', ')})`
    : 'var(--surface-soft)';

  return (
    <section
      aria-labelledby="composition-title"
      className="grid content-start gap-4 rounded-[20px] border border-line bg-surface p-4 sm:p-5 xl:col-span-5"
    >
      <div>
        <h2 id="composition-title" className="text-xl font-semibold">
          Isi harga jual
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedRecipe && price !== null
            ? `${selectedRecipe.name} · ${formatRupiah(price)} per porsi`
            : 'Pilih resep untuk melihat rincian harga.'}
        </p>
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Pilih resep untuk rincian harga</legend>
        {recipes.map((recipe) => (
          <FilterButton
            key={recipe.id}
            active={selectedRecipe?.id === recipe.id}
            onClick={() => onSelect(recipe.id)}
          >
            {recipe.name}
          </FilterButton>
        ))}
      </fieldset>
      {rows.length > 0 ? (
        <div className="grid items-center gap-4 sm:grid-cols-[minmax(145px,1fr)_minmax(0,1.2fr)]">
          <div
            role="img"
            aria-label={`Komposisi harga ${selectedRecipe?.name ?? ''}`}
            className="mx-auto grid size-40 place-items-center rounded-full"
            style={{ background: gradient }}
          >
            <div className="grid size-24 place-content-center rounded-full bg-surface text-center">
              <span className="text-xs text-muted-foreground">
                {profit?.lt(0) ? 'Rugi' : 'Untung'}
              </span>
              <strong className="font-display text-2xl font-bold tabular-nums">
                {marginBp === null ? '—' : formatPercent(marginBp)}
              </strong>
            </div>
          </div>
          <ul className="grid gap-2 text-sm">
            {rows.map((row) => (
              <li
                key={row.label}
                className="grid grid-cols-[10px_minmax(0,1fr)_auto_auto] items-center gap-2"
              >
                <span
                  aria-hidden="true"
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: row.color }}
                />
                <span>{row.label}</span>
                <strong className="tabular-nums">
                  {formatRupiah(row.value)}
                </strong>
                <span className="w-9 text-right text-muted-foreground tabular-nums">
                  {total > 0
                    ? `${Math.round((row.value.toNumber() / total) * 100)}%`
                    : '0%'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-2xl bg-surface-soft p-4 text-sm text-muted-foreground">
          Rincian akan tampil setelah HPP resep bisa dihitung.
        </p>
      )}
      {profit?.lt(0) ? (
        <p className="text-sm font-medium text-destructive">
          Rugi {formatRupiah(profit)} per porsi pada harga ini.
        </p>
      ) : null}
    </section>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      aria-pressed={active}
      onClick={onClick}
      className="min-h-10 rounded-full"
    >
      {children}
    </Button>
  );
}

// Keep this status local so the dashboard does not load the recipe editor bundle.
function MarginStatus({
  margin,
  above,
}: {
  margin: number | undefined;
  above: boolean;
}) {
  const text =
    margin === undefined
      ? 'Belum bisa dihitung'
      : above
        ? 'Di atas target'
        : 'Di bawah target';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-sm font-semibold ${
        margin === undefined
          ? 'bg-surface-soft text-muted-foreground'
          : above
            ? 'bg-success-tint text-success'
            : 'bg-danger-tint text-destructive'
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${
          margin === undefined
            ? 'bg-muted-foreground'
            : above
              ? 'bg-success'
              : 'bg-destructive'
        }`}
      />
      {text}
    </span>
  );
}

/** Batang margin: perbandingan visual terhadap target, teks tetap penanda utama. */
function MarginBar({
  marginBp,
  targetMarginBp,
}: {
  marginBp: number;
  targetMarginBp: number;
}) {
  const scale = 7000;
  const width = Math.min(100, Math.max(0, (marginBp / scale) * 100));
  const target = Math.min(100, Math.max(0, (targetMarginBp / scale) * 100));
  return (
    <span
      aria-hidden="true"
      className="relative block h-2 w-16 shrink-0 rounded-full bg-surface-soft"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-caramel-400"
        style={{ width: `${width}%` }}
      />
      <span
        className="absolute -top-0.5 h-3 w-0.5 bg-ink"
        style={{ left: `${target}%` }}
      />
    </span>
  );
}
