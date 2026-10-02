import * as z from 'zod';
import { quoteOptionSchema } from '@/domain/quotes';

export type { QuoteOptionInput } from '@/domain/quotes';

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
  .object({ name: z.string(), priceAdd: rupiahInput, costAdd: rupiahInput })
  .pipe(quoteOptionSchema);
