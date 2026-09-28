'use client';

import { actualMarginBp, CalcError, suggestPrice } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui/format';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CommandError,
  errorMessage,
  useRecipeResults,
  useRun,
} from '@/components/takaran/data-provider';
import { Page, PageTitle } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';
import { PaywallDialog } from '@/features/billing/paywall-dialog';
import { recipeCopy } from './copy';
import { HppBreakdown } from './hpp-breakdown';
import { RecipeEditor } from './recipe-editor';
import { MarginStatus } from './recipe-list';

export function ResepDetailScreen({ id }: { id: string }) {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [paywall, setPaywall] = useState(false);
  const recipe = snapshot.recipes.find((item) => item.id === id);
  const result = results.get(id);
  const lastRecipeId = snapshot.settings.lastRecipeId;

  // Resep yang terakhir dibuka menjadi pilihan awal di kalkulator.
  useEffect(() => {
    if (recipe && lastRecipeId !== id)
      void run({ type: 'settings.update', values: { lastRecipeId: id } }).catch(
        () => {},
      );
  }, [recipe, lastRecipeId, id, run]);

  if (error)
    return (
      <Page>
        <h1 className="font-display text-3xl font-semibold">
          Resep belum terbaca.
        </h1>
        <p className="my-3">{recipeCopy.loadError}</p>
        <Button asChild>
          <Link href="/dashboard/resep">Kembali ke resep</Link>
        </Button>
      </Page>
    );
  if (!recipe)
    return (
      <Page>
        <h1 className="font-display text-3xl font-semibold">
          Resep tidak ditemukan.
        </h1>
        <p className="my-3">Resep ini mungkin sudah dihapus.</p>
        <Button asChild>
          <Link href="/dashboard/resep">Kembali ke resep</Link>
        </Button>
      </Page>
    );

  const back = (
    <Link
      href="/dashboard/resep"
      className="mb-2 inline-flex min-h-11 items-center gap-1 text-link underline underline-offset-4"
    >
      <ChevronLeft aria-hidden="true" className="size-4" />
      Kembali ke resep
    </Link>
  );
  const editor = (
    <RecipeEditor
      open={editing}
      recipe={recipe}
      onOpenChange={setEditing}
      onDeleted={() => router.push('/dashboard/resep')}
    />
  );

  if (result instanceof CalcError)
    return (
      <Page>
        {back}
        <PageTitle>{recipe.name}</PageTitle>
        <p role="alert" className="my-3 text-destructive">
          {result.code === 'MISSING_REF'
            ? 'Bahan ini sudah dihapus. Ubah resep untuk memperbaikinya.'
            : result.message}
        </p>
        <Button type="button" onClick={() => setEditing(true)}>
          Ubah resep
        </Button>
        {editor}
      </Page>
    );
  if (!result)
    return (
      <Page>
        <output>Menghitung HPP…</output>
      </Page>
    );

  let price: number | null = recipe.currentPrice;
  try {
    price ??= suggestPrice(
      result.hpp,
      recipe.targetMarginBp,
      0,
      snapshot.settings.roundingStep,
    );
  } catch {
    price = null;
  }
  const margin =
    price !== null && price > 0
      ? actualMarginBp(price, result.hpp, 0)
      : undefined;
  const above = margin !== undefined && margin >= recipe.targetMarginBp;

  async function duplicate() {
    setMessage('');
    try {
      const before = new Set(snapshot.recipes.map((row) => row.id));
      const next = await run({ type: 'recipe.duplicate', id });
      const copy = next.recipes.find((row) => !before.has(row.id));
      if (copy) router.push(`/dashboard/resep/${copy.id}`);
    } catch (cause) {
      if (cause instanceof CommandError && cause.code === 'FREE_LIMIT')
        setPaywall(true);
      setMessage(
        errorMessage(cause, 'Resep belum bisa diduplikasi. Coba lagi.'),
      );
    }
  }

  return (
    <Page className="grid gap-5">
      <div>
        {back}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              HPP (modal per porsi)
            </p>
            <PageTitle>{recipe.name}</PageTitle>
            <p className="text-muted-foreground">
              {recipe.yieldPortions} porsi per adonan
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Ubah resep
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void duplicate()}
            >
              Duplikat
            </Button>
          </div>
        </div>
      </div>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <section
        aria-label="Hasil hitung resep"
        className="grid gap-4 rounded-xl bg-card p-5 shadow-sm sm:grid-cols-3"
      >
        <div>
          <span className="block text-sm text-muted-foreground">
            HPP per porsi
          </span>
          <strong className="font-display text-4xl font-bold">
            {formatRupiah(result.hpp)}
          </strong>
        </div>
        <div>
          <span className="block text-sm text-muted-foreground">
            Harga {recipe.currentPrice ? 'sekarang' : 'saran'}
          </span>
          <strong className="font-display text-4xl font-bold">
            {price === null ? 'Belum tersedia' : formatRupiah(price)}
          </strong>
        </div>
        <div className="self-end">
          <MarginStatus margin={margin} above={above} />
          {margin !== undefined ? (
            <span className="ml-2 text-sm">
              {(margin / 100).toLocaleString('id-ID', {
                maximumFractionDigits: 1,
              })}
              %
            </span>
          ) : (
            <span className="block text-sm text-muted-foreground">
              Harga jual belum diisi
            </span>
          )}
        </div>
      </section>
      <HppBreakdown
        recipe={recipe}
        result={result}
        price={price ?? result.hpp.toNumber()}
      />
      {editor}
      <PaywallDialog
        open={paywall}
        trigger="recipe"
        onClose={() => setPaywall(false)}
      />
    </Page>
  );
}
