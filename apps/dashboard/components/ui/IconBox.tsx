import { clsx } from 'clsx'

interface IconBoxProps {
  children: React.ReactNode
  variant?: 'blue' | 'cyan' | 'consumer' | 'provider'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function IconBox({
  children,
  variant = 'blue',
  size = 'md',
  className,
}: IconBoxProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        size === 'sm' && 'w-8 h-8',
        size === 'md' && 'w-12 h-12',
        size === 'lg' && 'w-14 h-14',
        (variant === 'blue' || variant === 'provider') && 'bg-accent-blue/10 border border-accent-blue/20',
        (variant === 'cyan' || variant === 'consumer') && 'bg-accent-cyan/10 border border-accent-cyan/20',
        className
      )}
    >
      {children}
    </div>
  )
}
