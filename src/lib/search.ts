export type ProjectRecord = {
  slug: string;
  title: string;
  summary?: string;
  tags: string[];
  year: number;
  language?: string;
};

export function filterProjects(
  items: ProjectRecord[],
  opts: { q?: string; tag?: string; year?: string; language?: string },
) {
  const q = (opts.q || '').toLowerCase();
  const tag = opts.tag || '';
  const year = opts.year || '';
  const language = opts.language || '';
  return items.filter((p) => {
    const matchesQ =
      !q || p.title.toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q);
    const matchesTag = !tag || p.tags.includes(tag);
    const matchesYear = !year || String(p.year) === year;
    const matchesLang = !language || (p.language || '') === language;
    return matchesQ && matchesTag && matchesYear && matchesLang;
  });
}
