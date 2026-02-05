import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-bg-card border border-border-subtle backdrop-blur-xl transition-all duration-300',
        hover && 'hover:border-border-accent hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  )
}
