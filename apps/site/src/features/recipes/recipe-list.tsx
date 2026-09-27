'use client';

import { actualMarginBp, CalcError, suggestPrice } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui/format';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  errorMessage,
  useRecipeResults,
  useRun,
} from '@/components/takaran/data-provider';
import { EmptyState } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';
import type { RecipeRow } from '@/domain/types';
import { MarginAlarm } from '@/features/margin-alarm/margin-alarm';
import { recipeCopy } from './copy';
import { RecipeEditor } from './recipe-editor';

/** Titik dan teks status margin. Warna tidak pernah jadi satu-satunya penanda. */
export function MarginStatus({
  margin,
  above,
  warning = false,
}: {
  margin: number | undefined;
  above: boolean;
  warning?: boolean;
}) {
  const text =
    margin === undefined
      ? 'Belum bisa dihitung'
      : above
        ? 'Di atas target'
        : 'Di bawah target';
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${
        margin === undefined
          ? 'text-muted-foreground'
          : above
            ? 'text-success'
            : 'text-destructive'
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-2.5 rounded-full ${
          margin === undefined
            ? 'bg-muted-foreground'
            : above
              ? 'bg-success'
              : 'bg-destructive'
        }`}
      />
      {warning ? <span aria-hidden="true">!</span> : null}
      {text}
    </span>
  );
}

export function RecipeList() {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<RecipeRow>();
  const [message, setMessage] = useState('');
  const { recipes, settings } = snapshot;
  const { marginAlarm, roundingStep } = settings;

  if (error)
    return (
      <p role="alert" className="text-destructive">
        {recipeCopy.loadError}
      </p>
    );

  if (recipes.length === 0)
    return (
      <>
        <EmptyState
          title={recipeCopy.emptyTitle}
          description={recipeCopy.emptyDescription}
        >
          {message ? (
            <p role="alert" className="basis-full text-sm text-destructive">
              {message}
            </p>
          ) : null}
          <Button
            type="button"
            onClick={async () => {
              setMessage('');
              try {
                const next = await run({ type: 'recipe.seedExample' });
                const id = next.recipes.find(
                  (row) => row.name === 'Brownies',
                )?.id;
                router.push(id ? `/resep/${id}` : '/resep');
              } catch (cause) {
                setMessage(errorMessage(cause, recipeCopy.saveError));
              }
            }}
          >
            {recipeCopy.example}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelected(undefined);
              setEditorOpen(true);
            }}
          >
            {recipeCopy.create}
          </Button>
        </EmptyState>
        <RecipeEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSaved={(id) => id && router.push(`/resep/${id}`)}
        />
      </>
    );

  return (
    <>
      <MarginAlarm />
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-muted-foreground">
          HPP (modal per porsi), harga jual, dan untungmu.
        </p>
        <Button
          type="button"
          onClick={() => {
            setSelected(undefined);
            setEditorOpen(true);
          }}
        >
          Buat resep
        </Button>
      </div>
      <ul aria-label="Daftar resep" className="divide-y divide-border">
        {[...recipes]
          .sort((a, b) => a.name.localeCompare(b.name, 'id'))
          .map((recipe) => {
            const result = results.get(recipe.id);
            const hasError = result instanceof CalcError;
            let price: number | undefined;
            let margin: number | undefined;
            if (result && !hasError) {
              try {
                price =
                  recipe.currentPrice ??
                  suggestPrice(
                    result.hpp,
                    recipe.targetMarginBp,
                    0,
                    roundingStep,
                  );
                margin = actualMarginBp(price, result.hpp, 0);
              } catch {
                price = undefined;
              }
            }
            const above =
              margin !== undefined && margin >= recipe.targetMarginBp;
            const flagged =
              margin !== undefined &&
              !above &&
              marginAlarm !== null &&
              !marginAlarm.dismissed &&
              marginAlarm.recipeIds.includes(recipe.id);
            return (
              <li
                key={recipe.id}
                className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
              >
                <Link href={`/resep/${recipe.id}`} className="min-w-0 flex-1">
                  <strong className="block text-base">{recipe.name}</strong>
                  <span className="block text-sm text-muted-foreground">
                    {hasError ? (
                      <span className="text-destructive">{result.message}</span>
                    ) : result ? (
                      <>
                        HPP {formatRupiah(result.hpp)}{' '}
                        <span aria-hidden="true">·</span> Harga{' '}
                        {price === undefined
                          ? 'belum ada'
                          : formatRupiah(price)}
                      </>
                    ) : (
                      'Menghitung…'
                    )}
                  </span>
                </Link>
                <MarginStatus margin={margin} above={above} warning={flagged} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelected(recipe);
                    setEditorOpen(true);
                  }}
                >
                  Ubah
                </Button>
              </li>
            );
          })}
      </ul>
      <RecipeEditor
        open={editorOpen}
        recipe={selected}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setSelected(undefined);
        }}
      />
    </>
  );
}
