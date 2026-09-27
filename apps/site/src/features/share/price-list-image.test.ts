import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  PriceListImage,
  type PriceListMenu,
  priceListLayoutFits,
} from './price-list-image';

const menus: PriceListMenu[] = [
  { id: 'brownies', name: 'Brownies', price: 25_000 },
];

describe('priceListLayoutFits', () => {
  it('keeps twelve square menu rows readable and asks to reduce larger lists', () => {
    expect(priceListLayoutFits(12, 'square')).toBe(true);
    expect(priceListLayoutFits(14, 'square')).toBe(true);
    expect(priceListLayoutFits(15, 'square')).toBe(false);
  });

  it('fits a longer list in a story image', () => {
    expect(priceListLayoutFits(12, 'story')).toBe(true);
    expect(priceListLayoutFits(18, 'story')).toBe(true);
  });

  it('keeps the free footer and internal costs out of shared image copy', () => {
    const freeImage = renderToStaticMarkup(
      createElement(PriceListImage, {
        businessName: 'Usaha Bimo',
        menus,
        format: 'story',
        isPro: false,
        domain: 'takaran.id',
      }),
    );
    const proImage = renderToStaticMarkup(
      createElement(PriceListImage, {
        businessName: 'Usaha Bimo',
        menus,
        format: 'square',
        isPro: true,
        domain: 'takaran.id',
      }),
    );

    expect(freeImage).toContain('dihitung dengan Takaran');
    expect(freeImage).toContain('0 0 1080 1920');
    expect(proImage).not.toContain('dihitung dengan Takaran');
    expect(proImage).toContain('0 0 1080 1080');
    for (const image of [freeImage, proImage]) {
      expect(image).not.toMatch(/HPP|margin|untung/i);
    }
  });
});
