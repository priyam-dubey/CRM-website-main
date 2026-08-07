import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './Label'

interface FormFieldProps {
  label?: string; hint?: string; error?: string; required?: boolean; htmlFor?: string; className?: string; children: React.ReactNode
}

export function FormField({ label, hint, error, required, htmlFor, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={htmlFor} required={required}>{label}</Label>}
      {children}
      {error ? <p className="text-xs text-red-600" role="alert">{error}</p>
             : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}
