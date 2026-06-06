import * as React from 'react'
import { cn } from '@/lib/utils'

type Tone = 'success' | 'info' | 'danger' | 'warning' | 'neutral'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
}

const TONE: Record<Tone, string> = {
  success: 'bg-brand-green-light text-brand-green',
  info: 'bg-brand-blue-light text-brand-blue',
  danger: 'bg-brand-red-light text-brand-red',
  warning: 'bg-brand-yellow-light text-[#8a6300]',
  neutral: 'bg-ink-100 text-ink-600',
}

const DOT: Record<Tone, string> = {
  success: 'bg-brand-green',
  info: 'bg-brand-blue',
  danger: 'bg-brand-red',
  warning: 'bg-brand-yellow',
  neutral: 'bg-ink-400',
}

export function Badge({ className, tone = 'neutral', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        TONE[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT[tone])} />}
      {children}
    </span>
  )
}

export default Badge
