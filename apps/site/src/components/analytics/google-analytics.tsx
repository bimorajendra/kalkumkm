'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { useAnalyticsConsent } from './analytics-consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics({ nonce }: { nonce?: string }) {
  const pathname = usePathname();
  const consented = useAnalyticsConsent();
  const initialized = useRef(false);
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (
      !measurementId ||
      !consented ||
      !pathname ||
      trackedPath.current === pathname
    )
      return;
    trackedPath.current = pathname;
    window.dataLayer ??= [];
    window.gtag ??= (...args) => window.dataLayer?.push(args);

    if (!initialized.current) {
      window.gtag('js', new Date());
      window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      window.gtag('config', measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      initialized.current = true;
    }

    window.gtag('set', {
      page_location: new URL(pathname, window.location.origin).href,
      page_title: document.title,
    });

    let referrerOrigin: string | undefined;
    try {
      referrerOrigin = document.referrer
        ? new URL(document.referrer).origin
        : undefined;
    } catch {
      referrerOrigin = undefined;
    }

    window.gtag('event', 'page_view', {
      page_path: pathname,
      page_location: new URL(pathname, window.location.origin).href,
      page_referrer: referrerOrigin,
      page_title: document.title,
      send_to: measurementId,
    });

    return () => {
      window.gtag?.('set', {
        page_location: new URL('/', window.location.origin).href,
        page_title: 'Takaran',
        page_referrer: '',
      });
    };
  }, [consented, pathname]);

  if (!measurementId || !consented) return null;

  return (
    <Script
      id="google-analytics-script"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
