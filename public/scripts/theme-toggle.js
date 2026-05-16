document.addEventListener('DOMContentLoaded', () => {
  const choices = Array.from(document.querySelectorAll('[data-theme-choice]'));
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const validThemes = new Set(['light', 'dark', 'system']);

  function applyTheme(theme) {
    const storedTheme = localStorage.getItem('theme');
    const activeTheme = validThemes.has(theme)
      ? theme
      : validThemes.has(storedTheme)
        ? storedTheme
        : 'system';
    localStorage.setItem('theme', activeTheme);
    document.documentElement.classList.toggle(
      'dark',
      activeTheme === 'dark' || (activeTheme === 'system' && media.matches),
    );
    choices.forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        button.getAttribute('data-theme-choice') === activeTheme ? 'true' : 'false',
      );
    });
  }

  choices.forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(button.getAttribute('data-theme-choice'));
    });
  });
  media.addEventListener('change', () => {
    if ((localStorage.getItem('theme') || 'system') === 'system') applyTheme('system');
  });
  applyTheme();
});
