import {
  actualMarginBp,
  CalcError,
  type RecipeResult,
  suggestPrice,
} from '@takaran/calc';
import { useMemo, useState } from 'react';
import type {
  MarginAlarm as MarginAlarmValue,
  RecipeRow,
} from '../../../db/schema';
import { updateRecipe } from '../../recipes/repository';
import { setSetting, useSetting } from '../../settings/repository';
import type { AffectedRecipe } from '../evaluate';
import { AffectedRecipeList } from './affected-recipe-list';
import { MarginAlarmBanner } from './margin-alarm-banner';

interface RecipeData {
  recipes: RecipeRow[];
  results: Map<string, RecipeResult | CalcError>;
}

export function MarginAlarm({ data }: { data: RecipeData }) {
  const alarm = useSetting('marginAlarm');
  const roundingStep = useSetting('roundingStep');
  const [listOpen, setListOpen] = useState(false);
  const [saveError, setSaveError] = useState('');

  const affected = useMemo(() => {
    if (!isCurrentAlarm(alarm)) return [];
    return alarm.recipeIds.flatMap((id) => {
      const recipe = data.recipes.find((item) => item.id === id);
      const result = data.results.get(id);
      if (
        !recipe ||
        recipe.currentPrice === null ||
        !result ||
        result instanceof CalcError
      )
        return [];
      try {
        const marginBp = actualMarginBp(recipe.currentPrice, result.hpp, 0);
        if (marginBp >= recipe.targetMarginBp) return [];
        return [
          {
            recipe,
            hpp: result.hpp,
            marginBp,
            suggestedPrice: suggestPrice(
              result.hpp,
              recipe.targetMarginBp,
              0,
              roundingStep,
            ),
          },
        ];
      } catch {
        return [];
      }
    });
  }, [alarm, data.recipes, data.results, roundingStep]);

  if (!isCurrentAlarm(alarm) || alarm.dismissed || affected.length === 0)
    return null;

  async function applySuggestedPrice(item: AffectedRecipe) {
    setSaveError('');
    try {
      await updateRecipe(item.recipe.id, {
        ...item.recipe,
        currentPrice: item.suggestedPrice,
      });
      if (!isCurrentAlarm(alarm)) return;
      const recipeIds = alarm.recipeIds.filter((id) => id !== item.recipe.id);
      await setSetting(
        'marginAlarm',
        recipeIds.length === 0 ? null : { ...alarm, recipeIds },
      );
    } catch {
      setSaveError('Harga belum tersimpan. Coba lagi.');
    }
  }

  function dismiss() {
    if (isCurrentAlarm(alarm)) {
      void setSetting('marginAlarm', { ...alarm, dismissed: true }).catch(() =>
        setSaveError('Pemberitahuan belum bisa ditutup. Coba lagi.'),
      );
    }
  }

  return (
    <section className="margin-alarm" aria-label="Pemberitahuan margin">
      {saveError && !listOpen ? <p role="alert">{saveError}</p> : null}
      <MarginAlarmBanner
        count={affected.length}
        onDismiss={dismiss}
        onView={() => setListOpen(true)}
      />
      <AffectedRecipeList
        error={saveError}
        isOpen={listOpen}
        onApply={(item) => void applySuggestedPrice(item)}
        onClose={() => setListOpen(false)}
        recipes={affected}
      />
    </section>
  );
}

function isCurrentAlarm(
  value: MarginAlarmValue | null,
): value is MarginAlarmValue {
  return (
    value !== null &&
    Array.isArray(value.recipeIds) &&
    typeof value.dismissed === 'boolean'
  );
}
