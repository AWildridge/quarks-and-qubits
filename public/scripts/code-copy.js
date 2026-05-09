document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('pre > code').forEach((code) => {
    const pre = code.parentElement;
    if (!pre || pre.querySelector('[data-copy-code]')) return;

    pre.style.position = 'relative';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Copy';
    button.dataset.copyCode = 'true';
    Object.assign(button.style, {
      position: 'absolute',
      right: '0.5rem',
      top: '0.5rem',
      borderRadius: '0.25rem',
      background: '#1f2937',
      color: '#fff',
      border: '0',
      padding: '0.25rem 0.5rem',
      fontSize: '0.75rem',
      cursor: 'pointer',
    });
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(code.textContent || '');
      button.textContent = 'Copied';
      window.setTimeout(() => {
        button.textContent = 'Copy';
      }, 1600);
    });
    pre.append(button);
  });
});
