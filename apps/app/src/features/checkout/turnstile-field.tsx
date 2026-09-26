import { useEffect, useRef } from 'react';

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      size?: 'normal' | 'compact';
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
    },
  ) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileField({
  siteKey,
  onToken,
  onError,
  resetSignal,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onError: () => void;
  resetSignal: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) {
      onError();
      return;
    }
    let disposed = false;
    const renderWidget = () => {
      if (disposed || !containerRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: window.innerWidth < 360 ? 'compact' : 'normal',
        callback: onToken,
        'error-callback': () => {
          onToken('');
          onError();
        },
        'expired-callback': () => onToken(''),
      });
    };
    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (window.turnstile) renderWidget();
    else if (script)
      script.addEventListener('load', renderWidget, { once: true });
    else {
      script = document.createElement('script');
      script.id = scriptId;
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderWidget, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.append(script);
    }
    return () => {
      disposed = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
    };
  }, [onError, onToken, siteKey]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current)
      window.turnstile?.reset(widgetId.current);
  }, [resetSignal]);

  return <div ref={containerRef} />;
}
