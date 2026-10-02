'use client';

import { useEffect, useRef } from 'react';
import { useAnalyticsConsent } from './analytics-consent';

const calculatorPaths = {
  hpp: '/kalkulator-hpp',
  margin: '/margin',
  bep: '/bep',
  price: '/harga-jual',
  ojol: '/harga-ojol',
} as const;

type PublicEvent =
  | 'calculator_complete'
  | 'calculator_share'
  | 'calculator_signup_click';

export function usePublicAnalytics(calculator: keyof typeof calculatorPaths) {
  const consented = useAnalyticsConsent();
  const consent = useRef(consented);
  useEffect(() => {
    consent.current = consented;
  }, [consented]);
  return (event: PublicEvent) => {
    const path = window.location.pathname;
    const isUseCase =
      calculator === 'hpp' &&
      /^\/usaha\/hpp-(brownies|katering|frozen-food|rice-bowl|minuman|hampers)$/.test(
        path,
      );
    if (
      !consent.current ||
      (path !== calculatorPaths[calculator] && !isUseCase)
    )
      return;
    window.gtag?.('event', event, {
      calculator,
      page_location: new URL(path, window.location.origin).href,
      page_referrer: '',
      send_to: process.env.NEXT_PUBLIC_GA_ID,
    });
  };
}
