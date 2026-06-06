import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'community' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-green text-white hover:brightness-105 shadow-soft',
  secondary: 'bg-brand-blue text-white hover:brightness-105 shadow-soft',
  danger: 'bg-brand-red text-white hover:brightness-105 shadow-soft',
  community: 'bg-brand-yellow text-ink-900 hover:brightness-105 shadow-soft',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100',
  outline:
    'bg-white text-ink-700 border border-ink-200 hover:border-brand-blue hover:text-brand-blue',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-2xl',
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !loading ? { scale: 1.04 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium select-none transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </motion.button>
    )
  },
)
Button.displayName = 'Button'

export default Button
