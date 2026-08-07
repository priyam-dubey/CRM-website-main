import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn, initials, avatarColor } from '@/lib/utils'

const sizes: Record<string,string> = { xs:'h-6 w-6 text-[10px]', sm:'h-8 w-8 text-xs', md:'h-9 w-9 text-sm', lg:'h-12 w-12 text-base' }

interface AvatarProps { name: string; src?: string|null; size?: 'xs'|'sm'|'md'|'lg'; className?: string }

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn('relative flex shrink-0 overflow-hidden rounded-full', sizes[size], className)}>
      {src && <AvatarPrimitive.Image src={src} alt={name} className="aspect-square h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full text-white font-medium"
        style={{ backgroundColor: avatarColor(name) }}>
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
