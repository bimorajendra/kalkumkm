import Big from 'big.js';
import { CalcError } from './errors';

export function hppFromCosts(
  materialCost: Big,
  productionCost: Big,
  packagingPerPortion: Big,
  yieldPortions: number,
): Big {
  if (
    !Number.isSafeInteger(yieldPortions) ||
    yieldPortions <= 0 ||
    materialCost.lt(0) ||
    productionCost.lt(0) ||
    packagingPerPortion.lt(0)
  )
    throw new CalcError(
      'INVALID_INPUT',
      'Biaya dan hasil produksi tidak valid.',
    );
  return materialCost
    .plus(productionCost)
    .div(yieldPortions)
    .plus(packagingPerPortion);
}

export function breakEvenUnits(
  fixedCost: Big,
  variableCostPerUnit: Big,
  pricePerUnit: number,
  commissionBp: number,
): number {
  if (
    fixedCost.lt(0) ||
    variableCostPerUnit.lt(0) ||
    !Number.isSafeInteger(pricePerUnit) ||
    pricePerUnit <= 0 ||
    !Number.isSafeInteger(commissionBp) ||
    commissionBp < 0 ||
    commissionBp >= 10000
  )
    throw new CalcError('INVALID_INPUT', 'Masukan titik impas tidak valid.');
  const contribution = new Big(String(pricePerUnit))
    .times(10000 - commissionBp)
    .div(10000)
    .minus(variableCostPerUnit);
  if (contribution.lte(0))
    throw new CalcError(
      'INVALID_INPUT',
      'Harga jual belum menutup biaya variabel.',
    );
  const units = fixedCost.div(contribution).round(0, Big.roundUp).toNumber();
  if (!Number.isSafeInteger(units))
    throw new CalcError(
      'INVALID_INPUT',
      'Jumlah titik impas melebihi batas aman.',
    );
  return units;
}
