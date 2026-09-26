import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { IngredientRow, RecipeRow } from '../../../db/schema';
import { listIngredients } from '../../ingredients/repository';
import { recipeCopy } from '../copy';
import {
  createRecipe,
  deleteRecipe,
  RecipeRepositoryError,
  recipeInputFromForm,
  updateRecipe,
} from '../repository';
import { type RecipeFormValues, recipeFormSchema } from '../schema';
import { RecipeItemRow } from './recipe-item-row';

const blank: RecipeFormValues = {
  name: '',
  yieldPortions: '1',
  packagingPerPortion: '0',
  energyPerBatch: '0',
  laborMinutesPerBatch: '0',
  laborRatePerHour: '',
  items: [],
};
function valuesFor(recipe?: RecipeRow): RecipeFormValues {
  if (!recipe) return blank;
  return {
    name: recipe.name,
    yieldPortions: String(recipe.yieldPortions),
    packagingPerPortion: String(recipe.packagingPerPortion),
    energyPerBatch: String(recipe.energyPerBatch),
    laborMinutesPerBatch: String(recipe.laborMinutesPerBatch),
    laborRatePerHour:
      recipe.laborRatePerHour === null ? '' : String(recipe.laborRatePerHour),
    items: recipe.items
      .filter((item) => item.refType === 'ingredient')
      .map(({ refId, quantity, unit }) => ({
        refId,
        quantity: String(quantity),
        unit,
      })),
  };
}

interface RecipeEditorProps {
  open: boolean;
  recipe?: RecipeRow;
  onOpenChange: (open: boolean) => void;
  onSaved?: (recipe: RecipeRow) => void;
  onDeleted?: () => void;
}

