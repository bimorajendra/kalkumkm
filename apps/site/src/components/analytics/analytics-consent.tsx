'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useState } from 'react';

const CONSENT_KEY = 'takaran-analytics-consent-v2';
const SETTINGS_EVENT = 'takaran:analytics-settings';

const AnalyticsConsentContext = createContext(false);

export function useAnalyticsConsent() {
  return useContext(AnalyticsConsentContext);
}

export function AnalyticsConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState<'granted' | 'denied' | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const isMarketingPage =
      path === '/' ||
      path === '/kebijakan-privasi' ||
      [
        '/artikel',
        '/bep',
        '/cara-hitung',
        '/fitur',
        '/harga',
        '/harga-jual',
        '/harga-ojol',
        '/kalkulator-hpp',
        '/margin',
      ].some((route) => path === route || path.startsWith(`${route}/`)) ||
      path.startsWith('/usaha/');
    let hasSavedChoice = false;
    try {
      const saved =
        localStorage.getItem(CONSENT_KEY) ??
        (localStorage.getItem('takaran-analytics-consent-v1') === 'denied'
          ? 'denied'
          : null);
      if (saved === 'granted' || saved === 'denied') {
        hasSavedChoice = true;
        setConsent(saved);
      } else if (saved !== null) {
        localStorage.removeItem(CONSENT_KEY);
      }
    } catch {
      // Pilihan baru akan berlaku selama halaman ini terbuka.
    }
    setSettingsOpen(isMarketingPage && !hasSavedChoice);
    setReady(true);

    const openSettings = () => setSettingsOpen(true);
    window.addEventListener(SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(SETTINGS_EVENT, openSettings);
  }, []);

  function chooseConsent(choice: 'granted' | 'denied') {
    const analyticsWindow = window as typeof window & {
      gtag?: (...args: unknown[]) => void;
    };
    analyticsWindow.gtag?.('consent', 'update', {
      analytics_storage: choice,
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Pilihan tetap berlaku selama halaman ini terbuka.
    }
    setConsent(choice);
    setSettingsOpen(false);
  }

  const enabled = process.env.NEXT_PUBLIC_GA_ID && consent === 'granted';

  return (
    <AnalyticsConsentContext.Provider value={Boolean(enabled)}>
      {children}
      {process.env.NEXT_PUBLIC_GA_ID && ready && settingsOpen ? (
        <section
          aria-labelledby="analytics-consent-title"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto grid max-h-[calc(100dvh-24px)] w-[min(720px,calc(100%-24px))] gap-3 overflow-y-auto rounded-2xl border border-line bg-surface p-4 shadow-lg sm:p-5"
        >
          <div className="grid gap-2">
            <h2 id="analytics-consent-title" className="font-semibold">
              Pengukuran kunjungan
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Takaran memakai Google Analytics untuk menghitung kunjungan dan
              penggunaan kalkulator publik, tanpa mengirim isian atau hasil
              hitungan. Pilihanmu tidak memengaruhi fitur kalkulator.
            </p>
            <Link
              href="/kebijakan-privasi"
              className="w-fit text-sm text-link underline underline-offset-4"
            >
              Baca kebijakan privasi
            </Link>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => chooseConsent('denied')}
              className="min-h-11 rounded-lg border border-input px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Tolak analitik
            </button>
            <button
              type="button"
              onClick={() => chooseConsent('granted')}
              className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Izinkan analitik
            </button>
          </div>
        </section>
      ) : null}
    </AnalyticsConsentContext.Provider>
  );
}

export function AnalyticsConsentSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(SETTINGS_EVENT))}
      className="min-h-11 text-left text-link underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Atur pilihan analitik
    </button>
  );
}
