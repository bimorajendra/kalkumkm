import type { AnalyticsEventName, AnalyticsProps } from '@takaran/schema';
import { ALLOWED_EVENTS, analyticsEventSchema } from '@takaran/schema';

interface UmamiWindow extends Window {
  umami?: {
    track: (
      event: string,
      props?: Record<string, string | number | boolean>,
    ) => void;
  };
}

export function track<E extends AnalyticsEventName>(
  event: E,
  props: AnalyticsProps<E>,
): void {
  try {
    if (
      !(ALLOWED_EVENTS as readonly string[]).includes(event) ||
      !analyticsEventSchema.safeParse({ event, props }).success
    ) {
      if (import.meta.env.DEV)
        console.error('Event analitik tidak diizinkan:', event);
      return;
    }
    if (typeof window !== 'undefined')
      (window as UmamiWindow).umami?.track(
        event,
        props as Record<string, string | number | boolean>,
      );
  } catch {
    // Analitik gagal tanpa mengganggu daftar tunggu.
  }
}
