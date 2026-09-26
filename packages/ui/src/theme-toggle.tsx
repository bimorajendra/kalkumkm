import { useState } from 'react';
import { getTheme, setTheme, type ThemeChoice } from './theme';

const choices: ThemeChoice[] = ['system', 'light', 'dark'];
const labels: Record<ThemeChoice, string> = {
  system: 'Ikuti perangkat',
  light: 'Terang',
  dark: 'Gelap',
};

export function ThemeToggle() {
  const [choice, setChoice] = useState(getTheme);
  function cycleTheme() {
    const next =
      choices[(choices.indexOf(choice) + 1) % choices.length] ?? 'system';
    setChoice(setTheme(next));
  }
  return (
    <button type="button" aria-label="Ganti tema" onClick={cycleTheme}>
      Tema: {labels[choice]}
    </button>
  );
}
