import { ThemeToggle } from '@takaran/ui/theme-toggle';
import { BackupPanel } from '../features/backup/components/backup-panel';
import { BackupReminder } from '../features/backup/components/backup-reminder';
import { ChannelList } from '../features/channels/components/channel-list';

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
      <BackupReminder />
      <BackupPanel />
      <ChannelList />
      <section className="settings-card">
        <h2>Penawaran pesanan</h2>
        <p>Buat rincian harga untuk pesanan dengan tambahan khusus.</p>
        <a className="button" href="/penawaran">
          Buka penawaran
        </a>
      </section>
      <section className="settings-card">
        <h2>Takaran Pro</h2>
        <p>Tambah resep dan saluran sesuai kebutuhan usahamu.</p>
        <a className="button" href="/beli">
          Lihat paket Pro
        </a>
      </section>
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
