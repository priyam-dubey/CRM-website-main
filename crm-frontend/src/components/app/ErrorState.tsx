import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function ErrorState({ title = 'Something went wrong', description = 'Failed to load data.', onRetry, className }:
  { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 p-4 rounded-full bg-red-50"><AlertTriangle className="h-8 w-8 text-red-600" /></div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      {onRetry && <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>Try again</Button>}
    </div>
  )
}
