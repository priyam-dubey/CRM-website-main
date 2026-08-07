import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full font-medium', {
  variants: {
    variant: {
      default: 'bg-slate-100 text-slate-600',
      success: 'bg-green-50 text-green-700',
      warning: 'bg-yellow-50 text-yellow-700',
      error: 'bg-red-50 text-red-700',
      info: 'bg-cyan-50 text-cyan-700',
      primary: 'bg-blue-50 text-blue-700',
      outline: 'border border-slate-200 text-slate-600',
    },
    size: { sm: 'px-2 py-0.5 text-xs', default: 'px-2.5 py-0.5 text-xs' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { dot?: boolean }

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  const dotColors: Record<string, string> = {
    default:'bg-slate-400', success:'bg-green-500', warning:'bg-yellow-500',
    error:'bg-red-500', info:'bg-cyan-500', primary:'bg-blue-500', outline:'bg-slate-400',
  }
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant ?? 'default'])} />}
      {children}
    </span>
  )
}
