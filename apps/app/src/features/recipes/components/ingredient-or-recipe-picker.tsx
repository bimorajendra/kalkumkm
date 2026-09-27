import type { IngredientRow, RecipeRow } from '../../../db/schema';

interface IngredientOrRecipePickerProps {
  ingredients: IngredientRow[];
  recipes: RecipeRow[];
  currentRecipeId?: string;
  selected: Array<{ refType: 'ingredient' | 'recipe'; refId: string }>;
  onAdd: (refType: 'ingredient' | 'recipe', refId: string) => void;
}

export function IngredientOrRecipePicker({
  ingredients,
  recipes,
  currentRecipeId,
  selected,
  onAdd,
}: IngredientOrRecipePickerProps) {
  return (
    <label className="ingredient-label" htmlFor="recipe-add-item">
      Tambah bahan atau sub-resep
      <select
        id="recipe-add-item"
        value=""
        onChange={(event) => {
          const [type, ...id] = event.target.value.split(':');
          if ((type === 'ingredient' || type === 'recipe') && id.length)
            onAdd(type, id.join(':'));
        }}
      >
        <option value="">Pilih bahan atau sub-resep</option>
        <optgroup label="Bahan">
          {ingredients
            .filter(
              (item) =>
                !selected.some(
                  (entry) =>
                    entry.refType === 'ingredient' && entry.refId === item.id,
                ),
            )
            .map((item) => (
              <option value={`ingredient:${item.id}`} key={item.id}>
                {item.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Sub-resep">
          {recipes
            .filter(
              (item) =>
                item.id !== currentRecipeId &&
                item.isSubRecipe &&
                !selected.some(
                  (entry) =>
                    entry.refType === 'recipe' && entry.refId === item.id,
                ),
            )
            .map((item) => (
              <option value={`recipe:${item.id}`} key={item.id}>
                {item.name}
              </option>
            ))}
        </optgroup>
      </select>
    </label>
  );
}
