import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   Input Component — Arkham-Inspired Design
   ═══════════════════════════════════════════════════════════════════ */

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  inputSize?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      inputSize = 'md',
      leftIcon,
      rightIcon,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-medium tracking-[0.05em] uppercase text-[var(--color-text-tertiary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-lg',
              'bg-[var(--color-bg-raised)]',
              'border transition-colors duration-150',
              hasError
                ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
                : 'border-[var(--color-border-subtle)] focus:border-[var(--color-border-strong)]',
              'text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2',
              hasError
                ? 'focus:ring-[var(--color-danger)]/20'
                : 'focus:ring-[var(--color-interactive)]/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              sizeStyles[inputSize],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {(hint || error) && (
          <p
            className={clsx(
              'mt-1.5 text-xs',
              hasError ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/* ═══════════════════════════════════════════════════════════════════
   Textarea Component
   ═══════════════════════════════════════════════════════════════════ */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-medium tracking-[0.05em] uppercase text-[var(--color-text-tertiary)] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full rounded-lg px-3 py-2',
            'bg-[var(--color-bg-raised)]',
            'border transition-colors duration-150',
            hasError
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
              : 'border-[var(--color-border-subtle)] focus:border-[var(--color-border-strong)]',
            'text-[var(--color-text-primary)] text-sm',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:outline-none focus:ring-2',
            hasError
              ? 'focus:ring-[var(--color-danger)]/20'
              : 'focus:ring-[var(--color-interactive)]/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-none',
            className
          )}
          {...props}
        />
        {(hint || error) && (
          <p
            className={clsx(
              'mt-1.5 text-xs',
              hasError ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
