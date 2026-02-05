import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'cyan' | 'blue'
  pulse?: boolean
  className?: string
}

export function Badge({ children, variant = 'default', pulse = true, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 backdrop-blur-xl',
        'font-mono text-[0.6875rem] font-medium uppercase tracking-widest',
        'bg-bg-card border border-border-subtle',
        variant === 'cyan' && 'text-accent-cyan',
        variant === 'blue' && 'text-accent-blue',
        variant === 'default' && 'text-accent-cyan',
        className
      )}
    >
      {pulse && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full animate-pulse-dot',
            variant === 'cyan' && 'bg-accent-cyan',
            variant === 'blue' && 'bg-accent-blue',
            variant === 'default' && 'bg-accent-cyan'
          )}
        />
      )}
      {children}
    </span>
  )
}
