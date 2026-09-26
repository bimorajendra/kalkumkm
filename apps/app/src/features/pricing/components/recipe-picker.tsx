import { IsometricGlyph } from '@takaran/ui';
import { useEffect, useRef, useState } from 'react';
import type { RecipeRow } from '../../../db/schema';

interface RecipePickerProps {
  recipes: RecipeRow[];
  selectedId: string;
  onSelect: (recipe: RecipeRow) => void;
}

export function RecipePicker({
  recipes,
  selectedId,
  onSelect,
}: RecipePickerProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = recipes.find((recipe) => recipe.id === selectedId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        className="recipe-picker-chip"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span aria-hidden="true" className="recipe-picker-chip__mark">
          <IsometricGlyph />
        </span>
        <span>
          {selected?.name ?? 'Pilih resep'} · {selected?.yieldPortions ?? 0}{' '}
          potong
        </span>
        <span aria-hidden="true">⌄</span>
      </button>
      <dialog
        aria-labelledby="recipe-picker-title"
        className="recipe-picker-dialog"
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <div className="recipe-picker-dialog__heading">
          <h2 id="recipe-picker-title">Pilih resep</h2>
          <button
            aria-label="Tutup"
            className="icon-button"
            onClick={() => setOpen(false)}
            type="button"
          >
            ×
          </button>
        </div>
        <ul className="recipe-picker-list">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <button
                aria-current={recipe.id === selectedId ? 'true' : undefined}
                onClick={() => {
                  onSelect(recipe);
                  setOpen(false);
                }}
                type="button"
              >
                <span>{recipe.name}</span>
                <span>{recipe.yieldPortions} potong</span>
              </button>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
