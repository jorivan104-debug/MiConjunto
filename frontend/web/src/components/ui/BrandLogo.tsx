import { cn } from '@/lib/utils'

type Variant = 'full' | 'name' | 'icon'

interface BrandLogoProps {
  variant?: Variant
  className?: string
  alt?: string
}

const SOURCES: Record<Variant, string> = {
  full: '/brand/logo.png',
  name: '/brand/name.png',
  icon: '/brand/logosolo.png',
}

const DEFAULT_HEIGHT: Record<Variant, string> = {
  full: 'h-24',
  name: 'h-9',
  icon: 'h-9',
}

export function BrandLogo({ variant = 'icon', className, alt = 'Mi Conjunto' }: BrandLogoProps) {
  return (
    <img
      src={SOURCES[variant]}
      alt={alt}
      className={cn('w-auto select-none object-contain', DEFAULT_HEIGHT[variant], className)}
      draggable={false}
    />
  )
}

export default BrandLogo
