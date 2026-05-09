(() => {
  const storedTheme = localStorage.getItem('theme') || 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle(
    'dark',
    storedTheme === 'dark' || (storedTheme === 'system' && prefersDark),
  );
})();
