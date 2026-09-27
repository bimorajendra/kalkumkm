'use client';

import { useEffect, useState } from 'react';
import { useRun } from '@/components/takaran/data-provider';
import type { RecipeRow } from '@/domain/types';

interface Draft {
  recipeId: string;
  targetMarginBp: number;
  laborMinutesPerBatch: number;
}

const fromRecipe = (recipe: RecipeRow): Draft => ({
  recipeId: recipe.id,
  targetMarginBp: recipe.targetMarginBp,
  laborMinutesPerBatch: recipe.laborMinutesPerBatch,
});

/**
 * Nilai slider ditampilkan langsung dari draf lokal supaya hasil terasa instan,
 * lalu disimpan ke server 300 ms setelah geseran terakhir.
 */
export function useCalculator(recipe: RecipeRow) {
  const run = useRun();
  const [draft, setDraft] = useState(() => fromRecipe(recipe));
  const [saveError, setSaveError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const active = draft.recipeId === recipe.id ? draft : fromRecipe(recipe);

  useEffect(() => {
    if (draft.recipeId !== recipe.id) {
      setDirty(false);
      setDraft(fromRecipe(recipe));
    }
  }, [draft.recipeId, recipe]);

  useEffect(() => {
    if (draft.recipeId !== recipe.id || !dirty) return;
    const timer = setTimeout(async () => {
      try {
        await run({
          type: 'recipe.patch',
          id: recipe.id,
          patch: {
            targetMarginBp: draft.targetMarginBp,
            laborMinutesPerBatch: draft.laborMinutesPerBatch,
          },
        });
        setSaveError(false);
        setDirty(false);
      } catch {
        setSaveError(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [dirty, draft, recipe.id, run]);

  const change = (patch: Partial<Draft>) => {
    setDirty(true);
    setDraft((current) => ({ ...current, recipeId: recipe.id, ...patch }));
  };

  return {
    targetMarginBp: active.targetMarginBp,
    laborMinutesPerBatch: active.laborMinutesPerBatch,
    saveError,
    setTargetMarginBp: (value: number) => change({ targetMarginBp: value }),
    setLaborMinutesPerBatch: (value: number) =>
      change({ laborMinutesPerBatch: value }),
  };
}
