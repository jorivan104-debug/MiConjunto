import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean
  tone?: 'default' | 'green' | 'blue' | 'red' | 'yellow'
}

const TONE_CLASSES: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'bg-white border-ink-100',
  green: 'bg-brand-green-light border-transparent',
  blue: 'bg-brand-blue-light border-transparent',
  red: 'bg-brand-red-light border-transparent',
  yellow: 'bg-brand-yellow-light border-transparent',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, tone = 'default', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -2, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' } : undefined}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'rounded-2xl border shadow-soft p-5 md:p-6',
          TONE_CLASSES[tone],
          interactive && 'cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  },
)
Card.displayName = 'Card'

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex items-start justify-between gap-3 mb-4', className)} {...props} />
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('text-base font-semibold text-ink-900', className)} {...props} />
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-sm text-ink-500', className)} {...props} />
)

export default Card
