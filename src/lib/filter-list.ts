/** Filter pre-rendered content without depending on an application server. */
export function enhanceFilters(form: HTMLFormElement, list: HTMLElement, count: HTMLElement) {
  const items = Array.from(list.querySelectorAll<HTMLElement>('[data-filter-item]'));
  const controls = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name], select[name]'),
  );
  function syncFromUrl() {
    const params = new URLSearchParams(location.search);
    controls.forEach((control) => {
      control.value = params.get(control.name) || '';
    });
    apply(false);
  }
  function apply(updateUrl = true) {
    let visible = 0;
    for (const item of items) {
      const matches = controls.every(({ name, value }) => {
        if (!value) return true;
        if (name === 'q')
          return (item.dataset.search || '').toLowerCase().includes(value.trim().toLowerCase());
        if (name === 'tag')
          return (JSON.parse(item.dataset.tags || '[]') as string[]).includes(value);
        return item.dataset[name] === value;
      });
      item.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = `Showing ${visible} of ${items.length} ${list.dataset.label || 'results'}`;
    const empty = document.querySelector<HTMLElement>('[data-filter-empty]');
    if (empty) empty.hidden = visible !== 0;
    if (updateUrl) {
      const url = new URL(location.href);
      controls.forEach(({ name, value }) => {
        if (value) url.searchParams.set(name, value);
        else url.searchParams.delete(name);
      });
      history.replaceState(null, '', url);
    }
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    apply();
  });
  form.addEventListener('change', () => apply());
  form.addEventListener('input', () => apply());
  window.addEventListener('popstate', syncFromUrl);
  syncFromUrl();
}
