import { cn, initials } from '@/lib/utils'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover bg-ink-100', SIZE[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-blue-light text-brand-blue font-semibold',
        SIZE[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  )
}

export default Avatar
