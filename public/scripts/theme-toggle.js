document.addEventListener('DOMContentLoaded', () => {
  const choices = Array.from(document.querySelectorAll('[data-theme-choice]'));
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    const activeTheme = theme || localStorage.getItem('theme') || 'system';
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
