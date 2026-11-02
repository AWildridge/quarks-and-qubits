(() => {
  let theme = 'system';
  try {
    theme = localStorage.getItem('theme') || theme;
  } catch {
    /* Storage can be disabled. */
  }
  document.documentElement.classList.toggle(
    'dark',
    theme === 'dark' ||
      (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  );
})();
