import React from 'react';

type Props = {
  title: string;
  children: React.ReactNode;
  href?: string;
};

export default function Card({ title, children, href }: Props) {
  const content = (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-sm transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  );
  return href ? (
    <a href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
      {content}
    </a>
  ) : (
    content
  );
}
