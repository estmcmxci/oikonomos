import { clsx } from 'clsx';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   Card Component — Arkham-Inspired Design
   ═══════════════════════════════════════════════════════════════════ */

type CardVariant = 'default' | 'elevated' | 'interactive' | 'highlight';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[var(--color-bg-raised)] border-[var(--color-border-subtle)]',
  elevated: 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)]',
  interactive: [
    'bg-[var(--color-bg-raised)] border-[var(--color-border-subtle)]',
    'cursor-pointer transition-all duration-150',
    'hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-default)]',
  ].join(' '),
  highlight: [
    'bg-[var(--color-bg-raised)] border-transparent',
    'bg-gradient-to-r from-[var(--color-brand-blue)]/10 to-[var(--color-brand-purple)]/10',
    'ring-1 ring-[var(--color-brand-blue)]/20',
  ].join(' '),
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, variant = 'default', padding = 'lg', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg border',
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

/* ═══════════════════════════════════════════════════════════════════
   Card Header
   ═══════════════════════════════════════════════════════════════════ */

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  border?: boolean;
}

export function CardHeader({ children, className, border = false, ...props }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between mb-4',
        border && 'pb-4 border-b border-[var(--color-border-subtle)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Title
   ═══════════════════════════════════════════════════════════════════ */

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  size?: 'sm' | 'md' | 'lg';
}

const titleSizeStyles = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-lg font-semibold',
};

export function CardTitle({
  children,
  className,
  as: Component = 'h3',
  size = 'md',
  ...props
}: CardTitleProps) {
  return (
    <Component
      className={clsx(
        titleSizeStyles[size],
        'text-[var(--color-text-primary)]',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Label (Uppercase metadata style)
   ═══════════════════════════════════════════════════════════════════ */

interface CardLabelProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function CardLabel({ children, className, ...props }: CardLabelProps) {
  return (
    <span
      className={clsx(
        'text-[11px] font-medium tracking-[0.05em] uppercase',
        'text-[var(--color-text-tertiary)]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Value (Large data display)
   ═══════════════════════════════════════════════════════════════════ */

interface CardValueProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  trend?: 'up' | 'down' | 'neutral';
}

const valueSizeStyles = {
  sm: 'text-lg font-medium',
  md: 'text-2xl font-semibold',
  lg: 'text-3xl font-bold',
};

const trendColorStyles = {
  up: 'text-[var(--color-success)]',
  down: 'text-[var(--color-danger)]',
  neutral: 'text-[var(--color-text-primary)]',
};

export function CardValue({
  children,
  className,
  size = 'md',
  trend = 'neutral',
  ...props
}: CardValueProps) {
  return (
    <div
      className={clsx(
        valueSizeStyles[size],
        trendColorStyles[trend],
        'tabular-nums tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
