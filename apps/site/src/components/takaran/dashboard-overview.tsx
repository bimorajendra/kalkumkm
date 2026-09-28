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
import { type IsometricLayer, IsometricStack } from '@takaran/ui';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import { TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { monthlySeries } from '@/domain/margin-history';
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

export function DashboardOverview() {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const { ingredients, recipes, channels, settings, plan } = snapshot;
  const [filter, setFilter] = useState<'all' | 'below' | 'ok'>('all');
  const [applyError, setApplyError] = useState('');
  const [trendRecipeId, setTrendRecipeId] = useState('all');
  const activeRecipe =
    recipes.find((recipe) => recipe.id === settings.lastRecipeId) ?? recipes[0];
  const directChannel =
    channels.find((channel) => channel.name === 'Langsung') ?? channels[0];

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
  const activeResult = activeRecipe ? results.get(activeRecipe.id) : undefined;
  const activeMetric = activeRecipe
    ? metrics.find((item) => item.id === activeRecipe.id)
    : undefined;
  let layers: IsometricLayer[] = [];
  let compositionProfit: ReturnType<typeof profitPerPortion> | null = null;
  if (
    activeRecipe &&
    activeResult &&
    !(activeResult instanceof CalcError) &&
    activeMetric?.price !== null &&
    activeMetric?.price !== undefined
  ) {
    const breakdown = activeResult.breakdown;
    layers = [
      {
        key: 'ingredients',
        label: 'Bahan',
        value: breakdown.ingredients.plus(breakdown.subRecipes),
      },
      { key: 'energy', label: 'Energi', value: breakdown.energy },
      { key: 'labor', label: 'Tenaga', value: breakdown.labor },
      { key: 'packaging', label: 'Kemasan', value: breakdown.packaging },
    ].filter((layer) => layer.value.gt(0));
    if (!layers.length)
      layers = [
        { key: 'ingredients', label: 'Biaya', value: activeResult.hpp },
      ];
    compositionProfit = profitPerPortion(
      activeMetric.price,
      activeResult.hpp,
      directChannel?.rateBp ?? 0,
    );
  }
  const filteredMetrics = metrics.filter((item) => {
    if (filter === 'below')
      return item.marginBp !== null && item.marginBp < item.targetMarginBp;
    if (filter === 'ok')
      return item.marginBp !== null && item.marginBp >= item.targetMarginBp;
    return true;
  });

  return (
    <Page className="grid gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <PageTitle>Ringkasan usaha</PageTitle>
          <p className="max-w-prose text-muted-foreground">
            {attention.length > 0
              ? `${attention.length} resep perlu kamu cek. Mulai dari harga jual atau data bahan.`
              : 'Semua resep dan bahan yang kamu simpan ada di sini.'}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/hitung">Hitung resep baru</Link>
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
          label="Bahan tersimpan"
          value={String(ingredients.length)}
          hint={plan === 'pro' ? 'Takaran Pro' : 'Harga beli yang kamu catat'}
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
        <section
          aria-labelledby="trend-title"
          className="grid gap-4 rounded-[20px] border border-line bg-surface p-4 sm:p-5"
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
                          className="inline-flex min-h-11 items-center text-left underline-offset-4 hover:text-link hover:underline"
                        >
                          {item.name}
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

      {activeRecipe && activeResult && !(activeResult instanceof CalcError) ? (
        <section
          aria-labelledby="composition-title"
          className="grid gap-4 rounded-[20px] border border-line bg-surface p-4 sm:p-5"
        >
          <div>
            <h2 id="composition-title" className="text-xl font-semibold">
              Komposisi harga · {activeRecipe.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Rincian per porsi dari data resep yang terakhir kamu buka.
            </p>
          </div>
          {layers.length && compositionProfit !== null ? (
            <IsometricStack layers={layers} profit={compositionProfit} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Komposisi belum tersedia untuk resep ini.
            </p>
          )}
        </section>
      ) : null}

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
