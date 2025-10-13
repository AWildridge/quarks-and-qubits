import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export const Button: React.FC<Props> = ({ variant = 'primary', className = '', ...rest }) => {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500'
      : 'bg-transparent text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 focus-visible:ring-blue-500';
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
};

export default Button;
