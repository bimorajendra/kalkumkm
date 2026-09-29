'use client';

import { actualMarginBp, CalcError, suggestPrice } from '@takaran/calc';
import { FREE_LIMITS } from '@takaran/schema';
import { formatRupiah } from '@takaran/ui/format';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  errorMessage,
  useRecipeResults,
  useRun,
} from '@/components/takaran/data-provider';
import { EmptyState, PageTitle } from '@/components/takaran/page';
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
      {warning ? <span aria-hidden="true">!</span> : null}
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

export function RecipeList() {
  const { snapshot, results, error } = useRecipeResults();
  const run = useRun();
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<RecipeRow>();
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'below' | 'above'>('all');
  const { recipes, settings } = snapshot;
  const { marginAlarm, roundingStep } = settings;
  const header = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <PageTitle>Resep</PageTitle>
        <p className="text-sm text-muted-foreground">
          {snapshot.plan === 'pro'
            ? `${recipes.length} resep tersimpan`
            : `${recipes.length} dari ${FREE_LIMITS.recipes} resep gratis`}
        </p>
      </div>
      <Button
        type="button"
        size="lg"
        className="min-h-12 rounded-full"
        onClick={() => {
          setSelected(undefined);
          setEditorOpen(true);
        }}
      >
        Buat resep
      </Button>
    </header>
  );

  if (error)
    return (
      <p role="alert" className="text-destructive">
        {recipeCopy.loadError}
      </p>
    );

  if (recipes.length === 0)
    return (
      <div className="grid gap-5">
        {header}
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
                router.push(id ? `/dashboard/resep/${id}` : '/dashboard/resep');
              } catch (cause) {
                setMessage(errorMessage(cause, recipeCopy.saveError));
              }
            }}
          >
            {recipeCopy.example}
          </Button>
        </EmptyState>
        <RecipeEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSaved={(id) => id && router.push(`/dashboard/resep/${id}`)}
        />
      </div>
    );

  const rows = [...recipes]
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))
    .map((recipe) => {
      const result = results.get(recipe.id);
      const hasError = result instanceof CalcError;
      let price: number | undefined;
      let suggested: number | undefined;
      let margin: number | undefined;
      if (result && !hasError) {
        try {
          suggested = suggestPrice(
            result.hpp,
            recipe.targetMarginBp,
            0,
            roundingStep,
          );
          price = recipe.currentPrice ?? suggested;
          margin = actualMarginBp(price, result.hpp, 0);
        } catch {
          price = undefined;
        }
      }
      const above = margin !== undefined && margin >= recipe.targetMarginBp;
      const flagged =
        margin !== undefined &&
        !above &&
        marginAlarm !== null &&
        !marginAlarm.dismissed &&
        marginAlarm.recipeIds.includes(recipe.id);
      return {
        recipe,
        result,
        hasError,
        price,
        suggested,
        margin,
        above,
        flagged,
      };
    });
  const visibleRows = rows.filter(({ margin, above }) => {
    if (filter === 'below') return margin !== undefined && !above;
    if (filter === 'above') return margin !== undefined && above;
    return true;
  });

  return (
    <div className="grid gap-4">
      <MarginAlarm />
      {header}
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Saring resep</legend>
        {(
          [
            ['all', `Semua (${rows.length})`],
            [
              'below',
              `Di bawah target (${rows.filter((row) => row.margin !== undefined && !row.above).length})`,
            ],
            [
              'above',
              `Di atas target (${rows.filter((row) => row.margin !== undefined && row.above).length})`,
            ],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={filter === value ? 'default' : 'outline'}
            aria-pressed={filter === value}
            className="min-h-10 rounded-full"
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </fieldset>
      {visibleRows.length ? (
        <section className="overflow-hidden rounded-[20px] border border-line bg-surface">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(125px,1fr)_minmax(125px,1fr)_minmax(90px,.7fr)_minmax(120px,1fr)_48px] gap-2 border-b border-line bg-surface-soft px-4 py-3 text-sm font-medium text-ink-muted xl:grid">
            <span>Menu</span>
            <span className="text-right">Modal per porsi</span>
            <span className="text-right">Harga jual</span>
            <span>Margin</span>
            <span>Status</span>
            <span className="sr-only">Aksi</span>
          </div>
          <ul
            aria-label="Daftar resep"
            className="divide-y divide-line px-4 xl:px-0"
          >
            {visibleRows.map(
              ({
                recipe,
                result,
                price,
                suggested,
                margin,
                above,
                flagged,
              }) => (
                <li
                  key={recipe.id}
                  className="grid gap-3 py-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(125px,1fr)_minmax(125px,1fr)_minmax(90px,.7fr)_minmax(120px,1fr)_48px] xl:items-center xl:gap-2 xl:px-4"
                >
                  <Link
                    href={`/dashboard/resep/${recipe.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <Image
                      src="/icon.png"
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 shrink-0 object-contain"
                    />
                    <span className="min-w-0">
                      <strong className="block min-h-11 content-center text-base">
                        {recipe.name}
                      </strong>
                      <span className="block text-sm text-muted-foreground xl:hidden">
                        {result instanceof CalcError ? (
                          <span className="text-destructive">
                            {result.message}
                          </span>
                        ) : result ? (
                          `HPP ${formatRupiah(result.hpp)} · Harga ${price === undefined ? 'belum ada' : formatRupiah(price)}`
                        ) : (
                          'Menghitung…'
                        )}
                      </span>
                    </span>
                  </Link>
                  <span className="hidden text-right tabular-nums xl:inline">
                    {result instanceof CalcError
                      ? 'Belum tersedia'
                      : result
                        ? formatRupiah(result.hpp)
                        : 'Menghitung…'}
                  </span>
                  <span className="hidden text-right tabular-nums xl:inline">
                    {price === undefined ? (
                      'Belum tersedia'
                    ) : (
                      <>
                        {formatRupiah(price)}
                        {!above &&
                        recipe.currentPrice !== null &&
                        suggested !== undefined &&
                        suggested !== price ? (
                          <span className="block text-xs font-medium text-caramel-700">
                            Saran {formatRupiah(suggested)}
                          </span>
                        ) : null}
                      </>
                    )}
                  </span>
                  <span className="hidden items-center gap-2 tabular-nums xl:flex">
                    {margin === undefined ? (
                      '—'
                    ) : (
                      <>
                        <span>
                          {(margin / 100).toLocaleString('id-ID', {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </span>
                        <MarginBar
                          marginBp={margin}
                          targetMarginBp={recipe.targetMarginBp}
                        />
                      </>
                    )}
                  </span>
                  <MarginStatus
                    margin={margin}
                    above={above}
                    warning={flagged}
                  />
                  <Link
                    href={`/dashboard/resep/${recipe.id}`}
                    aria-label={`Buka ${recipe.name}`}
                    className="hidden size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/70 hover:text-foreground xl:flex"
                  >
                    <ChevronRight aria-hidden="true" className="size-5" />
                  </Link>
                </li>
              ),
            )}
          </ul>
        </section>
      ) : (
        <p className="rounded-[20px] border border-line bg-surface p-5 text-muted-foreground">
          Tidak ada resep untuk saringan ini.
        </p>
      )}
      <RecipeEditor
        open={editorOpen}
        recipe={selected}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setSelected(undefined);
        }}
      />
    </div>
  );
}
