import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'yellow' | 'gray' | 'indigo' | 'blue' | 'orange'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        {
          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200': variant === 'green',
          'bg-red-50 text-red-600 ring-1 ring-red-200': variant === 'red',
          'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200': variant === 'yellow',
          'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200': variant === 'gray',
          'bg-blue-50 text-blue-700 ring-1 ring-blue-200': variant === 'indigo' || variant === 'blue',
          'bg-orange-50 text-orange-700 ring-1 ring-orange-200': variant === 'orange',
        },
        className,
      )}
    >
      {children}
    </span>
  )
}
