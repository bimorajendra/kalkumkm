import Big from 'big.js';
import { CalcError } from './errors';

export function suggestPrice(
  hpp: Big,
  marginBp: number,
  commissionBp: number,
  roundingStep: number,
): number {
  if (
    !Number.isInteger(marginBp) ||
    !Number.isInteger(commissionBp) ||
    marginBp < 0 ||
    commissionBp < 0 ||
    marginBp + commissionBp >= 10000
  ) {
    throw new CalcError(
      'MARGIN_TOO_HIGH',
      'Target margin dan komisi harus berjumlah kurang dari 100%.',
      { marginBp, commissionBp },
    );
  }
  if (!Number.isSafeInteger(roundingStep) || roundingStep <= 0)
    throw new CalcError(
      'INVALID_ROUNDING_STEP',
      'Pembulatan harga harus lebih dari 0.',
      { roundingStep },
    );
  if (hpp.lt(0))
    throw new CalcError('INVALID_INPUT', 'HPP tidak boleh negatif.');
  const denominator = new Big(10000 - marginBp - commissionBp).div(10000);
  const rawPrice = hpp.div(denominator);
  const rounded = rawPrice
    .div(roundingStep)
    .round(0, Big.roundUp)
    .times(roundingStep);
  const result = rounded.toNumber();
  if (!Number.isSafeInteger(result))
    throw new CalcError(
      'INVALID_INPUT',
      'Harga saran melebihi batas rupiah yang aman.',
    );
  return result;
}

export function actualMarginBp(
  price: number,
  hpp: Big,
  commissionBp: number,
): number {
  if (
    !Number.isSafeInteger(price) ||
    price <= 0 ||
    !Number.isInteger(commissionBp) ||
    commissionBp < 0 ||
    commissionBp >= 10000
  ) {
    throw new CalcError('INVALID_INPUT', 'Harga dan komisi tidak valid.', {
      price,
      commissionBp,
    });
  }
  const netRevenue = new Big(String(price))
    .times(10000 - commissionBp)
    .div(10000);
  return netRevenue
    .minus(hpp)
    .div(price)
    .times(10000)
    .round(0, Big.roundHalfUp)
    .toNumber();
}

export function markupBp(price: number, hpp: Big): number {
  if (!Number.isSafeInteger(price) || price < 0 || hpp.lte(0))
    throw new CalcError('INVALID_INPUT', 'Harga dan HPP tidak valid.', {
      price,
    });
  return new Big(String(price))
    .minus(hpp)
    .div(hpp)
    .times(10000)
    .round(0, Big.roundHalfUp)
    .toNumber();
}
