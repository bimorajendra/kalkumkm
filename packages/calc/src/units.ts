import Big from 'big.js';
import { CalcError } from './errors';
import type { BaseUnit, CustomUnit, Unit } from './types';

export interface BaseQuantity {
  quantity: Big;
  unit: BaseUnit;
}
const fixedUnits: Record<string, { factor: number; base: BaseUnit }> = {
  g: { factor: 1, base: 'g' },
  kg: { factor: 1000, base: 'g' },
  ml: { factor: 1, base: 'ml' },
  l: { factor: 1000, base: 'ml' },
  butir: { factor: 1, base: 'pcs' },
  pcs: { factor: 1, base: 'pcs' },
};

export function unitFactor(
  unit: Unit,
  customUnits: readonly CustomUnit[] = [],
): { factor: Big; base: BaseUnit } {
  const known = Object.hasOwn(fixedUnits, unit) ? fixedUnits[unit] : undefined;
  if (known) return { factor: new Big(known.factor), base: known.base };
  const custom = customUnits.find((entry) => entry.name === unit);
  if (!custom)
    throw new CalcError(
      'UNIT_UNDEFINED',
      `Satuan ${unit} belum didefinisikan.`,
      { unit },
    );
  if (!Number.isFinite(custom.qty) || custom.qty <= 0) {
    throw new CalcError(
      'INVALID_INPUT',
      `Konversi satuan ${unit} harus lebih dari 0.`,
      { unit },
    );
  }
  return { factor: new Big(String(custom.qty)), base: custom.base };
}

export function toBaseUnits(
  quantity: number | string | Big,
  unit: Unit,
  customUnits: readonly CustomUnit[] = [],
): BaseQuantity {
  let amount: Big;
  try {
    amount = new Big(quantity);
  } catch {
    throw new CalcError(
      'INVALID_INPUT',
      'Takaran harus berupa angka yang valid.',
      { quantity: String(quantity) },
    );
  }
  if (amount.lt(0))
    throw new CalcError('INVALID_INPUT', 'Takaran tidak boleh negatif.');
  const conversion = unitFactor(unit, customUnits);
  return { quantity: amount.times(conversion.factor), unit: conversion.base };
}
