import { ThemeToggle } from '@takaran/ui/theme-toggle';

export function LainnyaRoute() {
  const agent = navigator.userAgent;
  const isIosSafari =
    /iphone|ipad|ipod/i.test(agent) &&
    /safari/i.test(agent) &&
    !/(crios|fxios|edgios)/i.test(agent);
  const showIosInstructions =
    isIosSafari && !window.matchMedia('(display-mode: standalone)').matches;

  return (
    <main className="page settings-page">
      <h1>Pengaturan</h1>
      <section className="settings-card">
        <h2>Tampilan</h2>
        <p>Pilih tema yang nyaman untuk dipakai.</p>
        <ThemeToggle />
      </section>
      <section className="settings-card">
        <h2>Takaran</h2>
        <p>Aplikasi lokal untuk menghitung biaya resep.</p>
        {showIosInstructions ? (
          <p className="install-help">
            Di Safari, tekan Bagikan lalu Tambahkan ke Layar Utama.
          </p>
        ) : null}
        <p className="version">Versi 0.0.1</p>
      </section>
    </main>
  );
}
