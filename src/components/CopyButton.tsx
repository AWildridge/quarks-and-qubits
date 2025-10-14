import React from 'react';

type Props = {
  text: string;
  className?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
};

export default function CopyButton({ text, className, ariaLabel, children }: Props) {
  const [copied, setCopied] = React.useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <button type="button" className={className} aria-label={ariaLabel} onClick={onClick}>
      {copied ? 'Copied' : (children ?? 'Copy')}
    </button>
  );
}
