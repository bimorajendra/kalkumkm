import { z } from 'zod';

export const ALLOWED_EVENTS = [
  'app_opened',
  'ingredient_first_added',
  'hpp_first_shown',
  'price_updated',
  'margin_alarm_shown',
  'share_image_created',
  'paywall_shown',
  'checkout_started',
  'checkout_paid',
  'license_activated',
  'backup_exported',
  'preorder_submitted',
] as const;

export const analyticsEventSchema = z.discriminatedUnion('event', [
  z
    .object({
      event: z.literal('app_opened'),
      props: z.object({ installed: z.boolean() }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('ingredient_first_added'),
      props: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('hpp_first_shown'),
      props: z
        .object({ seconds_bucket: z.enum(['lt_5', '5_30', 'gt_30']) })
        .strict(),
    })
    .strict(),
  z
    .object({ event: z.literal('price_updated'), props: z.object({}).strict() })
    .strict(),
  z
    .object({
      event: z.literal('margin_alarm_shown'),
      props: z.object({ count_bucket: z.enum(['1', '2_5', 'gt_5']) }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('share_image_created'),
      props: z.object({ format: z.enum(['story', 'square']) }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('paywall_shown'),
      props: z
        .object({ trigger: z.enum(['recipe_limit', 'channel_limit']) })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('checkout_started'),
      props: z.object({ plan: z.literal('pro') }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('checkout_paid'),
      props: z.object({ plan: z.literal('pro') }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('license_activated'),
      props: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('backup_exported'),
      props: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('preorder_submitted'),
      props: z.object({ source: z.string().max(64) }).strict(),
    })
    .strict(),
]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type AnalyticsEventName = AnalyticsEvent['event'];
export type AnalyticsProps<E extends AnalyticsEventName> = Extract<
  AnalyticsEvent,
  { event: E }
>['props'];
