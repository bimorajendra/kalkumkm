'use client';

import { CalcError, priceForChannel, profitPerPortion } from '@takaran/calc';
import { type IsometricLayer, IsometricStack } from '@takaran/ui';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRecipeResults, useSnapshot } from './data-provider';
import { EmptyState, Page, PageTitle } from './page';

export function DashboardOverview() {
  const snapshot = useSnapshot();
  const { results, error } = useRecipeResults();
  const { ingredients, recipes, channels, settings, plan } = snapshot;
  const activeRecipe =
    recipes.find((recipe) => recipe.id === settings.lastRecipeId) ?? recipes[0];
  const activeResult = activeRecipe ? results.get(activeRecipe.id) : undefined;
  let stack:
    | { layers: IsometricLayer[]; profit: ReturnType<typeof profitPerPortion> }
    | undefined;

  if (
    activeRecipe &&
    activeResult &&
    !(activeResult instanceof CalcError) &&
    activeResult.hpp.gt(0)
  ) {
    const directChannel = channels.find(
      (channel) => channel.kind === 'commission' && channel.rateBp === 0,
    );
    if (directChannel) {
      try {
        const price =
          activeRecipe.currentPrice ??
          priceForChannel(
            activeResult.hpp,
            activeRecipe.targetMarginBp,
            null,
            directChannel,
            settings.roundingStep,
          ).price;
        const ingredientsCost = activeResult.breakdown.ingredients.plus(
          activeResult.breakdown.subRecipes,
        );
        const layers: IsometricLayer[] = [
          { key: 'ingredients', label: 'Bahan', value: ingredientsCost },
          {
            key: 'energy',
            label: 'Energi',
            value: activeResult.breakdown.energy,
          },
          {
            key: 'labor',
            label: 'Tenaga',
            value: activeResult.breakdown.labor,
          },
          {
            key: 'packaging',
            label: 'Kemasan',
            value: activeResult.breakdown.packaging,
          },
        ].filter((layer) => layer.value.gt(0));
        stack = {
          layers: layers.length
            ? layers
            : [{ key: 'ingredients', label: 'Biaya', value: activeResult.hpp }],
          profit: profitPerPortion(
            price,
            activeResult.hpp,
            directChannel.rateBp,
          ),
        };
      } catch {
        stack = undefined;
      }
    }
  }

  if (error)
    return (
      <Page>
        <p role="alert" className="text-destructive">
          Ringkasan belum bisa dibuka. Muat ulang halaman untuk mencoba lagi.
        </p>
      </Page>
    );

  return (
    <Page className="grid gap-7">
      <header className="grid gap-2 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-link">Ruang kerjamu</p>
          <PageTitle>Ringkasan usaha</PageTitle>
          <p className="max-w-prose text-muted-foreground">
            Pantau data usaha dan lanjutkan pekerjaan yang terakhir kamu buka.
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/dashboard/hitung">Mulai hitung HPP</Link>
        </Button>
      </header>

      <section
        aria-label="Jumlah data tersimpan"
        className="grid grid-cols-2 gap-3 lg:grid-cols-3"
      >
        <SummaryValue
          href="/dashboard/resep"
          label="Resep tersimpan"
          value={recipes.length}
        />
        <SummaryValue
          href="/dashboard/bahan"
          label="Bahan tersimpan"
          value={ingredients.length}
        />
        <SummaryValue
          href="/dashboard/hitung"
          label="Saluran jual"
          value={channels.length}
        />
      </section>

      <section className="grid gap-4" aria-label="Pekerjaan usaha">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Lanjutkan pekerjaanmu</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Buka data terakhir atau pilih langkah yang ingin dikerjakan.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Paket: {plan === 'pro' ? 'Takaran Pro' : 'Gratis'}
          </p>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
          {activeRecipe ? (
            <section
              aria-labelledby="last-recipe-title"
              className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="grid gap-3">
                <p className="text-sm font-semibold text-link">
                  Resep terakhir dibuka
                </p>
                <div>
                  <h3
                    id="last-recipe-title"
                    className="font-display text-2xl font-semibold leading-tight sm:text-3xl"
                  >
                    {activeRecipe.name}
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    {activeRecipe.yieldPortions} porsi per adonan
                  </p>
                </div>
                <dl className="flex flex-wrap gap-x-8 gap-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      HPP per porsi
                    </dt>
                    <dd className="font-display text-2xl font-semibold">
                      {activeResult === undefined
                        ? 'Memuat'
                        : activeResult instanceof CalcError
                          ? 'Belum tersedia'
                          : formatRupiah(activeResult.hpp)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Harga jual tersimpan
                    </dt>
                    <dd className="font-display text-2xl font-semibold">
                      {activeRecipe.currentPrice === null
                        ? 'Belum diatur'
                        : formatRupiah(activeRecipe.currentPrice)}
                    </dd>
                  </div>
                </dl>
                {activeResult instanceof CalcError ? (
                  <p role="alert" className="text-sm text-destructive">
                    Resep ini perlu diperiksa sebelum HPP bisa ditampilkan.
                  </p>
                ) : null}
              </div>
              {/* Tumpukan biaya membantu pengguna membaca hasil tanpa mengubah hitungan. */}
              {stack ? (
                <IsometricStack layers={stack.layers} profit={stack.profit} />
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/dashboard/resep/${activeRecipe.id}`}>
                    Buka resep
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/hitung">Hitung harga jual</Link>
                </Button>
              </div>
            </section>
          ) : (
            <EmptyState
              title="Mulai dari bahan yang kamu punya."
              description="Simpan harga bahan lebih dulu, lalu susun resep untuk melihat HPP per porsi."
            >
              <Button asChild>
                <Link href="/dashboard/bahan">Tambah bahan pertama</Link>
              </Button>
            </EmptyState>
          )}
          <section
            aria-labelledby="quick-actions-title"
            className="grid gap-3 rounded-2xl bg-secondary p-5 sm:p-6"
          >
            <div>
              <h3 id="quick-actions-title" className="font-semibold">
                Akses cepat
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilih bagian usaha yang ingin kamu kelola.
              </p>
            </div>
            <NextStep
              title="Bahan dan harga belanja"
              description="Catat bahan dari struk agar biaya tetap sesuai."
              href="/dashboard/bahan"
              action="Kelola bahan"
            />
            <NextStep
              title="Resep dan hasil hitung"
              description="Susun resep, lihat HPP, lalu atur harga jual."
              href="/dashboard/resep"
              action="Kelola resep"
            />
            <NextStep
              title="Penawaran pesanan"
              description="Buat rincian harga untuk pesanan khusus."
              href="/dashboard/penawaran"
              action="Buat penawaran"
            />
          </section>
        </div>
      </section>
    </Page>
  );
}

function SummaryValue({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-24 gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-3xl font-semibold tabular-nums">
        {value}
      </span>
    </Link>
  );
}

function NextStep({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <article className="grid justify-items-start gap-2 rounded-xl border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="mt-1 inline-flex min-h-11 items-center text-link underline underline-offset-4"
      >
        {action}
      </Link>
    </article>
  );
}
