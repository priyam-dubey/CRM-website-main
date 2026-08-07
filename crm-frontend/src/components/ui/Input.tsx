import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftAddon?: React.ReactNode; rightAddon?: React.ReactNode; error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftAddon, rightAddon, error, ...props }, ref) => (
    <div className="relative flex items-center w-full">
      {leftAddon && <div className="pointer-events-none absolute left-3 text-slate-400">{leftAddon}</div>}
      <input type={type} ref={ref} className={cn(
        'flex h-9 w-full rounded border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
        'border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:cursor-not-allowed disabled:bg-slate-50 transition-colors',
        error && 'border-red-500 focus-visible:ring-red-500',
        leftAddon && 'pl-9', rightAddon && 'pr-9', className,
      )} {...props} />
      {rightAddon && <div className="absolute right-3 text-slate-400">{rightAddon}</div>}
    </div>
  )
)
Input.displayName = 'Input'
