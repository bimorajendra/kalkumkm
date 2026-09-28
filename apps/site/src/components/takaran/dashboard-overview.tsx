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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <PageTitle>Ringkasan usahamu</PageTitle>
          <p className="max-w-prose text-muted-foreground">
            Lihat bahan dan resep yang sudah kamu simpan, lalu lanjutkan
            hitungan terakhir.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/hitung">Hitung HPP</Link>
        </Button>
      </header>

      <section
        aria-label="Jumlah data tersimpan"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <SummaryValue label="Resep tersimpan" value={recipes.length} />
        <SummaryValue label="Bahan tersimpan" value={ingredients.length} />
        <SummaryValue label="Saluran jual" value={channels.length} />
      </section>

      {/* Panel tunggal menempatkan hasil terakhir dan langkah lanjut dalam satu alur. */}
      {activeRecipe ? (
        <section
          aria-labelledby="last-recipe-title"
          className="grid gap-5 rounded-2xl bg-secondary p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(220px,auto)] lg:items-center"
        >
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-link">
              Resep terakhir dibuka
            </p>
            <div>
              <h2
                id="last-recipe-title"
                className="font-display text-3xl font-semibold leading-tight"
              >
                {activeRecipe.name}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {activeRecipe.yieldPortions} porsi per adonan
              </p>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">HPP per porsi</dt>
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
                  Harga jual saat ini
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
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <Button asChild>
              <Link href={`/dashboard/resep/${activeRecipe.id}`}>
                Buka resep
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/hitung">Lanjut menghitung</Link>
            </Button>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Mulai dari resep pertamamu."
          description="Tambahkan bahan dan susun resep. HPP akan muncul setelah biaya dan hasil per adonan diisi."
        >
          <Button asChild>
            <Link href="/dashboard/resep">Buat resep</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/bahan">Tambah bahan</Link>
          </Button>
        </EmptyState>
      )}

      <section aria-labelledby="next-step-title" className="grid gap-3">
        <h2 id="next-step-title" className="text-xl font-semibold">
          Langkah berikutnya
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <NextStep
            title="Perbarui harga bahan"
            description="Sesuaikan angka dengan struk belanja terbaru."
            href="/dashboard/bahan"
            action="Buka daftar bahan"
          />
          <NextStep
            title="Lihat daftar resepmu"
            description="Periksa HPP, harga jual, atau ubah resep."
            href="/dashboard/resep"
            action="Buka daftar resep"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Paket saat ini: {plan === 'pro' ? 'Takaran Pro' : 'Gratis'}.
        </p>
      </section>
    </Page>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return (
    <dl className="grid gap-1 rounded-xl border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-display text-3xl font-semibold tabular-nums">
        {value}
      </dd>
    </dl>
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
