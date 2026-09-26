import Big from 'big.js';
import { CalcError } from './errors';
import type { Ingredient } from './types';
import { toBaseUnits } from './units';

export function unitPrice(ingredient: Ingredient): Big {
  if (!Number.isSafeInteger(ingredient.buyPrice) || ingredient.buyPrice < 0) {
    throw new CalcError(
      'INVALID_INPUT',
      'Harga beli harus berupa rupiah bulat dan tidak negatif.',
      { ingredientId: ingredient.id },
    );
  }
  const pack = toBaseUnits(
    ingredient.packSize,
    ingredient.buyUnit,
    ingredient.customUnits,
  );
  if (pack.quantity.lte(0))
    throw new CalcError('INVALID_YIELD', 'Isi kemasan harus lebih dari 0.', {
      ingredientId: ingredient.id,
    });
  return new Big(String(ingredient.buyPrice)).div(pack.quantity);
}
