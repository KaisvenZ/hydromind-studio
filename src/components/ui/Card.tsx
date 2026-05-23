import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  level?: 1 | 2
  hover?: boolean
}

export function Card({ children, className, level = 2, hover = true }: CardProps) {
  return (
    <div className={clsx('panel', `panel-level-${level}`, hover && 'panel-hover', className)}>
      {children}
    </div>
  )
}
