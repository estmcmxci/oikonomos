import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   Button Component — Arkham-Inspired Design
   ═══════════════════════════════════════════════════════════════════ */

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: [
    'bg-[var(--color-interactive)] text-white',
    'hover:bg-[var(--color-interactive-hover)]',
    'active:bg-[var(--color-interactive-active)]',
  ].join(' '),
  secondary: [
    'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
    'border border-[var(--color-border-default)]',
    'hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-primary)]',
  ].join(' '),
  outline: [
    'bg-transparent text-[var(--color-text-secondary)]',
    'border border-[var(--color-border-default)]',
    'hover:bg-[var(--color-bg-raised)] hover:border-[var(--color-border-strong)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-text-primary)]',
  ].join(' '),
  destructive: [
    'bg-[var(--color-danger)] text-white',
    'hover:bg-[var(--color-danger)]/90',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center',
          'rounded-lg font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive)]/50',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
