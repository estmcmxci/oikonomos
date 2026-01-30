import { clsx } from 'clsx';
import { type HTMLAttributes, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   Badge Component — Arkham-Inspired Design
   Status indicators, labels, counts
   ═══════════════════════════════════════════════════════════════════ */

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'brand';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]',
  success: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-muted)] text-[var(--color-danger)]',
  info: 'bg-[var(--color-info-muted)] text-[var(--color-info)]',
  outline: 'bg-transparent border border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
  brand: [
    'bg-gradient-to-r from-[var(--color-brand-blue)]/20 to-[var(--color-brand-purple)]/20',
    'text-[var(--color-brand-blue)]',
  ].join(' '),
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] rounded',
  md: 'px-2 py-0.5 text-[11px] rounded',
  lg: 'px-2.5 py-1 text-xs rounded-md',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot,
  dotColor,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full mr-1.5"
          style={{ backgroundColor: dotColor || 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Status Badge — Semantic status indicator
   ═══════════════════════════════════════════════════════════════════ */

type Status = 'active' | 'pending' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

const statusConfig: Record<Status, { variant: BadgeVariant; label: string }> = {
  active: { variant: 'info', label: 'Active' },
  pending: { variant: 'warning', label: 'Pending' },
  success: { variant: 'success', label: 'Success' },
  error: { variant: 'danger', label: 'Error' },
  warning: { variant: 'warning', label: 'Warning' },
  info: { variant: 'info', label: 'Info' },
  neutral: { variant: 'default', label: '—' },
};

interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status: Status;
  label?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, label, showDot = true, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} dot={showDot} {...props}>
      {label || config.label}
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Count Badge — Numeric indicator
   ═══════════════════════════════════════════════════════════════════ */

interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
}

export function CountBadge({ count, max = 99, ...props }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString();
  return (
    <Badge variant="outline" size="sm" {...props}>
      {displayCount}
    </Badge>
  );
}
