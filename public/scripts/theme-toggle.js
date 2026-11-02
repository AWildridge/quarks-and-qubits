document.addEventListener('DOMContentLoaded', () => {
  const choices = Array.from(document.querySelectorAll('[data-theme-choice]'));
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let activeTheme = 'system';
  try {
    activeTheme = localStorage.getItem('theme') || activeTheme;
  } catch {
    /* Storage can be disabled. */
  }
  function applyTheme(theme) {
    activeTheme = ['light', 'dark', 'system'].includes(theme) ? theme : 'system';
    try {
      localStorage.setItem('theme', activeTheme);
    } catch {
      /* The choice still works for this page. */
    }
    document.documentElement.classList.toggle(
      'dark',
      activeTheme === 'dark' || (activeTheme === 'system' && media.matches),
    );
    choices.forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.getAttribute('data-theme-choice') === activeTheme),
      ),
    );
  }
  choices.forEach((button) =>
    button.addEventListener('click', () => applyTheme(button.getAttribute('data-theme-choice'))),
  );
  media.addEventListener('change', () => {
    if (activeTheme === 'system') applyTheme('system');
  });
  applyTheme(activeTheme);
});
