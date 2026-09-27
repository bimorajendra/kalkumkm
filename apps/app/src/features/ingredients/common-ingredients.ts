export interface CommonIngredient {
  name: string;
  buyUnit: 'kg' | 'l' | 'butir' | 'pcs';
}

export const commonIngredients: CommonIngredient[] = [
  { name: 'Tepung terigu', buyUnit: 'kg' },
  { name: 'Tepung beras', buyUnit: 'kg' },
  { name: 'Tepung tapioka', buyUnit: 'kg' },
  { name: 'Tepung maizena', buyUnit: 'kg' },
  { name: 'Tepung roti', buyUnit: 'kg' },
  { name: 'Gula pasir', buyUnit: 'kg' },
  { name: 'Gula halus', buyUnit: 'kg' },
  { name: 'Gula merah', buyUnit: 'kg' },
  { name: 'Telur ayam', buyUnit: 'butir' },
  { name: 'Margarin', buyUnit: 'kg' },
  { name: 'Mentega', buyUnit: 'kg' },
  { name: 'Minyak goreng', buyUnit: 'l' },
  { name: 'Susu cair', buyUnit: 'l' },
  { name: 'Susu bubuk', buyUnit: 'kg' },
  { name: 'Santan', buyUnit: 'l' },
  { name: 'Keju cheddar', buyUnit: 'kg' },
  { name: 'Keju mozzarella', buyUnit: 'kg' },
  { name: 'Cokelat batang', buyUnit: 'kg' },
  { name: 'Cokelat bubuk', buyUnit: 'kg' },
  { name: 'Meses cokelat', buyUnit: 'kg' },
  { name: 'Vanili', buyUnit: 'pcs' },
  { name: 'Ragi instan', buyUnit: 'pcs' },
  { name: 'Baking powder', buyUnit: 'pcs' },
  { name: 'Soda kue', buyUnit: 'pcs' },
  { name: 'Garam', buyUnit: 'kg' },
  { name: 'Bawang merah', buyUnit: 'kg' },
  { name: 'Bawang putih', buyUnit: 'kg' },
  { name: 'Cabai merah', buyUnit: 'kg' },
  { name: 'Ayam', buyUnit: 'kg' },
  { name: 'Daging sapi', buyUnit: 'kg' },
];

export function findCommonIngredient(name: string) {
  return commonIngredients.find(
    (item) =>
      item.name.toLocaleLowerCase('id-ID') ===
      name.trim().toLocaleLowerCase('id-ID'),
  );
}
