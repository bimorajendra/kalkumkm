import * as z from 'zod';

export const channelInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama saluran wajib diisi.')
    .max(30, 'Nama maksimal 30 karakter.'),
  kind: z.enum(['commission', 'discount']),
  rateBp: z
    .number()
    .int()
    .min(0, 'Nilai tidak boleh negatif.')
    .max(9000, 'Nilai maksimal 90%.'),
});

const percentToBasisPoints = z
  .string()
  .regex(/^\d{1,2}(?:\.\d{1,2})?$/, 'Masukkan persen dari 0 sampai 90.')
  .transform((value) => {
    const [whole = '0', fraction = ''] = value.split('.');
    return Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
  })
  .pipe(z.number().int().min(0).max(9000));

export const channelFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama saluran wajib diisi.')
    .max(30, 'Nama maksimal 30 karakter.'),
  kind: z.enum(['commission', 'discount']),
  rate: percentToBasisPoints,
});

export type ChannelFormValues = z.input<typeof channelFormSchema>;
