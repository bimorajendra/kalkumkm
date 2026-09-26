import { useEffect, useState } from 'react';
import type { RecipeRow } from '../../db/schema';
import { getRecipe, updateRecipe } from '../recipes/repository';
import { scheduleSave } from './save-delay';

interface CalculatorDraft {
  recipeId: string;
  targetMarginBp: number;
  laborMinutesPerBatch: number;
}

export function useCalculator(recipe: RecipeRow) {
  const [draft, setDraft] = useState<CalculatorDraft>(() => ({
    recipeId: recipe.id,
    targetMarginBp: recipe.targetMarginBp,
    laborMinutesPerBatch: recipe.laborMinutesPerBatch,
  }));
  const [saveError, setSaveError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const active =
    draft.recipeId === recipe.id
      ? draft
      : {
          recipeId: recipe.id,
          targetMarginBp: recipe.targetMarginBp,
          laborMinutesPerBatch: recipe.laborMinutesPerBatch,
        };

  useEffect(() => {
    if (draft.recipeId !== recipe.id) {
      setDirty(false);
      setDraft({
        recipeId: recipe.id,
        targetMarginBp: recipe.targetMarginBp,
        laborMinutesPerBatch: recipe.laborMinutesPerBatch,
      });
    }
  }, [
    draft.recipeId,
    recipe.id,
    recipe.laborMinutesPerBatch,
    recipe.targetMarginBp,
  ]);

  useEffect(() => {
    if (draft.recipeId !== recipe.id || !dirty) return;
    return scheduleSave(async () => {
      try {
        const latest = await getRecipe(recipe.id);
        if (!latest) return;
        await updateRecipe(recipe.id, {
          ...latest,
          targetMarginBp: draft.targetMarginBp,
          laborMinutesPerBatch: draft.laborMinutesPerBatch,
        });
        setSaveError(false);
        setDirty(false);
      } catch {
        setSaveError(true);
      }
    }, 300);
  }, [dirty, draft, recipe.id]);

  return {
    targetMarginBp: active.targetMarginBp,
    laborMinutesPerBatch: active.laborMinutesPerBatch,
    saveError,
    setTargetMarginBp: (value: number) => {
      setDirty(true);
      setDraft((current) => ({
        ...current,
        recipeId: recipe.id,
        targetMarginBp: value,
      }));
    },
    setLaborMinutesPerBatch: (value: number) => {
      setDirty(true);
      setDraft((current) => ({
        ...current,
        recipeId: recipe.id,
        laborMinutesPerBatch: value,
      }));
    },
  };
}
