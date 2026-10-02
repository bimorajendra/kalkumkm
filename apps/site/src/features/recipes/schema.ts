import * as z from 'zod';

const rupiah = z
  .string()
  .regex(/^\d+$/, 'Masukkan rupiah bulat.')
  .transform(Number)
  .pipe(z.number().int().safe().min(0, 'Nilai tidak boleh negatif.'));
const positiveDecimal = z
  .string()
  .regex(/^\d+(?:\.\d{1,3})?$/, 'Masukkan angka sampai 3 desimal.')
  .transform(Number)
  .pipe(z.number().finite().positive('Takaran harus lebih dari 0.'));

export const recipeFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Nama resep wajib diisi.')
      .max(60, 'Nama maksimal 60 karakter.'),
    yieldPortions: z
      .string()
      .regex(/^\d+$/, 'Hasil harus bilangan bulat.')
      .transform(Number)
      .pipe(
        z
          .number()
          .int()
          .min(1, 'Hasil minimal 1 porsi.')
          .max(10_000, 'Hasil maksimal 10.000 porsi.'),
      ),
    packagingPerPortion: rupiah,
    energyPerBatch: rupiah,
    laborMinutesPerBatch: rupiah,
    laborRatePerHour: z
      .union([z.literal(''), rupiah])
      .transform((value) => (value === '' ? null : value)),
    isSubRecipe: z.boolean(),
    subRecipeYieldQty: positiveDecimal,
    subRecipeYieldUnit: z.string().min(1, 'Pilih satuan hasil.'),
    items: z.array(
      z.object({
        refType: z.enum(['ingredient', 'recipe']),
        refId: z.string().min(1),
        quantity: positiveDecimal,
        unit: z.string().min(1, 'Pilih satuan.'),
      }),
    ),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      const key = `${item.refType}:${item.refId}`;
      if (seen.has(key)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'refId'],
          message: 'Bahan atau sub-resep yang sama cukup ditambahkan sekali.',
        });
      }
      seen.add(key);
    });
  });

export type RecipeFormValues = z.input<typeof recipeFormSchema>;
export type ParsedRecipeFormValues = z.output<typeof recipeFormSchema>;
