import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-white border border-zinc-200 rounded-xl shadow-sm', className)}>
      {children}
    </div>
  )
}
