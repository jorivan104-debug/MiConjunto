import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || React.useId()
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-700">
            {label}
          </label>
        )}
        <div
          className={cn(
            'group flex items-center rounded-xl border bg-white transition-all duration-200',
            'focus-within:border-brand-blue focus-within:shadow-glow',
            error ? 'border-brand-red shadow-glow' : 'border-ink-200',
          )}
        >
          {leftIcon && <span className="pl-3 text-ink-400">{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex-1 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none',
              'min-h-[44px]',
              className,
            )}
            {...props}
          />
          {rightIcon && <span className="pr-3 text-ink-400">{rightIcon}</span>}
        </div>
        {(error || hint) && (
          <p className={cn('mt-1.5 text-xs', error ? 'text-brand-red' : 'text-ink-500')}>
            {error || hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export default Input
