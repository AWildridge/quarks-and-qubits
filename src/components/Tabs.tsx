import React from 'react';

type Tab = { id: string; label: string; content: string };

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = React.useState(0);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') setActive((i) => (i + 1) % tabs.length);
    if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + tabs.length) % tabs.length);
  }
  React.useEffect(() => {
    tabRefs.current[active]?.focus();
  }, [active]);

  return (
    <div onKeyDown={onKeyDown}>
      <div
        role="tablist"
        aria-label="Tabs"
        className="flex gap-2 border-b border-gray-200 dark:border-gray-800"
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={i === active}
            aria-controls={`panel-${t.id}`}
            ref={(el) => (tabRefs.current[i] = el)}
            className={`px-3 py-2 rounded-t-md ${i === active ? 'bg-blue-600 text-white' : 'bg-transparent text-blue-700 dark:text-blue-300'}`}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={i !== active}
          className="p-4 border border-t-0 border-gray-200 dark:border-gray-800"
        >
          <p>{t.content}</p>
        </div>
      ))}
    </div>
  );
}
