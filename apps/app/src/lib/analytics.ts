import {
  ALLOWED_EVENTS,
  type AnalyticsEventName,
  type AnalyticsProps,
  analyticsEventSchema,
} from '@takaran/schema';

declare global {
  interface Window {
    umami?: {
      track: (
        event: string,
        props?: Record<string, string | number | boolean>,
      ) => void;
    };
  }
}

export function track<E extends AnalyticsEventName>(
  event: E,
  props: AnalyticsProps<E>,
): void {
  if (!ALLOWED_EVENTS.includes(event)) return;
  if (!analyticsEventSchema.safeParse({ event, props }).success) return;
  try {
    window.umami?.track(
      event,
      props as Record<string, string | number | boolean>,
    );
  } catch {
    // Analytics must never interrupt local work.
  }
}
