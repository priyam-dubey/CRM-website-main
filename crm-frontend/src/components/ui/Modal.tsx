import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const SIZES: Record<string,string> = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' }

export const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: keyof typeof SIZES }>(
  ({ className, children, size = 'md', ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
      <DialogPrimitive.Content ref={ref}
        className={cn('fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full bg-white rounded-lg shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto', SIZES[size], className)}
        {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 opacity-70 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
)
DialogContent.displayName = 'DialogContent'

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('px-6 pt-6 pb-4 border-b border-slate-200', className)} {...props} />
export const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('px-6 py-4', className)} {...props} />
export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-lg', className)} {...props} />
export const DialogTitle = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  ({ className, ...props }, ref) =>
    <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-slate-900', className)} {...props} />
)
DialogTitle.displayName = 'DialogTitle'
export const DialogDescription = DialogPrimitive.Description

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, loading = false }:
  { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; loading?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription className="mt-1 text-sm text-slate-500">{description}</DialogDescription></DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
