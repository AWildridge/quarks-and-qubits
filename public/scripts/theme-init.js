(() => {
  const validThemes = new Set(['light', 'dark', 'system']);
  const storedTheme = localStorage.getItem('theme');
  const theme = validThemes.has(storedTheme) ? storedTheme : 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle(
    'dark',
    theme === 'dark' || (theme === 'system' && prefersDark),
  );
})();
