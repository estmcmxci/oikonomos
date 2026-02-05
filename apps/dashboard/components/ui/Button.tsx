import { clsx } from 'clsx'
import Link from 'next/link'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  href?: string
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
}

export function Button({
  children,
  variant = 'primary',
  href,
  onClick,
  className,
  type = 'button',
}: ButtonProps) {
  const baseStyles = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  const combinedClassName = clsx(baseStyles, className)

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} className={combinedClassName}>
      {children}
    </button>
  )
}
