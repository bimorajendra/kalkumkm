'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { applyTheme, getTheme, setTheme, type ThemeChoice } from '@/lib/theme';

const choices: ThemeChoice[] = ['system', 'light', 'dark'];
const labels: Record<ThemeChoice, string> = {
  system: 'Ikuti perangkat',
  light: 'Terang',
  dark: 'Gelap',
};
const icons = { system: Monitor, light: Sun, dark: Moon } as const;

/** Tombol ganti tema. `withLabel` menampilkan nama pilihan di samping ikon. */
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const [choice, setChoice] = useState<ThemeChoice>('system');

  useEffect(() => {
    setChoice(getTheme());
    const query = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getTheme() === 'system') applyTheme('system');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const Icon = icons[choice];
  return (
    <Button
      type="button"
      variant="ghost"
      size={withLabel ? 'default' : 'icon'}
      aria-label={`Tema: ${labels[choice]}. Ganti tema`}
      onClick={() => {
        const next = choices[(choices.indexOf(choice) + 1) % choices.length];
        setChoice(setTheme(next ?? 'system'));
      }}
    >
      <Icon aria-hidden="true" />
      {withLabel ? <span>Tema: {labels[choice]}</span> : null}
    </Button>
  );
}
