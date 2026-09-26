import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'card' | 'link';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  navigates?: boolean;
}

export function Button({
  children,
  className = '',
  navigates = false,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`takaran-button takaran-button--${variant} ${className}`.trim()}
    >
      <span>{children}</span>
      {navigates ? (
        <span aria-hidden="true" className="takaran-button__chevron">
          ›
        </span>
      ) : null}
    </button>
  );
}
