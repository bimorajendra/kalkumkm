import Big from 'big.js';
import { CalcError } from './errors';

export function profitPerPortion(
  price: number,
  hpp: Big,
  commissionBp: number,
): Big {
  if (
    !Number.isSafeInteger(price) ||
    price < 0 ||
    !Number.isInteger(commissionBp) ||
    commissionBp < 0 ||
    commissionBp >= 10000
  ) {
    throw new CalcError('INVALID_INPUT', 'Harga atau komisi tidak valid.');
  }
  return new Big(String(price))
    .times(10000 - commissionBp)
    .div(10000)
    .minus(hpp);
}

export function profitPerHour(
  price: number,
  hpp: Big,
  commissionBp: number,
  portions: number,
  laborMinutes: number,
): Big | null {
  if (
    !Number.isSafeInteger(price) ||
    price < 0 ||
    !Number.isInteger(commissionBp) ||
    commissionBp < 0 ||
    commissionBp >= 10000 ||
    !Number.isSafeInteger(portions) ||
    portions < 0 ||
    !Number.isSafeInteger(laborMinutes) ||
    laborMinutes < 0
  ) {
    throw new CalcError(
      'INVALID_INPUT',
      'Harga, komisi, porsi, atau waktu tenaga tidak valid.',
    );
  }
  if (laborMinutes === 0) return null;
  const totalProfit = profitPerPortion(price, hpp, commissionBp).times(
    portions,
  );
  return totalProfit.times(60).div(laborMinutes);
}
