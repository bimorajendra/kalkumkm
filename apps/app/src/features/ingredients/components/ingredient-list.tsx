import type { IngredientRow } from '../../../db/schema';
import { ingredientCopy } from '../copy';
import { useIngredients } from '../repository';
import { IngredientRowView } from './ingredient-row';

interface IngredientListProps {
  query: string;
  onEdit: (ingredient: IngredientRow) => void;
}

export function IngredientList({ query, onEdit }: IngredientListProps) {
  const result = useIngredients(query);
  if ('error' in result && result.error)
    return (
      <p className="form-error" role="alert">
        {ingredientCopy.loadError}
      </p>
    );
  const rows = result.data ?? [];
  if (rows.length === 0)
    return (
      <p className="ingredient-no-results">
        {query ? 'Bahan tidak ditemukan.' : 'Belum ada bahan.'}
      </p>
    );
  return (
    <ul className="ingredient-list" aria-label="Daftar bahan">
      {rows.map(({ ingredient, usageCount }) => (
        <IngredientRowView
          key={ingredient.id}
          ingredient={ingredient}
          usageCount={usageCount}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
