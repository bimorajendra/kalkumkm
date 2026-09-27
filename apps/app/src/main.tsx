import { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { db } from './db/db';
import { ensureDefaultChannel } from './features/channels/ensure-default';
import { track } from './lib/analytics';
import { initializePersistence } from './lib/persist';
import { UpdatePrompt } from './pwa/update-prompt';
import { BahanRoute } from './routes/bahan';
import { HitungRoute } from './routes/hitung';
import { LainnyaRoute } from './routes/lainnya';
import { ResepRoute } from './routes/resep';
import { ResepDetailRoute } from './routes/resep-detail';
import { RootLayout } from './routes/root-layout';
import './styles.css';

const AktivasiRoute = lazy(() => import('./routes/aktivasi'));
const BeliRoute = lazy(() => import('./routes/beli'));
const PenawaranRoute = lazy(() => import('./routes/penawaran'));
const BagikanRoute = lazy(() => import('./routes/bagikan'));
const routeLoading = (
  <main className="page">
    <output aria-live="polite">Membuka halaman…</output>
  </main>
);

function App() {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [databaseChanged, setDatabaseChanged] = useState(false);

  useEffect(() => {
    let active = true;
    db.open()
      .then(async () => {
        await ensureDefaultChannel();
        await initializePersistence();
        if (!active) return;
        setReady(true);
        track('app_opened', {
          installed:
            window.matchMedia('(display-mode: standalone)').matches ||
            Boolean(
              (navigator as Navigator & { standalone?: boolean }).standalone,
            ),
        });
      })
      .catch(() => {
        if (active) setStorageError(true);
      });
    const onVersionChange = () => setDatabaseChanged(true);
    window.addEventListener('takaran:database-versionchange', onVersionChange);
    return () => {
      active = false;
      window.removeEventListener(
        'takaran:database-versionchange',
        onVersionChange,
      );
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {storageError ? (
            <Route
              path="*"
              element={
                <main className="page">
                  <section className="error-state">
                    <span className="eyebrow">TAKARAN</span>
                    <h1>Penyimpanan tidak tersedia di browser ini</h1>
                    <p>
                      Coba buka Takaran di browser biasa agar data resep
                      tersimpan di perangkatmu.
                    </p>
                  </section>
                </main>
              }
            />
          ) : !ready ? (
            <Route
              path="*"
              element={
                <main aria-live="polite" className="page loading-state">
                  Menyiapkan Takaran…
                </main>
              }
            />
          ) : (
            <>
              <Route path="/" element={<HitungRoute />} />
              <Route
                path="/beli"
                element={
                  <Suspense fallback={routeLoading}>
                    <BeliRoute />
                  </Suspense>
                }
              />
              <Route
                path="/aktivasi"
                element={
                  <Suspense fallback={routeLoading}>
                    <AktivasiRoute />
                  </Suspense>
                }
              />
              <Route path="/bahan" element={<BahanRoute />} />
              <Route path="/resep" element={<ResepRoute />} />
              <Route path="/resep/:id" element={<ResepDetailRoute />} />
              <Route path="/lainnya" element={<LainnyaRoute />} />
              <Route
                path="/penawaran"
                element={
                  <Suspense fallback={routeLoading}>
                    <PenawaranRoute />
                  </Suspense>
                }
              />
              <Route
                path="/bagikan"
                element={
                  <Suspense fallback={routeLoading}>
                    <BagikanRoute />
                  </Suspense>
                }
              />
              <Route path="*" element={<HitungRoute />} />
            </>
          )}
        </Route>
      </Routes>
      {databaseChanged ? (
        <output className="notice">
          <span>
            Data diperbarui di tab lain. Muat ulang untuk melanjutkan.
          </span>
          <button onClick={() => window.location.reload()} type="button">
            Muat ulang
          </button>
        </output>
      ) : null}
      <UpdatePrompt />
    </BrowserRouter>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Elemen aplikasi tidak ditemukan.');
createRoot(root).render(<App />);
