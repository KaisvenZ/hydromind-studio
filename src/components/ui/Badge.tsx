import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue'
  size?: 'sm' | 'md'
  icon?: ReactNode
  className?: string
}

export function Badge({ children, variant = 'default', size = 'md', icon, className }: BadgeProps) {
  return (
    <span className={clsx('badge', `badge-${variant}`, `badge-${size}`, className)}>
      {icon}
      {children}
    </span>
  )
}
