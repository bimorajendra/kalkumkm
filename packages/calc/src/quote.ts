import Big from 'big.js';
import { CalcError } from './errors';
import { actualMarginBp, suggestPrice } from './pricing';
import type { Channel, ChannelPrice, QuoteOption } from './types';

export function priceForChannel(
  hpp: Big,
  marginBp: number,
  retailPrice: number | null,
  channel: Channel,
  roundingStep: number,
): ChannelPrice {
  let price: number;
  if (channel.kind === 'commission') {
    price = suggestPrice(hpp, marginBp, channel.rateBp, roundingStep);
  } else {
    if (
      retailPrice === null ||
      !Number.isSafeInteger(retailPrice) ||
      retailPrice < 0
    ) {
      throw new CalcError(
        'INVALID_INPUT',
        'Harga jual langsung diperlukan untuk saluran diskon.',
      );
    }
    if (
      !Number.isInteger(channel.rateBp) ||
      channel.rateBp < 0 ||
      channel.rateBp >= 10000
    ) {
      throw new CalcError(
        'INVALID_INPUT',
        'Diskon harus di antara 0% dan kurang dari 100%.',
        { rateBp: channel.rateBp },
      );
    }
    if (!Number.isSafeInteger(roundingStep) || roundingStep <= 0)
      throw new CalcError(
        'INVALID_ROUNDING_STEP',
        'Pembulatan harga harus lebih dari 0.',
      );
    const discounted = new Big(String(retailPrice))
      .times(10000 - channel.rateBp)
      .div(10000);
    price = discounted
      .div(roundingStep)
      .round(0, Big.roundDown)
      .times(roundingStep)
      .toNumber();
  }
  const marginBpResult = actualMarginBp(
    price,
    hpp,
    channel.kind === 'commission' ? channel.rateBp : 0,
  );
  return { price, marginBp: marginBpResult };
}

export function quoteTotals(
  hpp: Big,
  pricePerPortion: number,
  portions: number,
  options: QuoteOption[],
): { price: number; cost: Big; profit: Big } {
  if (
    !Number.isSafeInteger(pricePerPortion) ||
    pricePerPortion < 0 ||
    !Number.isSafeInteger(portions) ||
    portions <= 0
  ) {
    throw new CalcError(
      'INVALID_INPUT',
      'Harga per porsi dan jumlah porsi harus bilangan bulat non-negatif.',
    );
  }
  let price = new Big(String(pricePerPortion)).times(portions);
  let cost = hpp.times(portions);
  for (const option of options) {
    if (
      !Number.isSafeInteger(option.priceAdd) ||
      option.priceAdd < 0 ||
      !Number.isSafeInteger(option.costAdd) ||
      option.costAdd < 0
    ) {
      throw new CalcError(
        'INVALID_INPUT',
        'Tambahan harga dan biaya harus rupiah bulat non-negatif.',
      );
    }
    price = price.plus(option.priceAdd);
    cost = cost.plus(option.costAdd);
  }
  const roundedPrice = price.toNumber();
  if (!Number.isSafeInteger(roundedPrice))
    throw new CalcError(
      'INVALID_INPUT',
      'Total harga melebihi batas rupiah yang aman.',
    );
  return { price: roundedPrice, cost, profit: price.minus(cost) };
}
