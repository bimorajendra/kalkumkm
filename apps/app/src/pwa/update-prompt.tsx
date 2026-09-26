import { useEffect, useState } from 'react';

export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    );
    navigator.serviceWorker
      .register('/sw.js')
      .then((value) => {
        if (value.waiting && navigator.serviceWorker.controller)
          setNeedRefresh(true);
        value.addEventListener('updatefound', () => {
          const installing = value.installing;
          installing?.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setNeedRefresh(true);
            }
          });
        });
        value.update().catch(() => undefined);
      })
      .catch(() => undefined);
    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      );
    };
  }, []);
  if (!needRefresh) return null;
  return (
    <output className="notice">
      <span>Versi baru tersedia. Muat ulang.</span>
      <button
        onClick={() =>
          navigator.serviceWorker.getRegistration().then((registration) => {
            registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
          })
        }
        type="button"
      >
        Muat ulang
      </button>
    </output>
  );
}
