export type ThemeChoice = 'system' | 'light' | 'dark';

const storageKey = 'takaran-theme';

export function getTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function setTheme(theme: ThemeChoice): ThemeChoice {
  let saved = true;
  try {
    if (theme === 'system') localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, theme);
  } catch {
    saved = false;
  }
  const appliedTheme = saved ? theme : 'system';
  applyTheme(appliedTheme);
  return appliedTheme;
}

export function applyTheme(theme: ThemeChoice): void {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (theme === 'system' && !dark)
    document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'system') applyTheme('system');
});