export function RecipeEditor({
  open,
  recipe,
  onOpenChange,
  onSaved,
  onDeleted,
}: RecipeEditorProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<RecipeFormValues>(() =>
    valuesFor(recipe),
  );
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(valuesFor(recipe));
      setErrors({});
      setMessage('');
      void listIngredients()
        .then(setIngredients)
        .catch(() =>
          setMessage('Daftar bahan belum terbaca. Coba tutup lalu buka lagi.'),
        );
    }
  }, [open, recipe]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  function update<K extends keyof RecipeFormValues>(
    field: K,
    value: RecipeFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }
  function updateItem(
    index: number,
    field: 'quantity' | 'unit',
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setErrors((current) => ({ ...current, [`items.${index}.${field}`]: '' }));
  }
  function addIngredient(id: string) {
    const ingredient = ingredients.find((item) => item.id === id);
    if (!ingredient || values.items.some((item) => item.refId === id)) return;
    setValues((current) => ({
      ...current,
      items: [
        ...current.items,
        { refId: id, quantity: '1', unit: ingredient.buyUnit },
      ],
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = recipeFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[issue.path.join('.')] = issue.message;
      });
      setErrors(next);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const input = await recipeInputFromForm(parsed.data);
      const saved = recipe
        ? await updateRecipe(recipe.id, input)
        : await createRecipe(input);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (error) {
      setMessage(
        error instanceof RecipeRepositoryError
          ? error.message
          : recipeCopy.saveError,
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!recipe || !window.confirm(`Hapus resep “${recipe.name}”?`)) return;
    try {
      await deleteRecipe(recipe.id);
      onDeleted?.();
      onOpenChange(false);
    } catch {
      setMessage(recipeCopy.deleteError);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="ingredient-dialog recipe-dialog"
      aria-labelledby="recipe-form-title"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
    >
      <form className="ingredient-form recipe-form" onSubmit={save} noValidate>
        <div className="ingredient-form-heading">
          <h2 id="recipe-form-title">{recipe ? 'Ubah resep' : 'Buat resep'}</h2>
          <button
            className="icon-button"
            aria-label="Tutup"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            ×
          </button>
        </div>
        <label className="ingredient-label" htmlFor="recipe-name">
          Nama resep
          <input
            id="recipe-name"
            maxLength={60}
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'recipe-name-error' : undefined}
          />
          {errors.name && (
            <span className="field-error" id="recipe-name-error">
              {errors.name}
            </span>
          )}
        </label>
        <fieldset className="recipe-items-fieldset">
          <legend>Bahan dan takaran</legend>
          {values.items.length > 0 && (
            <ul className="recipe-item-list">
              {values.items.map((item, index) => (
                <RecipeItemRow
                  key={`${item.refId}-${index}`}
                  ingredient={ingredients.find(({ id }) => id === item.refId)}
                  index={index}
                  quantity={item.quantity}
                  unit={item.unit}
                  error={
                    errors[`items.${index}.quantity`] ??
                    errors[`items.${index}.refId`]
                  }
                  onChange={updateItem}
                  onRemove={(removeIndex) =>
                    setValues((current) => ({
                      ...current,
                      items: current.items.filter(
                        (_, itemIndex) => itemIndex !== removeIndex,
                      ),
                    }))
                  }
                />
              ))}
            </ul>
          )}
          {ingredients.length > 0 ? (
            <label className="ingredient-label" htmlFor="recipe-add-item">
              Tambah bahan ke resep
              <select
                id="recipe-add-item"
                value=""
                onChange={(event) => addIngredient(event.target.value)}
              >
                <option value="">Pilih bahan</option>
                {ingredients
                  .filter(
                    (item) =>
                      !values.items.some(
                        (selected) => selected.refId === item.id,
                      ),
                  )
                  .map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <p className="recipe-no-ingredients">{recipeCopy.noIngredients}</p>
          )}
        </fieldset>
        <div className="recipe-number-fields">
          <label className="ingredient-label" htmlFor="recipe-yield">
            Hasil per adonan (porsi)
            <input
              id="recipe-yield"
              inputMode="numeric"
              value={values.yieldPortions}
              onChange={(event) => update('yieldPortions', event.target.value)}
              aria-invalid={Boolean(errors.yieldPortions)}
            />
            {errors.yieldPortions && (
              <span className="field-error">{errors.yieldPortions}</span>
            )}
          </label>
          <label className="ingredient-label" htmlFor="recipe-packaging">
            Kemasan per porsi (Rp)
            <input
              id="recipe-packaging"
              inputMode="numeric"
              value={values.packagingPerPortion}
              onChange={(event) =>
                update('packagingPerPortion', event.target.value)
              }
              aria-invalid={Boolean(errors.packagingPerPortion)}
            />
            {errors.packagingPerPortion && (
              <span className="field-error">{errors.packagingPerPortion}</span>
            )}
          </label>
          <label className="ingredient-label" htmlFor="recipe-energy">
            Energi per adonan (Rp)
            <input
              id="recipe-energy"
              inputMode="numeric"
              value={values.energyPerBatch}
              onChange={(event) => update('energyPerBatch', event.target.value)}
              aria-invalid={Boolean(errors.energyPerBatch)}
            />
            {errors.energyPerBatch && (
              <span className="field-error">{errors.energyPerBatch}</span>
            )}
          </label>
        </div>
        <fieldset className="recipe-labor">
          <legend>Tenaga, kalau mau dihitung</legend>
          <p>
            Kalau dikosongkan, hasil untung per jam nanti menunjukkan upah yang
            kamu terima.
          </p>
          <label className="ingredient-label" htmlFor="recipe-labor-rate">
            Upah per jam (Rp)
            <input
              id="recipe-labor-rate"
              inputMode="numeric"
              value={values.laborRatePerHour}
              onChange={(event) =>
                update('laborRatePerHour', event.target.value)
              }
              aria-invalid={Boolean(errors.laborRatePerHour)}
            />
            {errors.laborRatePerHour && (
              <span className="field-error">{errors.laborRatePerHour}</span>
            )}
          </label>
          <label className="ingredient-label" htmlFor="recipe-labor-minutes">
            Waktu kerja per adonan (menit)
            <input
              id="recipe-labor-minutes"
              inputMode="numeric"
              value={values.laborMinutesPerBatch}
              onChange={(event) =>
                update('laborMinutesPerBatch', event.target.value)
              }
              aria-invalid={Boolean(errors.laborMinutesPerBatch)}
            />
            {errors.laborMinutesPerBatch && (
              <span className="field-error">{errors.laborMinutesPerBatch}</span>
            )}
          </label>
        </fieldset>
        {message && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}
        <div className="ingredient-form-actions">
          {recipe && (
            <button
              className="text-button delete-button"
              type="button"
              onClick={remove}
            >
              Hapus resep
            </button>
          )}
          <button
            className="button"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Menyimpan…' : 'Simpan resep'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
