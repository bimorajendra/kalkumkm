'use client';

import { CalcError } from '@takaran/calc';
import { ChevronLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CommandError,
  errorMessage,
  useRecipeResults,
  useRun,
} from '@/components/takaran/data-provider';
import { Page } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';
import { PaywallDialog } from '@/features/billing/paywall-dialog';
import { recipeCopy } from './copy';
import { RecipeEditor } from './recipe-editor';

const OrderCalculator = dynamic(
  () =>
    import('./order-calculator').then((module) => ({
      default: module.OrderCalculator,
    })),
  { loading: () => null },
);

export function ResepDetailScreen({ id }: { id: string }) {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const router = useRouter();
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

  if (!result)
    return (
      <Page>
        <output>Menghitung HPP…</output>
      </Page>
    );

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
    <Page className="grid gap-5 pb-32">
      <Link
        href="/dashboard/resep"
        className="inline-flex min-h-11 items-center gap-1 text-link underline underline-offset-4"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Kembali ke resep
      </Link>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      {result instanceof CalcError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.code === 'MISSING_REF'
            ? 'Ada bahan yang sudah dihapus. Hapus baris itu atau pilih bahan lain.'
            : result.message}
        </p>
      ) : null}
      <RecipeEditor
        open
        inline
        recipe={recipe}
        hpp={result instanceof CalcError ? undefined : result.hpp}
        batchCost={result instanceof CalcError ? undefined : result.batchCost}
        onOpenChange={() => {}}
        onDeleted={() => router.push('/dashboard/resep')}
        onDuplicate={() => void duplicate()}
      />
      <OrderCalculator recipeId={recipe.id} />
      <PaywallDialog
        open={paywall}
        trigger="recipe"
        onClose={() => setPaywall(false)}
      />
    </Page>
  );
}
