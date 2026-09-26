import { z } from 'zod';

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    whatsapp: z.string().trim().min(8).max(32),
    businessName: z.string().trim().min(1).max(120),
    consent: z.literal(true),
    turnstileToken: z.string().min(1).max(2048),
  })
  .strict();

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const checkoutResponseSchema = z.object({
  data: z.object({
    orderId: z.string().uuid(),
    paymentUrl: z
      .string()
      .url()
      .refine((value) => {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password;
      }),
    claimToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    amountIdr: z.number().int().positive(),
  }),
});
