(() => {
  try {
    const stored = localStorage.getItem('takaran-theme');
    const choice = stored === 'light' || stored === 'dark' ? stored : 'system';
    const isDark =
      choice === 'dark' ||
      (choice === 'system' &&
        matchMedia('(prefers-color-scheme: dark)').matches);
    if (choice !== 'system') document.documentElement.dataset.theme = choice;
    else if (isDark) document.documentElement.dataset.theme = 'dark';
  } catch {}
})();
