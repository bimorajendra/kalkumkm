import { unitFactor } from '@takaran/calc';
import type { IngredientRow } from '../../../db/schema';

const commonUnits = ['g', 'kg', 'ml', 'l', 'butir', 'pcs'];

export function unitsFor(ingredient: IngredientRow): string[] {
  const dimension = unitFactor(ingredient.buyUnit, ingredient.customUnits).base;
  return [
    ...new Set([
      ...commonUnits,
      ...ingredient.customUnits.map((item) => item.name),
    ]),
  ].filter((unit) => {
    try {
      return unitFactor(unit, ingredient.customUnits).base === dimension;
    } catch {
      return false;
    }
  });
}

interface RecipeItemRowProps {
  name?: string;
  units?: string[];
  missing?: boolean;
  index: number;
  quantity: string;
  unit: string;
  error?: string;
  onChange: (index: number, field: 'quantity' | 'unit', value: string) => void;
  onRemove: (index: number) => void;
}

export function RecipeItemRow({
  name,
  units = [],
  missing = false,
  index,
  quantity,
  unit,
  error,
  onChange,
  onRemove,
}: RecipeItemRowProps) {
  const fieldId = `recipe-item-${index}`;
  return (
    <li className="recipe-item-row">
      <div className="recipe-item-name">
        <strong>{name ?? 'Bahan ini sudah dihapus'}</strong>
        {missing && (
          <span className="field-error">
            {error ?? 'Hapus baris ini atau pilih bahan lain.'}
          </span>
        )}
      </div>
      {!missing && name && (
        <>
          <label className="sr-only" htmlFor={`${fieldId}-quantity`}>
            Takaran {name}
          </label>
          <input
            id={`${fieldId}-quantity`}
            aria-label={`Takaran ${name}`}
            aria-invalid={Boolean(error)}
            inputMode="decimal"
            value={quantity}
            onChange={(event) =>
              onChange(index, 'quantity', event.target.value)
            }
          />
          <label className="sr-only" htmlFor={`${fieldId}-unit`}>
            Satuan {name}
          </label>
          <select
            id={`${fieldId}-unit`}
            aria-label={`Satuan ${name}`}
            value={unit}
            onChange={(event) => onChange(index, 'unit', event.target.value)}
          >
            {units.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </>
      )}
      <button
        className="text-button"
        type="button"
        onClick={() => onRemove(index)}
      >
        Hapus
      </button>
      {error && !missing && (
        <span className="field-error recipe-item-error">{error}</span>
      )}
    </li>
  );
}
