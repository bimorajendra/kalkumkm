'use client';

import { actualMarginBp, CalcError, suggestPrice } from '@takaran/calc';
import { simulateIngredientPriceIncrease } from '@takaran/calc/scenario';
import { formatPercent, formatRupiah } from '@takaran/ui/format';
import Big from 'big.js';
import { useMemo, useState } from 'react';
import type { Results } from '@/components/takaran/data-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { IngredientRow, RecipeRow, Snapshot } from '@/domain/types';

type ImpactRow = {
  recipe: RecipeRow;
  beforeHpp: Big | null;
  afterHpp: Big | null;
  beforeMarginBp: number | null;
  afterMarginBp: number | null;
};

export function PriceImpactSimulator({
  ingredient,
  snapshot,
  results,
  initialOpen = false,
  hideTrigger = false,
  onClose,
}: {
  ingredient: IngredientRow;
  snapshot: Snapshot;
  results: Results;
  initialOpen?: boolean;
  hideTrigger?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [increasePercent, setIncreasePercent] = useState('15');
  const increaseBp = parseIncreasePercent(increasePercent);
  const scenario = useMemo(() => {
    if (!open || increaseBp === null) return null;
    try {
      const context = {
        ingredients: new Map(snapshot.ingredients.map((row) => [row.id, row])),
        recipes: new Map(snapshot.recipes.map((row) => [row.id, row])),
        roundingStep: snapshot.settings.roundingStep,
      };
      return simulateIngredientPriceIncrease(
        context,
        ingredient.id,
        increaseBp,
      );
    } catch {
      return null;
    }
  }, [increaseBp, ingredient.id, open, snapshot]);

  const impactedRecipes = useMemo(() => {
    if (!scenario) return [];
    const recipesById = new Map(
      snapshot.recipes.map((recipe) => [recipe.id, recipe]),
    );
    const directChannel = snapshot.channels.find(
      (channel) => channel.name === 'Langsung',
    );
    const commissionBp =
      directChannel?.kind === 'commission' ? directChannel.rateBp : 0;

    return snapshot.recipes
      .filter((recipe) =>
        recipeUsesIngredient(recipe.id, ingredient.id, recipesById),
      )
      .map((recipe): ImpactRow => {
        const before = results.get(recipe.id);
        const after = scenario.results.get(recipe.id);
        const beforeHpp =
          before && !(before instanceof CalcError) ? before.hpp : null;
        const afterHpp =
          after && !(after instanceof CalcError) ? after.hpp : null;
        return {
          recipe,
          beforeHpp,
          afterHpp,
          beforeMarginBp: calculateMargin(
            recipe,
            beforeHpp,
            commissionBp,
            snapshot.settings.roundingStep,
          ),
          afterMarginBp: calculateMargin(
            recipe,
            afterHpp,
            commissionBp,
            snapshot.settings.roundingStep,
          ),
        };
      });
  }, [ingredient.id, results, scenario, snapshot]);

  const invalidPercent = increaseBp === null;

  return (
    <>
      {!hideTrigger ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          Simulasikan kenaikan
        </Button>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) onClose?.();
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-semibold">
              Dampak harga {ingredient.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label
                htmlFor={`price-impact-${ingredient.id}`}
                className="font-medium"
              >
                Kenaikan harga (%)
              </label>
              <Input
                id={`price-impact-${ingredient.id}`}
                type="text"
                inputMode="decimal"
                value={increasePercent}
                aria-invalid={invalidPercent || undefined}
                aria-describedby={
                  invalidPercent
                    ? `price-impact-error-${ingredient.id}`
                    : undefined
                }
                onChange={(event) => setIncreasePercent(event.target.value)}
              />
              {invalidPercent ? (
                <p
                  id={`price-impact-error-${ingredient.id}`}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  Masukkan kenaikan dari 0 sampai 10.000 persen, maksimal dua
                  angka desimal.
                </p>
              ) : null}
            </div>
            {scenario ? (
              <p className="text-sm text-muted-foreground">
                Harga simulasi {formatRupiah(scenario.simulatedPrice)}.
                Perubahan ini hanya untuk simulasi dan tidak tersimpan.
              </p>
            ) : null}
            {increaseBp !== null && !scenario ? (
              <p role="alert" className="text-sm text-destructive">
                Simulasi belum bisa dihitung. Periksa bahan dan resep terkait.
              </p>
            ) : null}
            {scenario && impactedRecipes.length > 0 ? (
              <>
                <p className="font-medium">
                  {impactedRecipes.length} resep terdampak
                </p>
                <ul className="divide-y divide-border">
                  {impactedRecipes.map((row) => (
                    <li key={row.recipe.id} className="grid gap-1 py-3">
                      <h3 className="font-semibold">{row.recipe.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        HPP{' '}
                        {row.beforeHpp
                          ? formatRupiah(row.beforeHpp)
                          : 'belum tersedia'}{' '}
                        →{' '}
                        {row.afterHpp
                          ? formatRupiah(row.afterHpp)
                          : 'belum tersedia'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Margin{' '}
                        {row.beforeMarginBp === null
                          ? 'belum tersedia'
                          : formatPercent(row.beforeMarginBp)}{' '}
                        →{' '}
                        {row.afterMarginBp === null
                          ? 'belum tersedia'
                          : formatPercent(row.afterMarginBp)}
                        {row.afterMarginBp !== null &&
                        row.afterMarginBp < row.recipe.targetMarginBp
                          ? ` · di bawah target ${formatPercent(row.recipe.targetMarginBp)}`
                          : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {scenario && impactedRecipes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada resep yang memakai bahan ini.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function parseIncreasePercent(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  try {
    const basisPoints = new Big(normalized).times(100);
    if (!basisPoints.round(0).eq(basisPoints) || basisPoints.gt(1_000_000))
      return null;
    return basisPoints.toNumber();
  } catch {
    return null;
  }
}

function recipeUsesIngredient(
  recipeId: string,
  ingredientId: string,
  recipes: Map<string, RecipeRow>,
  visited = new Set<string>(),
): boolean {
  if (visited.has(recipeId)) return false;
  const recipe = recipes.get(recipeId);
  if (!recipe) return false;
  visited.add(recipeId);
  return recipe.items.some(
    (item) =>
      (item.refType === 'ingredient' && item.refId === ingredientId) ||
      (item.refType === 'recipe' &&
        recipeUsesIngredient(item.refId, ingredientId, recipes, visited)),
  );
}

function calculateMargin(
  recipe: RecipeRow,
  hpp: Big | null,
  commissionBp: number,
  roundingStep: number,
): number | null {
  if (!hpp) return null;
  try {
    const price =
      recipe.currentPrice ??
      suggestPrice(hpp, recipe.targetMarginBp, commissionBp, roundingStep);
    return actualMarginBp(price, hpp, commissionBp);
  } catch {
    return null;
  }
}
