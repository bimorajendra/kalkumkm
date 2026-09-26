import { z } from 'zod';

export const preorderSchema = z
  .object({
    businessName: z.string().trim().min(1).max(120),
    whatsapp: z.string().trim().min(8).max(32),
    productType: z.enum(['kue', 'frozen', 'katering', 'lainnya']),
    consent: z.literal(true),
    turnstileToken: z.string().min(1).max(2048),
    source: z
      .string()
      .trim()
      .max(64)
      .regex(/^[\p{L}\p{N}_-]*$/u)
      .optional(),
  })
  .strict();

export type PreorderInput = z.infer<typeof preorderSchema>;
