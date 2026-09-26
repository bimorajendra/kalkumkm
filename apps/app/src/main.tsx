import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { db } from './db/db';
import { track } from './lib/analytics';
import { initializePersistence } from './lib/persist';
import { UpdatePrompt } from './pwa/update-prompt';
import { AktivasiRoute } from './routes/aktivasi';
import { BahanRoute } from './routes/bahan';
import { BeliRoute } from './routes/beli';
import { HitungRoute } from './routes/hitung';
import { LainnyaRoute } from './routes/lainnya';
import { ResepRoute } from './routes/resep';
import { ResepDetailRoute } from './routes/resep-detail';
import { RootLayout } from './routes/root-layout';
import './styles.css';

function App() {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [databaseChanged, setDatabaseChanged] = useState(false);

  useEffect(() => {
    let active = true;
    db.open()
      .then(async () => {
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

  if (storageError) {
    return (
      <main className="error-state">
        <span className="eyebrow">TAKARAN</span>
        <h1>Penyimpanan tidak tersedia di browser ini</h1>
        <p>
          Coba buka Takaran di browser biasa agar data resep tersimpan di
          perangkatmu.
        </p>
      </main>
    );
  }
  if (!ready)
    return (
      <main aria-live="polite" className="loading-state">
        Menyiapkan Takaranâ€¦
      </main>
    );

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HitungRoute />} />
          <Route path="/beli" element={<BeliRoute />} />
          <Route path="/aktivasi" element={<AktivasiRoute />} />
          <Route path="/bahan" element={<BahanRoute />} />
          <Route path="/resep" element={<ResepRoute />} />
          <Route path="/resep/:id" element={<ResepDetailRoute />} />
          <Route path="/lainnya" element={<LainnyaRoute />} />
          <Route path="*" element={<HitungRoute />} />
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
