'use client'

import { clsx } from 'clsx'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-emerald-600 hover:bg-emerald-700 text-white': variant === 'primary',
          'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-sm': variant === 'secondary',
          'hover:bg-zinc-100 text-zinc-600': variant === 'ghost',
          'bg-red-500 hover:bg-red-600 text-white': variant === 'danger',
          'text-xs px-2.5 py-1.5': size === 'sm',
          'text-sm px-4 py-2': size === 'md',
          'text-sm px-5 py-2.5': size === 'lg',
        },
        className,
      )}
    />
  )
}
