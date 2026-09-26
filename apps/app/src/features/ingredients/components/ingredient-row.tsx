import { unitPrice } from '@takaran/calc';
import { formatRupiah } from '@takaran/ui';
import { useEffect, useRef, useState } from 'react';
import type { IngredientRow } from '../../../db/schema';
import { ingredientCopy } from '../copy';
import { IngredientRepositoryError, updatePrice } from '../repository';

interface IngredientRowProps {
  ingredient: IngredientRow;
  usageCount: number;
  onEdit: (ingredient: IngredientRow) => void;
}

const packageFormat = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 3,
});
const unitNames: Record<string, string> = { g: 'gram', ml: 'ml', pcs: 'pcs' };

export function IngredientRowView({
  ingredient,
  usageCount,
  onEdit,
}: IngredientRowProps) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(ingredient.buyPrice));
  const [error, setError] = useState('');
  const [showUsage, setShowUsage] = useState(false);
  const saving = useRef(false);
  const priceInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) priceInput.current?.focus();
  }, [editing]);
  const pack = packageFormat.format(ingredient.packSize);
  const pricePerUnit = formatRupiah(unitPrice(ingredient));
  const base =
    ingredient.customUnits.find(({ name }) => name === ingredient.buyUnit)
      ?.base ??
    { kg: 'g', g: 'g', l: 'ml', ml: 'ml', butir: 'pcs', pcs: 'pcs' }[
      ingredient.buyUnit
    ] ??
    'g';

  async function savePrice() {
    if (saving.current || !editing) return;
    if (
      !/^\d+$/.test(price) ||
      Number(price) < 1 ||
      Number(price) > 100_000_000 ||
      !Number.isSafeInteger(Number(price))
    ) {
      setError('Masukkan harga Rp 1 sampai Rp 100.000.000.');
      return;
    }
    saving.current = true;
    try {
      const changed = Number(price) !== ingredient.buyPrice;
      await updatePrice(ingredient.id, Number(price));
      setEditing(false);
      setError('');
      if (changed) setShowUsage(true);
    } catch (cause) {
      setError(
        cause instanceof IngredientRepositoryError
          ? cause.message
          : 'Harga belum tersimpan. Coba lagi.',
      );
    } finally {
      saving.current = false;
    }
  }

  function cancelPrice() {
    setPrice(String(ingredient.buyPrice));
    setError('');
    setEditing(false);
  }

  return (
    <li className="ingredient-row">
      <div className="ingredient-description">
        <button
          className="ingredient-name"
          type="button"
          onClick={() => onEdit(ingredient)}
        >
          {ingredient.name}
        </button>
        <span>
          {pack} {ingredient.buyUnit} · {pricePerUnit}/{unitNames[base] ?? base}
        </span>
        {showUsage && usageCount > 0 && (
          <a className="ingredient-usage" href="/resep">
            {ingredientCopy.usedBy(usageCount)}
          </a>
        )}
      </div>
      <div className="ingredient-price-control">
        {editing ? (
          <>
            <label className="sr-only" htmlFor={`price-${ingredient.id}`}>
              {ingredient.name}, {ingredientCopy.priceLabel}
            </label>
            <input
              ref={priceInput}
              id={`price-${ingredient.id}`}
              inputMode="numeric"
              value={price}
              aria-invalid={Boolean(error)}
              aria-describedby={
                error ? `price-error-${ingredient.id}` : undefined
              }
              onChange={(event) => {
                setPrice(event.target.value);
                setError('');
              }}
              onBlur={() => {
                if (!saving.current) void savePrice();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void savePrice();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelPrice();
                }
              }}
            />
            <button
              className="text-button"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void savePrice()}
            >
              {ingredientCopy.savePrice}
            </button>
            <button
              className="text-button"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={cancelPrice}
            >
              {ingredientCopy.cancel}
            </button>
          </>
        ) : (
          <>
            <span className="ingredient-price">
              {formatRupiah(ingredient.buyPrice)}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setPrice(String(ingredient.buyPrice));
                setEditing(true);
              }}
            >
              {ingredientCopy.editPrice}
            </button>
          </>
        )}
      </div>
      {error && (
        <p
          className="field-error ingredient-row-error"
          id={`price-error-${ingredient.id}`}
          role="alert"
        >
          {error}
        </p>
      )}
    </li>
  );
}
