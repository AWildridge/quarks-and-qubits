import React from 'react';

type Props = {
  children: React.ReactNode;
};

export default function Tag({ children }: Props) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}
