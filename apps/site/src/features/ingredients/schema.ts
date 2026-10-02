import * as z from 'zod';

const baseUnits = ['g', 'ml', 'pcs'] as const;
const standardUnits = ['kg', 'g', 'l', 'ml', 'butir', 'pcs'] as const;
const moneySchema = z
  .string()
  .regex(/^\d+$/, 'Masukkan harga dalam rupiah bulat.')
  .transform(Number)
  .pipe(
    z
      .number()
      .int()
      .min(1, 'Harga minimal Rp 1.')
      .max(100_000_000, 'Harga maksimal Rp 100.000.000.'),
  );
const packSizeSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,3})?$/, 'Isi kemasan maksimal 3 angka desimal.')
  .transform(Number)
  .pipe(z.number().finite().positive('Isi kemasan harus lebih dari 0.'));

export const ingredientFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Nama bahan wajib diisi.')
      .max(60, 'Nama bahan maksimal 60 karakter.'),
    buyPrice: moneySchema,
    packSize: packSizeSchema,
    buyUnit: z.string().trim().min(1, 'Pilih satuan beli.'),
    customName: z.string().trim().max(24, 'Nama satuan maksimal 24 karakter.'),
    customQty: z.string(),
    customBase: z.enum(baseUnits),
  })
  .superRefine((value, context) => {
    if (standardUnits.includes(value.buyUnit as (typeof standardUnits)[number]))
      return;
    if (value.buyUnit === 'bungkus' || value.buyUnit === 'custom') {
      const unitName =
        value.buyUnit === 'bungkus' ? 'bungkus' : value.customName;
      if (!unitName) {
        context.addIssue({
          code: 'custom',
          path: ['customName'],
          message: 'Nama satuan wajib diisi.',
        });
      }
      if (
        !/^\d+(?:\.\d{1,3})?$/.test(value.customQty) ||
        Number(value.customQty) <= 0
      ) {
        context.addIssue({
          code: 'custom',
          path: ['customQty'],
          message: 'Isi satuan harus lebih dari 0, maksimal 3 angka desimal.',
        });
      }
      if (unitName && (standardUnits as readonly string[]).includes(unitName)) {
        context.addIssue({
          code: 'custom',
          path: ['customName'],
          message: 'Pakai nama satuan yang belum ada.',
        });
      }
      return;
    }
    context.addIssue({
      code: 'custom',
      path: ['buyUnit'],
      message: 'Pilih satuan yang tersedia.',
    });
  });

export type IngredientFormValues = z.input<typeof ingredientFormSchema>;

export function ingredientInputFromForm(
  value: z.output<typeof ingredientFormSchema>,
) {
  const isCustom = value.buyUnit === 'bungkus' || value.buyUnit === 'custom';
  const buyUnit = value.buyUnit === 'custom' ? value.customName : value.buyUnit;
  return {
    name: value.name,
    buyPrice: value.buyPrice,
    packSize: value.packSize,
    buyUnit,
    customUnits: isCustom
      ? [
          {
            name: buyUnit,
            qty: Number(value.customQty),
            base: value.customBase,
          },
        ]
      : [],
  };
}
