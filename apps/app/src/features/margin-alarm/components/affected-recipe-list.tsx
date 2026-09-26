import { formatPercent, formatRupiah } from '@takaran/ui';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { marginAlarmCopy } from '../copy';
import type { AffectedRecipe } from '../evaluate';

export function AffectedRecipeList({
  error,
  isOpen,
  onApply,
  onClose,
  recipes,
}: {
  error: string;
  isOpen: boolean;
  onApply: (item: AffectedRecipe) => void;
  onClose: () => void;
  recipes: AffectedRecipe[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      aria-labelledby="margin-alarm-title"
      className="margin-alarm__dialog"
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="margin-alarm__heading">
        <h2 id="margin-alarm-title">{marginAlarmCopy.listTitle}</h2>
        <button
          aria-label={marginAlarmCopy.closeList}
          className="icon-button"
          onClick={onClose}
          type="button"
        >
          Tutup
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <ul className="margin-alarm__list">
        {recipes.map((item) => (
          <li key={item.recipe.id}>
            <Link to={`/resep/${item.recipe.id}`}>{item.recipe.name}</Link>
            <span>
              Harga sekarang {formatRupiah(item.recipe.currentPrice ?? 0)}
            </span>
            <span>Margin sekarang {formatPercent(item.marginBp)}</span>
            <span>Harga saran {formatRupiah(item.suggestedPrice)}</span>
            <button
              className="button button-primary"
              onClick={() => onApply(item)}
              type="button"
            >
              {marginAlarmCopy.priceActionLabel(
                formatRupiah(item.suggestedPrice),
              )}
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
