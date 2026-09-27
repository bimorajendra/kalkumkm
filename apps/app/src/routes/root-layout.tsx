import { ThemeToggle } from '@takaran/ui/theme-toggle';
import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { clearInstallPrompt, getInstallPrompt } from '../pwa/install-prompt';

const links = [
  { to: '/', label: 'Hitung' },
  { to: '/bahan', label: 'Bahan' },
  { to: '/resep', label: 'Resep' },
];
const desktopLinks = [...links, { to: '/penawaran', label: 'Penawaran' }];
const tabInitials: Record<string, string> = {
  Hitung: 'H',
  Bahan: 'B',
  Resep: 'R',
  Lainnya: 'L',
};

export function RootLayout() {
  return (
    <>
      <header className="app-header">
        <NavLink className="brand" to="/" aria-label="Takaran, ke Hitung">
          <span className="brand-mark" aria-hidden="true">
            t
          </span>
          <span>Takaran</span>
        </NavLink>
        <InstallButton />
        <nav aria-label="Navigasi utama" className="desktop-nav">
          {desktopLinks.map((link) => (
            <NavLink end={link.to === '/'} key={link.to} to={link.to}>
              {link.label === 'Hitung' ? 'Kalkulator' : link.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </nav>
      </header>
      <Outlet />
      <nav aria-label="Navigasi bawah" className="mobile-nav">
        {[...links, { to: '/lainnya', label: 'Lainnya' }].map((link) => (
          <NavLink end={link.to === '/'} key={link.to} to={link.to}>
            <span className="nav-glyph" aria-hidden="true">
              {tabInitials[link.label]}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(getInstallPrompt);
  useEffect(() => {
    const onPrompt = () => setPromptEvent(getInstallPrompt());
    window.addEventListener('takaran:installprompt', onPrompt);
    return () => window.removeEventListener('takaran:installprompt', onPrompt);
  }, []);
  if (!promptEvent) return null;
  return (
    <button
      className="install-button"
      onClick={async () => {
        try {
          await promptEvent.prompt();
          await promptEvent.userChoice;
        } finally {
          clearInstallPrompt();
          setPromptEvent(null);
        }
      }}
      type="button"
    >
      Instal
    </button>
  );
}
