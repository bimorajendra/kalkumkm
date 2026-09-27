interface SubRecipeSettingsProps {
  enabled: boolean;
  quantity: string;
  unit: string;
  onChange: (
    field: 'isSubRecipe' | 'subRecipeYieldQty' | 'subRecipeYieldUnit',
    value: boolean | string,
  ) => void;
}

export function SubRecipeSettings({
  enabled,
  quantity,
  unit,
  onChange,
}: SubRecipeSettingsProps) {
  return (
    <fieldset className="recipe-labor">
      <legend>Sub-resep</legend>
      <label className="ingredient-label">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onChange('isSubRecipe', event.target.checked)}
        />
        Pakai sebagai bahan di resep lain
      </label>
      {enabled && (
        <div className="recipe-number-fields">
          <label className="ingredient-label" htmlFor="sub-recipe-yield">
            Hasil sub-resep
            <input
              id="sub-recipe-yield"
              inputMode="decimal"
              value={quantity}
              onChange={(event) =>
                onChange('subRecipeYieldQty', event.target.value)
              }
            />
          </label>
          <label className="ingredient-label" htmlFor="sub-recipe-unit">
            Satuan hasil
            <select
              id="sub-recipe-unit"
              value={unit}
              onChange={(event) =>
                onChange('subRecipeYieldUnit', event.target.value)
              }
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="butir">butir</option>
              <option value="pcs">pcs</option>
            </select>
          </label>
        </div>
      )}
    </fieldset>
  );
}
