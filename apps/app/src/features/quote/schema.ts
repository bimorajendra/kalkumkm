import { z } from 'zod';

export const quoteOptionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama opsi perlu diisi.')
    .max(40, 'Nama opsi maksimal 40 karakter.'),
  priceAdd: z
    .number()
    .int('Tambahan harga harus rupiah bulat.')
    .safe('Tambahan harga terlalu besar.')
    .min(0, 'Tambahan harga tidak boleh kurang dari Rp 0.'),
  costAdd: z
    .number()
    .int('Tambahan biaya harus rupiah bulat.')
    .safe('Tambahan biaya terlalu besar.')
    .min(0, 'Tambahan biaya tidak boleh kurang dari Rp 0.'),
});

export type QuoteOptionInput = z.infer<typeof quoteOptionSchema>;

export interface QuoteOptionFormValues {
  name: string;
  priceAdd: string;
  costAdd: string;
}

const rupiahInput = z
  .string()
  .regex(/^\d+$/, 'Isi dengan rupiah bulat, tanpa tanda titik.')
  .transform(Number)
  .refine(Number.isSafeInteger, 'Nilainya terlalu besar.');

export const quoteOptionFormSchema = z
  .object({
    name: z.string(),
    priceAdd: rupiahInput,
    costAdd: rupiahInput,
  })
  .pipe(quoteOptionSchema);
